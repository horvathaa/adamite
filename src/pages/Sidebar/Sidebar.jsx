import React from 'react';
import './Sidebar.css';
import filter from '../../assets/img/SVGs/filter.svg';
import classNames from 'classnames';
import Title from './containers/Title/Title';
import Authentication from './containers//Authentication//Authentication';
import AnnotationList from './containers/AnnotationList/AnnotationList';
import NewAnnotation from './containers/NewAnnotation/NewAnnotation';
import Filter from './containers/Filter/Filter';
import FilterSummary from './containers/Filter/FilterSummary';
import SearchBar from './containers/SearchBar/SearchBar';
import { Button } from 'react-bootstrap';
import { left } from 'glamor';
import { AiOutlineConsoleSql } from 'react-icons/ai';



class Sidebar extends React.Component {
  constructor(props) {
    super(props); // deprecated - change
    if (this.unsubscribeAnnotations) {
      this.unsubscribeAnnotations();
    }
  }
  state = {
    url: '',
    annotations: [],
    filteredAnnotations: [],
    searchedAnnotations: [],
    groupAnnotations: [],
    filteredGroupAnnotations: [],
    newSelection: null,
    rect: null,
    offsets: null,
    xpath: null,
    newAnnotationType: 'default',
    currentUser: undefined,
    selected: undefined,
    activeGroups: [],
    groups: [],
    dropdownOpen: false,
    searchBarInputText: '',
    searchState: false,
    showFilter: false,
    showPinned: false,
    pinnedAnnos: [],
    annotatingPage: false,
    showClearClickedAnnotation: false,
    askAboutRelatedAnnos: false,
    relatedQuestions: [],
    searchCount: 0,
    pageName: '',
    sortBy: 'page',
    pageLocationSort: [],
    filterSelection: {
      siteScope: ['onPage'],
      userScope: ['public'],
      annoType: ['default', 'to-do', 'question', 'highlight', 'issue'],
      timeRange: 'all',
      archive: null,
      tags: []
    }
  };


  setUpAnnotationsListener = (uid, url, tabId) => {
    chrome.runtime.sendMessage(
      {
        msg: 'GET_ANNOTATIONS_PAGE_LOAD',
        url: url,
        uid: uid,
        tabId: tabId
      }
    );

  };

  setUpGroupsListener = (uid) => {
    chrome.runtime.sendMessage({
      msg: 'GET_GROUPS_PAGE_LOAD',
      from: 'content',
      uid: uid
    });
  }

  setUpPinnedListener = (uid) => {
    chrome.runtime.sendMessage({
      msg: 'SET_UP_PIN',
      from: 'content',
    });
  }

  // componentWillMount() {
  //   if (this.unsubscribeAnnotations) {
  //     this.unsubscribeAnnotations();
  //   }
  // }
  // UNSAFE_componentWillMount() {
  //   if (this.unsubscribeAnnotations) {
  //     this.unsubscribeAnnotations();
  //   }
  // }

  componentWillUnmount() {
    // console.log('in unmount????');
    window.removeEventListener('scroll', this.handleScroll);
    chrome.runtime.sendMessage({
      from: 'content',
      msg: 'UNSUBSCRIBE'
    });
  }

  ElasticSearch = (msg) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        let url = tabs[0].url;
        chrome.runtime.sendMessage({
          msg: msg,
          url: url
        },
          response => { resolve(response) });
      });
    });
  }

  handleScroll = (event, filterSelection) => {
    const scrollIsAtTheBottom = (document.documentElement.scrollHeight - window.innerHeight) - 1 <= Math.floor(window.scrollY);
    if (scrollIsAtTheBottom && this.state.searchState) {
      this.ElasticSearch("SCROLL_ELASTIC")
        .then(res => {
          const results = res.response.data.hits.hits.map(h => h._source)
          this.setState({
            searchedAnnotations: this.state.searchedAnnotations.concat(results)
          })
        })
    }
    else if (scrollIsAtTheBottom && filterSelection.siteScope.includes('acrossWholeSite')) {
      this.filterAcrossWholeSite(filterSelection);
    }
  }

  componentDidMount() {
    window.addEventListener('scroll', (event) => this.handleScroll(event, this.state.filterSelection));
    chrome.runtime.sendMessage(
      {
        msg: 'GET_CURRENT_USER',
      },
      currentUserData => {
        this.setState({ currentUser: currentUserData.payload.currentUser });
        if (currentUserData.payload.currentUser) {
          // console.log('in this set up groups listener');
          this.setUpGroupsListener(
            currentUserData.payload.currentUser.uid
          );
          this.setUpPinnedListener();
        }
        // chrome.runtime.sendMessage(
        //   {
        //     msg: 'REQUEST_TAB_INFO',
        //   },
        //   tabInfo => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          let tab = tabs[0];
          this.setState({ url: this.getPathFromUrl(tab.url), tabId: tab.id });
          if (currentUserData.payload.currentUser) {
            this.setUpAnnotationsListener(
              currentUserData.payload.currentUser.uid,
              this.getPathFromUrl(tab.url),
              tab.id
            );
          } else {
            if (this.unsubscribeAnnotations) {
              this.unsubscribeAnnotations();
            }
          }
          // })
        }
        );
      }
    );

    chrome.runtime.sendMessage({
      from: 'content',
      msg: 'GET_PINNED_ANNOTATIONS'
    }, response => {
      this.setState({ pinnedAnnos: response.annotations });
    })

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // console.log('caught this message', request, sender);
      if (
        request.from === 'background' &&
        request.msg === 'USER_AUTH_STATUS_CHANGED'
      ) {
        this.setState({ currentUser: request.payload.currentUser });
        if (request.payload.currentUser) {
          this.setUpAnnotationsListener(
            request.payload.currentUser.uid,
            this.state.url
          );
        } else {
          if (this.unsubscribeAnnotations) {
            this.unsubscribeAnnotations();
          }
        }
      } else if (
        request.from === 'background' &&
        request.msg === 'CONTENT_SELECTED'
      ) {
        const { selection, offsets, xpath, type, annoContent } = request.payload;
        this.setState({
          newSelection: selection,
          offsets: offsets,
          xpath: xpath,
          newAnnotationType: type,
          newAnnotationContent: annoContent
        });
      }
      //  else if (
      //   request.from === 'background' &&
      //   request.msg === 'CONTENT_NOT_SELECTED'
      // ) {
      //   // should check whether annotation has user-added content or not - will need to request
      //   // child annotation's state
      //   this.resetNewSelection();
      // } 
      else if (request.from === 'background' && request.msg === 'PINNED_CHANGED') {
        this.setState({
          pinnedAnnos: request.payload
        });
      }
      // else if (request.from === 'content' && request.msg === 'ANCHOR_BROKEN') {
      //   console.log('this worked', request.payload);
      // }
      else if (
        request.from === 'content' &&
        request.msg === 'ANCHOR_CLICKED'
      ) {
        const { target } = request.payload
        let childAnchorId = [];
        let replyAnchorId = [];
        if (request.payload.url === this.state.url) {
          // this.setState({
          let clickedAnnos = this.state.annotations.filter(element => {
            let repliesWithAnchors = element.replies !== undefined && element.replies !== null && element.replies.length ? this.containsReplyWithAnchor(element.replies) : [];
            if (element.childAnchor !== undefined && element.childAnchor !== null && element.childAnchor.length) {
              let doesContain = false;
              element.childAnchor.forEach(c => {
                if (c.url === this.state.url) {
                  target.forEach(id => {
                    if ((String(c.parentId) + '-' + String(c.id)) === id) {
                      childAnchorId.push(String(c.parentId) + '-' + String(c.id));
                      doesContain = true;
                    }
                  })
                }
              })
              if (!doesContain) {
                doesContain = target.includes(element.id);
              }
              return doesContain;
            }
            else if (repliesWithAnchors.length) {
              let doesContain = false;
              repliesWithAnchors.forEach(r => {
                if (r.url === this.state.url) {
                  target.forEach(id => {
                    if ((String(element.id) + '-' + String(r.replyId)) === id) {
                      doesContain = true;
                      replyAnchorId.push(String(element.id) + '-' + String(r.replyId))
                    }
                  })
                }
              })
              if (!doesContain) {
                doesContain = target.includes(element.id);
              }
              return doesContain;
            }
            return target.includes(element.id);
          })
          // });
          // this.setState({ showClearClickedAnnotation: true });
          // clickedAnnos = clickedAnnos.forEach(anno => {
          //   console.log('id', id);
          //   return anno.id.includes('-') ? id.substring(0, id.indexOf('-')) : id
          // })
          clickedAnnos.forEach(anno => {
            // setTimeout(() => {
            let annoDiv = document.getElementById(anno.id);
            annoDiv.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
            // annoDiv.style.backgroundColor = "purple";
            let anchors = annoDiv.querySelectorAll(".AnchorContainer");
            // console.log('anchors', anchors);
            anchors.forEach(anch => {
              anch.classList.add("Clicked")
            })
            chrome.tabs.sendMessage(
              this.state.tabId,
              {
                msg: 'ANNOTATION_FOCUS',
                id: anno.id,
                // replyId: this.props.replyId
              }
            );
            // }, 500);

          })
          setTimeout(() => {
            clickedAnnos.forEach(anno => {
              let annoDiv = document.getElementById(anno.id);
              let anchors = annoDiv.querySelectorAll(".AnchorContainer");
              anchors.forEach(anch => {
                anch.classList.remove("Clicked")
              })
              chrome.tabs.sendMessage(
                this.state.tabId,
                {
                  msg: 'ANNOTATION_DEFOCUS',
                  id: anno.id,
                  // replyId: this.props.replyId
                }
              );
            })
          }, 2500)

        }
      } else if (
        request.from === 'background' &&
        request.msg === 'TOGGLE_SIDEBAR'
      ) {
        if (request.toStatus === false) {
          setTimeout(() => {
            // use timeout to make smooth UI transition
            this.resetNewSelection();
          }, 500);
        }
      }
      else if (request.from === 'background' && request.msg === 'GROUPS_UPDATED') {
        this.setState({ groups: request.groups });
      }
      else if (
        request.from === 'background' &&
        request.msg === 'CONTENT_UPDATED'
      ) {
        let annotations = request.payload;
        this.setState({ url: request.url });
        chrome.runtime.sendMessage({
          msg: 'REQUEST_SIDEBAR_STATUS',
          from: 'content'
        }, (sidebarOpen) => {
          if (sidebarOpen !== undefined && sidebarOpen) {
            chrome.tabs.sendMessage(request.tabId, {
              msg: 'HIGHLIGHT_ANNOTATIONS',
              payload: request.payload,
              url: request.url
            }, response => {
              let spanNames = response.spanNames;
              spanNames = spanNames.map((obj) => {
                return obj.id.includes('-') ? obj.id.substring(0, obj.id.indexOf('-')) : obj.id;
              });
              spanNames.sort((a, b) => {
                return a.y !== b.y ? a.y - b.y : a.x - b.x
              })
              annotations.sort((a, b) => {
                const index1 = spanNames.findIndex(obj => obj === a.id);
                const index2 = spanNames.findIndex(obj => obj === b.id)
                return ((index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity))
              });
              this.setState({ annotations, pageLocationSort: annotations })
              this.requestFilterUpdate();

            });
          }
          else {
            this.setState({ annotations });
            this.requestFilterUpdate();
          }
        })


        chrome.browserAction.setBadgeText({ tabId: request.tabId, text: request.payload.length ? String(request.payload.length) : "0" });
      }
      else if (request.msg === 'SORT_LIST' && request.from === 'background') {
        let spanNames = request.payload.spanNames;
        let annotations = this.state.annotations;

        spanNames = spanNames.map((obj) => {
          return obj.id.includes('-') ? obj.id.substring(0, obj.id.indexOf('-')) : obj.id;
        });
        spanNames.sort((a, b) => {
          return a.y !== b.y ? a.y - b.y : a.x - b.x
        })
        annotations.sort((a, b) => {
          const index1 = spanNames.findIndex(obj => obj === a.id);
          const index2 = spanNames.findIndex(obj => obj === b.id)
          return ((index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity))
        });

        this.setState({ annotations, pageLocationSort: annotations })
        this.requestFilterUpdate();
      }
      else if (request.from === 'background' && request.msg === 'ELASTIC_CONTENT_UPDATED') {
        if (this.state.searchedAnnotations.length !== 0) {
          chrome.runtime.sendMessage({
            msg: 'GET_ANNOTATION_BY_ID',
            from: 'content',
            payload: {
              id: request.payload
            }
          },
            (response) => {
              const { annotation } = response;
              let tempArray = this.state.searchedAnnotations;
              let index = this.state.searchedAnnotations.findIndex(anno => {
                return anno.id === annotation.id;
              });
              tempArray[index] = annotation;
              // console.log('new list', tempArray);
              this.setState({ searchedAnnotations: tempArray })
            })
        }
      }
      else if (request.from === 'background' && request.msg === 'ELASTIC_CONTENT_DELETED') {
        if (this.state.searchedAnnotations.length !== 0) {
          let id = request.payload;
          let tempArray = this.state.searchedAnnotations.filter(anno => {
            return anno.id !== id;
          });
          this.setState({ searchedAnnotations: tempArray })
        }
      }
      else if (request.from === 'background' && request.msg === 'ELASTIC_CHILD_ANCHOR_ADDED') {
        if (this.state.searchedAnnotations.length !== 0) {
          let tempArray = this.state.searchedAnnotations;
          tempArray.push(request.payload);
          this.setState({ searchedAnnotations: tempArray });
        }
      }
      else if (request.from === 'background' && request.msg === 'FILTER_BY_TAG') {
        let filterSelection = this.state.filterSelection;
        filterSelection.tags = [request.payload];
        this.setState({
          filterSelection: filterSelection,
          filteredAnnotations: this.state.annotations.filter(anno => {
            return this.checkTags(anno, [request.payload]);
          })
        });
      }
    });
  }

  // helper method from
  // https://stackoverflow.com/questions/2540969/remove-querystring-from-url
  getPathFromUrl = (url) => {
    return url.split(/[?#]/)[0];
  }

  containsObjectWithUrl = (url, list) => {
    const test = list.filter(obj => obj.url.includes(url));
    return test.length !== 0;
  }

  // if length is 0 does not contain object, else does contain object
  // stupid helper method made out of necessity
  containsObjectWithId(id, list) {
    const test = list.filter(obj => obj.id === id);
    return test.length !== 0;
  }

  // if length is 0 does not contain object, else does contain object
  // stupid helper method made out of necessity
  containsReplyWithAnchor(list) {
    const test = list.filter(obj => obj.xpath !== null);
    return test;
  }

  // helper method from 
  // https://stackoverflow.com/questions/4587061/how-to-determine-if-object-is-in-array
  containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
      if (list[i] === obj) {
        return true;
      }
    }
    return false;
  }

  // helper method from
  // https://stackoverflow.com/questions/18773778/create-array-of-unique-objects-by-property
  removeDuplicates(annotationArray) {
    const flags = new Set();
    const annotations = annotationArray.filter(anno => {
      if (flags.has(anno.id)) {
        return false;
      }
      flags.add(anno.id);
      return true;
    });
    return annotations;
  }

  handleShowAnnotatePage = () => {
    this.setState({ annotatingPage: true });
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      this.setState({ pageName: tabs[0].title });
    });
  };

  // handleUnanchoredAnnotation = () => {
  //   // this.setState({ annotatingPage: true });
  //   this.setState({ unanchored: true });
  // }

  updateSidebarGroup = (options) => {
    let groupKV = [];
    let groupNames = [];
    const { uid } = this.state.currentUser;
    // todo - check options to see whether or not the label is in activeGroups - if it is, then great, do what we already do
    // else filter it out
    if (options.length === 0) {
      this.setState({ groupAnnotations: [], activeGroups: [] });
      return;
    }
    options.forEach(group => {
      if (group.value === "onlyme") {
        groupKV.push({
          name: "onlyme", annotations: this.state.annotations.filter(anno => anno.authorId === uid)
        })
        // groupNames.push(group.label)
      }
      else if (group.value === "public") {
        groupKV.push({
          name: "public", annotations: this.state.activeGroups.includes("Only Me") ? this.state.annotations.filter(anno => anno.authorId !== uid) : this.state.annotations
        })
      }
      else {
        chrome.runtime.sendMessage({
          msg: 'GROUP_ELASTIC',
          payload: {
            gid: group.value,
            url: this.state.url
          }
        },
          (res) => {
            groupKV.push({ name: group.label, annotations: res.response.data.hits.hits.map(h => h._source) });
            // console.log('what the groupkv', groupKV);
            // groupNames.push(group.label);
            this.setState({ groupAnnotations: groupKV });
            this.setState({ activeGroups: groupNames });

          });
      }

      // console.log('what is Happening my Dude', groupKV);
      groupNames.push(group.label);
      this.setState({ groupAnnotations: groupKV });
      this.setState({ activeGroups: groupNames });
      this.setState({ filteredGroupAnnotations: [] });

    });


    // this.setState({ activeGroup: option[0].label })
  }

  notifySidebarSort = (option) => {
    this.setState({ sortBy: option });
  }

  handleRelatedQuestions = () => {
    this.setState({ askAboutRelatedAnnos: false });
    const annotations = this.state.annotations.sort((a, b) =>
      (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
    );
    const related = [annotations[0], annotations[1]];
    let boilerplate = this.state.relatedQuestions;
    boilerplate.push(related);
    this.setState({ relatedQuestions: boilerplate });
  }

  handlePinnedAnnotation = (id, pinned) => {
    let annotation;
    if (this.containsObjectWithId(id, this.state.filteredAnnotations)) {
      annotation = this.state.filteredAnnotations.filter(anno => anno.id === id);
      annotation[0].pinned = pinned;
      let remainingAnnos = this.state.filteredAnnotations.filter(anno => anno.id !== id);
      remainingAnnos.push(...annotation);
      this.setState({ filteredAnnotations: remainingAnnos });
      this.state.pinnedAnnos.push(annotation[0]);
    }
    else if (this.containsObjectWithId(id, this.state.pinnedAnnos)) {
      this.setState({ pinnedAnnos: this.state.pinnedAnnos.filter(anno => anno.id !== id) });
      chrome.runtime.sendMessage({
        msg: 'REQUEST_PIN_UPDATE',
        from: 'content',
        payload: {
          id: id,
          pinned: pinned
        }
      })
      return;
    }
    else {
      if (this.state.activeGroups.length) {
        this.state.groupAnnotations.forEach((group) => {
          if (this.containsObjectWithId(id, group.annotations)) {
            annotation = group.annotations.filter(anno => anno.id === id);
            annotation[0].pinned = pinned;
            this.state.pinnedAnnos.push(annotation[0]);
          }
        })

      }

    }
    if (!pinned) {
      // console.log(annotation);
      if (annotation[0].childAnchor !== undefined && annotation[0].childAnchor.length) {
        const idArray = [];
        annotation[0].childAnchor.forEach(anno => {
          idArray.push(anno.id);
        });
        this.setState({ pinnedAnnos: this.state.pinnedAnnos.filter(anno => anno.id !== id && !idArray.includes(anno.id)) });
      }
      else {
        this.setState({ pinnedAnnos: this.state.pinnedAnnos.filter(anno => anno.id !== id) });
      }
    }
    chrome.runtime.sendMessage({
      msg: 'REQUEST_PIN_UPDATE',
      from: 'content',
      payload: {
        id: id,
        pinned: pinned
      }
    })

  };

  resetView = () => {
    this.setState({
      searchState: false,
      searchedAnnotations: [],
      searchCount: 0
    })
  }

  clearSelectedAnno = () => {
    this.setState({
      showClearClickedAnnotation: false,
      filteredAnnotations: this.state.annotations
    });
  }

  handleSearchBarInputText = (searchAnnotations) => {
    this.setState({
      searchState: searchAnnotations.searchState,
      searchedAnnotations: searchAnnotations.suggestion
    });
  };

  searchedSearchCount = (count) => {
    // console.log("this is being called", count)
    this.setState({ searchCount: count });
  };

  handleShowFilter = () => {
    this.setState({ showFilter: !this.state.showFilter });
  };


  clearSearchBoxInputText = () => {
    this.setState({ searchBarInputText: '' });
  };

  checkAnnoType(annotation, annoType) {
    // console.log('annotation type', annotation, annoType);
    if (!annoType.length || annoType === 'all' || annotation.pinned) {
      return true;
    }
    return this.containsObject(annotation.type, annoType);
  }

  async checkSiteScope(annotation, siteScope) {
    if (annotation !== undefined) {
      if (!siteScope.length || annotation.pinned) {
        return true;
      }
    }
    if (siteScope.includes('onPage') && !siteScope.includes('acrossWholeSite')) {
      // to-do make this check smarter by ignoring parts of the url (#, ?, etc.)
      // - just get substring and compare
      return annotation.url.includes(this.state.url);
    }
    else if (siteScope.includes('acrossWholeSite')) {
      return new Promise((resolve, reject) => {
        let url = new URL(this.state.url);
        chrome.runtime.sendMessage({
          from: 'content',
          msg: 'REQUEST_PAGINATED_ACROSS_SITE_ANNOTATIONS',
          payload: { hostname: url.hostname, url: this.state.url }
        },
          response => {
            // do something with cursor done here idk
            // if(response.cursor === 'DONE'){
            resolve(response.annotations);
            // }
          });
      });
    }
  }

  checkTimeRange(annotation, timeRange) {
    if (timeRange === null || timeRange === 'all' || annotation.pinned) {
      return true;
    }
    if (timeRange === 'day') {
      return (new Date().getTime() - annotation.createdTimestamp) < 86400000;
    }
    else if (timeRange === 'week') {
      return (new Date().getTime() - annotation.createdTimestamp) < 604800000;
    }
    else if (timeRange === 'month') {
      return (new Date().getTime() - annotation.createdTimestamp) < 2629746000;
    }
    else if (timeRange === '6months') {
      return (new Date().getTime() - annotation.createdTimestamp) < 15778476000;
    }
    else if (timeRange === 'year') {
      return (new Date().getTime() - annotation.createdTimestamp) < 31556952000;
    }
  }

  checkUserScope(annotation, userScope) {
    if (!userScope.length || annotation.pinned) {
      return true;
    }
    if (userScope.includes('onlyMe')) {
      return annotation.authorId === this.state.currentUser.uid;
    }
    else if (userScope.includes('public') || !userScope.length) {
      return true;
    }
  }

  checkTags(annotation, tags) {
    // console.log('check tag', annotation, tags);
    if (!tags.length || annotation.pinned) {
      return true;
    }
    return tags.some(tag => annotation.tags.includes(tag));
  }

  sendTagToBackground(tag) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        from: 'content',
        msg: 'SEARCH_BY_TAG',
        payload: { tag: tag }
      },
        response => {
          resolve(response.annotations);
        });
    });
  }

  searchByTag = (tag) => {
    this.sendTagToBackground(tag).then(annotations => {
      //should these annos ignore the currently in place filter? not sure
      // for now, ignoring because of sitewide filters
      this.setState({ filteredAnnotations: annotations });
      this.setState({ annotations: annotations });
    });
  }

  getFilteredAnnotationListLength = () => {
    return this.state.filteredAnnotations.length;
  }

  getFilteredAnnotations = () => {
    return this.state.filteredAnnotations;
  }

  openFilter = () => {
    this.setState({ showFilter: true });
  }

  filterAcrossWholeSite = (filterSelection) => {
    this.checkSiteScope(undefined, filterSelection.siteScope).then(annotations => {
      annotations = annotations.filter(annotation => {
        return this.checkUserScope(annotation, filterSelection.userScope) &&
          this.checkAnnoType(annotation, filterSelection.annoType) &&
          this.checkTimeRange(annotation, filterSelection.timeRange) &&
          this.checkTags(annotation, filterSelection.tags)
      });
      let newList = annotations.concat(this.state.filteredAnnotations);
      newList = this.removeDuplicates(newList); // - for now commenting this out but for pagination
      // purposes, will probably need this back - should have background transmit whether or not we're still paginating
      // or whether all annotations across site have been received
      this.setState({ filteredAnnotations: newList });
    });
  }

  applyFilter = (filterSelection) => {
    this.setState({ filterSelection: filterSelection });
    if (filterSelection.siteScope.includes('onPage') && !filterSelection.siteScope.includes('acrossWholeSite')) {
      if (this.state.groupAnnotations.length) {
        let viewableGroupAnnotations = [];
        this.state.groupAnnotations.forEach((group) => {
          viewableGroupAnnotations = viewableGroupAnnotations.concat(group.annotations);
        })
        this.setState({
          filteredGroupAnnotations:
            viewableGroupAnnotations.filter(annotation => {
              return this.checkSiteScope(annotation, filterSelection.siteScope) &&
                this.checkUserScope(annotation, filterSelection.userScope) &&
                this.checkAnnoType(annotation, filterSelection.annoType) &&
                this.checkTimeRange(annotation, filterSelection.timeRange) &&
                this.checkTags(annotation, filterSelection.tags)
            })
        })
      }
      this.setState({
        filteredAnnotations:
          this.state.annotations.filter(annotation => {
            return this.checkSiteScope(annotation, filterSelection.siteScope) &&
              this.checkUserScope(annotation, filterSelection.userScope) &&
              this.checkAnnoType(annotation, filterSelection.annoType) &&
              this.checkTimeRange(annotation, filterSelection.timeRange) &&
              this.checkTags(annotation, filterSelection.tags)
          })
      });
    }
    else if (filterSelection.siteScope.includes('acrossWholeSite')) {
      this.filterAcrossWholeSite(filterSelection);
    }
  }

  requestFilterUpdate() {
    this.setState({
      filteredAnnotations:
        this.state.annotations.filter(annotation => {
          return this.checkSiteScope(annotation, this.state.filterSelection.siteScope) &&
            this.checkUserScope(annotation, this.state.filterSelection.userScope) &&
            this.checkAnnoType(annotation, this.state.filterSelection.annoType) &&
            this.checkTimeRange(annotation, this.state.filterSelection.timeRange) &&
            this.checkTags(annotation, this.state.filterSelection.tags);
        })
    });
  }

  // to-do make this work probs race condition where annotationlist requests this be called before
  // this.selection is set
  // now that we have filter by unique IDs I think we could use that to filter out children annotations
  // at least when computing length of list
  requestChildAnchorFilterUpdate(annotations) {
    this.setState({
      filteredAnnotations:
        annotations.filter(annotation => {
          return this.checkSiteScope(annotation, this.state.filterSelection.siteScope) &&
            this.checkUserScope(annotation, this.state.filterSelection.userScope) &&
            this.checkAnnoType(annotation, this.state.filterSelection.annoType) &&
            this.checkTimeRange(annotation, this.state.filterSelection.timeRange) &&
            this.checkTags(annotation, this.state.filterSelection.tags);
        })
    });
  }


  resetNewSelection = () => {
    this.setState({ newSelection: null });
    if (this.state.annotatingPage) {
      this.setState({ annotatingPage: false });
    }
    // if (this.state.unanchored) {
    //   this.setState({ unanchored: false });
    // }
  };

  render() {
    const { currentUser, filteredAnnotations, searchBarInputText, searchedAnnotations, groupAnnotations, filteredGroupAnnotations, pinnedAnnos, groups, activeGroups, sortBy, pageLocationSort } = this.state;
    if (currentUser === undefined) {
      return null;
    }
    const inputText = searchBarInputText.toLowerCase();
    let renderedAnnotations = [];
    if (searchedAnnotations.length) {
      renderedAnnotations = searchedAnnotations;
    }
    else if (activeGroups.length) {
      groupAnnotations.forEach((group) => {
        renderedAnnotations = renderedAnnotations.concat(group.annotations);
      });
    }
    else {
      renderedAnnotations = filteredAnnotations;
    }

    if (sortBy !== 'page') {
      renderedAnnotations = renderedAnnotations.sort((a, b) =>
        (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
      );
    }
    else {
      if (searchedAnnotations.length === 0 && groupAnnotations.length === 0 && filteredAnnotations.length === pageLocationSort.length) // this is bad if we have an in-place filter that doesn't match with pageLocationSort - fix later
        renderedAnnotations = pageLocationSort;
    }


    renderedAnnotations = renderedAnnotations.filter(anno => !anno.deleted && anno.SharedId === null);

    let pinnedAnnosCopy = pinnedAnnos.sort((a, b) =>
      (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
    );

    pinnedAnnosCopy = pinnedAnnosCopy.filter(anno => !anno.deleted && anno.SharedId === null);
    const pinnedNumChildAnchs = pinnedAnnosCopy.filter(anno => anno.SharedId !== null);

    const numChildAnchs = renderedAnnotations.filter(anno => anno.SharedId !== null);

    let tempSearchCount;
    if (this.state.showPinned) {
      tempSearchCount = renderedAnnotations.length - numChildAnchs.length + pinnedAnnosCopy.length - pinnedNumChildAnchs.length;
    }
    else {
      tempSearchCount = renderedAnnotations.length - numChildAnchs.length;
    }
    return (
      <div className="SidebarContainer" >
        <Title currentUser={currentUser}
          handleShowAnnotatePage={this.handleShowAnnotatePage}
        />
        {currentUser === null && <Authentication />}
        {currentUser !== null && (
          <div>
            <div className={classNames({ TopRow: true, filterOpen: this.state.showFilter })}>
              <SearchBar
                searchBarInputText={searchBarInputText}
                handleSearchBarInputText={this.handleSearchBarInputText}
                searchCount={this.state.searchCount === 0 ? tempSearchCount : this.state.searchCount}
                url={this.state.url}
                resetView={this.resetView}
                searchedSearchCount={this.searchedSearchCount}
              />
            </div>
            <div>
              {!this.state.showFilter &&
                <FilterSummary
                  applyFilter={this.applyFilter}
                  groups={groups}
                  filter={this.state.filterSelection}
                  openFilter={this.openFilter}
                  uid={currentUser.uid}
                  updateSidebarGroup={this.updateSidebarGroup}
                  tempSearchCount={tempSearchCount}
                  showingSelectedAnno={this.state.showClearClickedAnnotation}
                  clearSelectedAnno={this.clearSelectedAnno}
                  notifySidebarSort={this.notifySidebarSort}
                  currentSort={this.state.sortBy}
                  getFilteredAnnotations={this.getFilteredAnnotations}
                // activeGroup={activeGroups.length ? activeGroup : "Public"}
                />
              }

              {this.state.newSelection !== null &&
                !this.state.annotatingPage &&
                (
                  <NewAnnotation
                    url={this.state.url}
                    newSelection={this.state.newSelection}
                    resetNewSelection={this.resetNewSelection}
                    offsets={this.state.offsets}
                    xpath={this.state.xpath}
                    type={this.state.newAnnotationType}
                    annoContent={this.state.newAnnotationContent}
                    userGroups={groups}
                  />
                )}
              {this.state.annotatingPage &&
                <NewAnnotation
                  url={this.state.url}
                  newSelection={this.state.pageName}
                  resetNewSelection={this.resetNewSelection}
                  annoContent={''}
                  offsets={null}
                  xpath={null}
                  userGroups={groups}
                />
              }
            </div>
            <div className="userQuestions">
              {pinnedAnnosCopy.length ? (
                <div className="userQuestionButtonContainer">
                  <div className="ModifyFilter userQuestions" onClick={_ => {
                    this.setState({ showPinned: !this.state.showPinned })
                  }}>
                    {this.state.showPinned ? ("Hide " + (pinnedAnnosCopy.length - pinnedNumChildAnchs.length) + " Pinned Annotations") : ("Show " + (pinnedAnnosCopy.length - pinnedNumChildAnchs.length) + " Pinned Annotations")}
                  </div>
                </div>
              ) : (null)}
              {this.state.showPinned ? (

                <React.Fragment>
                  <AnnotationList
                    annotations={pinnedAnnosCopy}
                    // altAnnotationList={renderedAnnotations}
                    groups={groups}
                    currentUser={currentUser}
                    url={this.state.url}
                    requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                    notifyParentOfPinning={this.handlePinnedAnnotation}
                  />
                  {pinnedAnnosCopy.length && (
                    <div className="userQuestionButtonContainer">
                      <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showPinned: !this.state.showPinned }) }}>
                        {this.state.showPinned ? ("Hide " + (pinnedAnnosCopy.length - pinnedNumChildAnchs.length) + " Pinned Annotations") : ("Show " + (pinnedAnnosCopy.length - pinnedNumChildAnchs.length) + " Pinned Annotations")}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ) : (null)
              }

            </div>
            <div>
              {!renderedAnnotations.length && this.state.newSelection === null && !this.state.annotatingPage && !this.state.showFilter ? (
                <div className="whoops">
                  There's nothing here! Try searching for an annotation, modifying your groups or filters, or creating a new annotation
                </div>
              ) : (
                  <AnnotationList annotations={renderedAnnotations}
                    // altAnnotationList={pinnedAnnosCopy}
                    groups={groups}
                    currentUser={currentUser}
                    url={this.state.url}
                    requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                    notifyParentOfPinning={this.handlePinnedAnnotation}
                    showPinned={this.state.showPinned} />
                )}
              {(this.state.url.includes("facebook.com") || this.state.url.includes("google.com") || this.state.url.includes("twitter.com")) && !this.state.url.includes("developer") ? (
                <div className="whoops">
                  NOTE: Adamite does not work well on dynamic webpages such as Facebook, Google Docs, or Twitter where content is likely to change. Proceed with caution.
                </div>
              ) : (null)}
            </div>

            {this.state.showClearClickedAnnotation && (
              <div className="userQuestionButtonContainer">
                <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showClearClickedAnnotation: false }); this.setState({ filteredAnnotations: this.state.annotations }) }}>
                  Hide Selected Annotation(s)
                </div>
              </div>
            )}
          </div>
        )
        }
      </div>
    );
  }
}

export default Sidebar;
