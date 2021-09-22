import React from 'react';
import './Sidebar.css';
import classNames from 'classnames';
import Title from './containers/Title/Title';
import Authentication from './containers//Authentication//Authentication';
import AnnotationList from './containers/AnnotationList/AnnotationList';
import GetUserEmailPass from './containers/GetUserEmailPass/GetUserEmailPass';
import FilterSummary from './containers/Filter/FilterSummary';
import SearchBar from './containers/SearchBar/SearchBar';
import { v4 as uuidv4 } from 'uuid';
import Annotation from './containers/AnnotationList/Annotation/Annotation';
import { BiGroup } from 'react-icons/bi';
import {
  getPathFromUrl,
  containsObject,
  containsObjectWithId,
  containsObjectWithUrl,
  containsReplyWithAnchor,
  removeDuplicates,
  checkTimeRange
} from "./utils"
import GroupMultiSelect from './containers/Filter/MultiSelect/MultiSelect';

let pjson = require('../../../package.json');


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
    showFiltered: true,
    firstTimeUserPrompt: false,
    showPinned: false,
    pinnedAnnos: [],
    annotatingPage: false,
    newAnnotationId: -1,
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
      showArchived: false,
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

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    chrome.runtime.sendMessage({
      msg: 'UNSUBSCRIBE',
      from: 'content'
    })
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
          const results = res.response ? res.response?.data.hits.hits.map(h => h._source) : []
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
          chrome.contextMenus.update('contextMenuBadge', {
            'enabled': true
          })
        }
        else if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return }
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          let tab = tabs[0];
          this.setState({ url: getPathFromUrl(tab.url), tabId: tab.id });
          if (currentUserData.payload.currentUser) {
            this.setUpAnnotationsListener(
              currentUserData.payload.currentUser.uid,
              getPathFromUrl(tab.url),
              tab.id
            );
          } else {
            // add remove highlight
            chrome.runtime.sendMessage({
              from: 'sidebar',
              msg: 'UNSUBSCRIBE'
            })
            chrome.contextMenus.update('contextMenuBadge', {
              'enabled': false
            })
            this.setState({ annotations: [], filteredAnnotations: [], searchedAnnotations: [], groupAnnotations: [], pinnedAnnos: [], groups: [], activeGroups: [] })
          }
        });
      }
    );

    chrome.runtime.sendMessage({
      from: 'content',
      msg: 'GET_PINNED_ANNOTATIONS'
    }, response => {
      if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return }
      this.setState({ pinnedAnnos: response.annotations });
    })

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // console.log('caught this message', request, sender);
      if (
        request.from === 'background' &&
        request.msg === 'USER_AUTH_STATUS_CHANGED'
      ) {
        if (chrome.runtime.lastError) { console.error(chrome.runtime.lastError); return }
        this.setState({ currentUser: request.payload.currentUser });
        if (request.payload.currentUser) {
          this.setUpAnnotationsListener(
            request.payload.currentUser.uid,
            this.state.url
          );
          this.setUpGroupsListener(
            request.payload.currentUser.uid
          );
          this.setUpPinnedListener();
          chrome.contextMenus.update('contextMenuBadge', {
            'enabled': true
          })
        } else {
            chrome.runtime.sendMessage({
              from: 'sidebar',
              msg: 'UNSUBSCRIBE'
            })
            chrome.contextMenus.update('contextMenuBadge', {
              'enabled': false
            })
            this.setState({ annotations: [], filteredAnnotations: [], searchedAnnotations: [], groupAnnotations: [], pinnedAnnos: [], groups: [], activeGroups: [] })
        }
      } 
      else if(
        request.from === 'background' && 
        request.msg === 'PROMPT_FOR_EMAIL_PASS'
      ) {
        this.setState({ firstTimeUserPrompt: true });
      }
      else if (
        request.from === 'background' &&
        request.msg === 'CONTENT_SELECTED'
      ) {
        const { selection, offsets, xpath, type, annoContent } = request.payload;
        const newAnnoId = uuidv4();
        this.setState({
          newSelection: selection,
          offsets: offsets,
          xpath: xpath,
          newAnnotationType: type,
          newAnnotationContent: annoContent,
          newAnnotationId: newAnnoId
        });
        this.scrollToNewAnnotationEditor();
      }
      else if (request.from === 'background' && request.msg === 'PINNED_CHANGED') {
        this.setState({
          pinnedAnnos: request.payload
        });
      }
      else if (request.from === 'background' && request.msg === 'SCROLL_INTO_VIEW') {
        this.scrollToNewAnnotation();
      }
      else if (
        request.from === 'content' &&
        request.msg === 'ANCHOR_UNHOVERED'
      ) {
        const { target } = request.payload;
        const anchorIds = target.map(id => id.slice(37,73))
        anchorIds.forEach((anch, idx) => {
          const anchor = document.getElementById(anch);
          if(anchor !== null) {
            anchor.classList.remove("Clicked")
          }
        })
      }
      else if (
        request.from === 'content' &&
        request.msg === 'ANCHOR_HOVERED'
      ) {
        const { target } = request.payload;
        const annoIds = target.map(id => id.slice(0,36))
        const anchorIds = target.map(id => id.slice(37,73))
        const clickedAnnos = this.state.filteredAnnotations.filter(anno => annoIds.includes(anno.id));
        clickedAnnos.forEach((anno, idx) => {
            const anchor = document.getElementById(anchorIds[idx]);
            if(anchor !== null) {
              anchor.classList.add("Clicked")
            }
          })
      }
      else if (
        request.from === 'content' &&
        request.msg === 'ANCHOR_CLICKED'
      ) {
        const { target } = request.payload;
        const annoIds = target.map(id => id.slice(0,36))
        const anchorIds = target.map(id => id.slice(37,73))
        const clickedAnnos = this.state.filteredAnnotations.filter(anno => annoIds.includes(anno.id));
        clickedAnnos.forEach((anno, idx) => {
            let annoDiv = document.getElementById(anno.id);
            annoDiv.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            const anchor = document.getElementById(anchorIds[idx]);
            if(anchor !== null) {
              anchor.classList.add("Clicked")
            }
            chrome.tabs.sendMessage(
              this.state.tabId,
              {
                msg: 'ANNOTATION_FOCUS',
                id: anno.id,
              }
            );
          })
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
        if (request === undefined || chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError)
          return;
        }
        let annotations = request.payload;
        if (request.url !== undefined) this.setState({ url: request.url });
        chrome.runtime.sendMessage({
          msg: 'REQUEST_SIDEBAR_STATUS',
          from: 'content'
        }, (sidebarOpen) => {
          if (sidebarOpen !== undefined && typeof(sidebarOpen) === "boolean" && sidebarOpen) {
            // REAALLLY hate this so-called "solution" lmao
            chrome.runtime.sendMessage({
              msg: 'REQUEST_TOGGLE_SIDEBAR',
              from: 'content',
              toStatus: true
            });
            chrome.tabs.sendMessage(request.tabId, {
              msg: 'HIGHLIGHT_ANNOTATIONS',
              payload: request.payload,
              url: request.url
            }, response => {
              if (response !== undefined) {
                let spanNames = response.spanNames;
                spanNames = spanNames.map((obj) => {
                  let temp = Object.assign({}, obj);
                  temp.id = obj.id.substring(0, 36)
                  return temp
                });
                spanNames.sort((a, b) => {
                  return a.y !== b.y ? a.y - b.y : a.x - b.x
                })
                annotations.sort((a, b) => {
                  const index1 = spanNames.findIndex(obj => obj.id === a.id);
                  const index2 = spanNames.findIndex(obj => obj.id === b.id)
                  return ((index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity))
                });
              }
              this.setState({ annotations, pageLocationSort: annotations })
              this.requestFilterUpdate();
            });
          }
          else if(sidebarOpen === 'annotateOnly') {
            chrome.tabs.sendMessage(request.tabId, {
              msg: 'HIGHLIGHT_ANNOTATIONS',
              payload: request.payload,
              url: request.url
            })
            this.setState({ annotations });
            this.requestFilterUpdate();
          }
          else {
            this.setState({ annotations });
            this.requestFilterUpdate();
            chrome.runtime.sendMessage({
              msg: 'UNSUBSCRIBE',
              from: 'content'
            })

          }
        })

        chrome.browserAction.setBadgeText({ tabId: request.tabId, text: request.payload.length ? String(request.payload.length - request.payload.filter(r => r.archived).length) : "0" });
      }
      else if (request.msg === 'SORT_LIST' && request.from === 'background') {
        let spanNames = request.payload === undefined && request.payload.spanNames === undefined ? undefined : request.payload.spanNames;
        let annotations = this.state.annotations;
        if (spanNames !== undefined) {
          spanNames = spanNames.map((obj) => {
            let temp = Object.assign({}, obj);
            temp.id = obj.id.substring(0, 36)
            return temp
          });
          spanNames.sort((a, b) => {
            return a.y !== b.y ? a.y - b.y : a.x - b.x
          })
          annotations.sort((a, b) => {
            const index1 = spanNames.findIndex(obj => obj === a.id);
            const index2 = spanNames.findIndex(obj => obj === b.id)
            return ((index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity))
          });
        }
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
  containsReplyWithAnchor(list) {
    const test = list.filter(obj => obj.anchor !== null);
    return test;
  }

  handleShowAnnotatePage = () => {
    this.setState({ annotatingPage: true, newAnnotationId: uuidv4() });
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      this.setState({ pageName: tabs[0].title });
    });
  };

  openOptions = () => {
    chrome.tabs.create({ 'url': "/options.html" })
  };

  openDocumentation = () => {
    chrome.tabs.create({ 'url': "https://www.adamite.net" })
  }

  openAdamiteSite = () => {
    chrome.tabs.create({ 'url': "https://adamite.netlify.app" })
  }

  openBugForm = () => {
    const userName = this.state.currentUser.email.substring(0, this.state.currentUser.email.indexOf('@')); 
    chrome.tabs.create({ 'url': 'https://docs.google.com/forms/d/e/1FAIpQLScA3vI8-q5CSJpxDbmuM8tjQuvoCdu9XM6KTTieUrJeHHcGOw/viewform?usp=pp_url&entry.1555642790=' + userName + '&entry.1692277697=' + pjson.version + '&entry.872204213=I+think+I\'m+experiencing+a+bug+with+Adamite&entry.896576682=Your+question+here&entry.1167786342=Your+bug+here' })
  }

  closeSidebar = () => {
    chrome.runtime.sendMessage({
      msg: 'REQUEST_TOGGLE_SIDEBAR',
      from: 'content',
      toStatus: false,
      tabId: this.state.tabId
    });
  };


  updateSidebarGroup = (options, e) => {
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
        this.setState({ filteredAnnotations: this.state.annotations.filter(anno => anno.authorId === uid), groupAnnotations: [], activeGroups: ['Private']})
      }
      else if (group.value === "public") {
        this.setState({ filteredAnnotations: this.state.annotations, groupAnnotations: [], activeGroups: ['Public']})
      }
      else {
        chrome.runtime.sendMessage({
          msg: 'GET_GROUP_ANNOTATIONS',
          payload: {
            gid: group.value,
            // url: this.state.url
          }
        },
          (res) => {

            if (res !== undefined && res.length) {
              this.setState({ groupAnnotations: res });
              this.setState({ activeGroups: groupNames });
            }
            else {
              chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs.length) {
                  chrome.tabs.sendMessage(tabs[0].id, {
                    msg: 'SHOW_NO_GROUP_ANNOTATIONS',
                    from: 'sidebar'
                  })
                }
              })
            }
          });
      }

      groupNames.push(group.label);
    });
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
    if (containsObjectWithId(id, this.state.filteredAnnotations)) {
      annotation = this.state.filteredAnnotations.filter(anno => anno.id === id);
      annotation[0].pinned = pinned;
      let remainingAnnos = this.state.filteredAnnotations.filter(anno => anno.id !== id);
      remainingAnnos.push(...annotation);
      this.setState({ filteredAnnotations: remainingAnnos });
      this.state.pinnedAnnos.push(annotation[0]);
    }
    else if (containsObjectWithId(id, this.state.pinnedAnnos)) {
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
      if (this.state.groupAnnotations.length) {
        this.state.groupAnnotations.forEach((group) => {
          if (containsObjectWithId(id, group.annotations)) {
            annotation = group.annotations.filter(anno => anno.id === id);
            annotation[0].pinned = pinned;
            this.state.pinnedAnnos.push(annotation[0]);
          }
        });
      }

    }
    if (!pinned) {
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
    if (!searchAnnotations.suggestion.length) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs.length) return;
        chrome.tabs.sendMessage(tabs[0].id, {
          msg: 'RENDER_NO_SEARCH_RESULTS',
          from: 'sidebar'
        })
      })

    }
  };

  searchedSearchCount = (count) => {
    this.setState({ searchCount: count });
  };

  clearSearchBoxInputText = () => {
    this.setState({ searchBarInputText: '' });
  };

  checkAnnoType(annotation, annoType) {
    if (!annoType.length || annoType === 'all' || annotation.pinned) {
      return true;
    }
    return containsObject(annotation.type, annoType);
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
    if (!tags.length || annotation.pinned) {
      return true;
    }
    const annoTags = annotation.tags.concat(...annotation.replies.map(r => r.tags), ...annotation.childAnchor.map(r => r.tags))
    return tags.some(tag => annoTags.includes(tag));
  }

  checkArchived = (annotation, includeArchived) => {
    return !annotation.archived || (includeArchived && annotation.archived)
  }

  // sendTagToBackground(tag) {
  //   return new Promise((resolve, reject) => {
  //     chrome.runtime.sendMessage({
  //       from: 'content',
  //       msg: 'SEARCH_BY_TAG',
  //       payload: { tag: tag }
  //     },
  //       response => {
  //         resolve(response.annotations);
  //       });
  //   });
  // }

  // searchByTag = (tag) => {
  //   this.sendTagToBackground(tag).then(annotations => {
  //     //should these annos ignore the currently in place filter? not sure
  //     // for now, ignoring because of sitewide filters
  //     this.setState({ filteredAnnotations: annotations });
  //     this.setState({ annotations: annotations });
  //   });
  // }

  getFilteredAnnotationListLength = () => {
    return this.state.filteredAnnotations.length;
  }

  getFilteredAnnotations = () => {
    return this.state.filteredAnnotations;
  }


  addNewGroup = () => {
    chrome.runtime.sendMessage({
      msg: 'SHOW_GROUP',
      from: 'content',
      payload: {
        uid: this.state.currentUser.uid,
      }
    })
  }

  filterAcrossWholeSite = (filterSelection) => {
    this.checkSiteScope(undefined, filterSelection.siteScope).then(annotations => {
      annotations = annotations.filter(annotation => {
        return this.checkUserScope(annotation, filterSelection.userScope) &&
          this.checkAnnoType(annotation, filterSelection.annoType) &&
          checkTimeRange(annotation, filterSelection.timeRange) &&
          this.checkTags(annotation, filterSelection.tags)
      });
      let newList = annotations.concat(this.state.filteredAnnotations);
      newList = removeDuplicates(newList); // - for now commenting this out but for pagination
      // purposes, will probably need this back - should have background transmit whether or not we're still paginating
      // or whether all annotations across site have been received
      this.setState({ filteredAnnotations: newList });
    });
  }

  applyFilter = (filterSelection) => {
    this.setState({ filterSelection: filterSelection });
    if (filterSelection.siteScope.includes('onPage') && !filterSelection.siteScope.includes('acrossWholeSite')) {
      if (this.state.groupAnnotations.length) {
        // let viewableGroupAnnotations = [];
        // this.state.groupAnnotations.forEach((group) => {
        //   viewableGroupAnnotations = viewableGroupAnnotations.concat(group.annotations);
        // })
        this.setState({
          filteredGroupAnnotations:
            this.state.groupAnnotations.filter(annotation => {
              return this.checkSiteScope(annotation, filterSelection.siteScope) &&
                this.checkUserScope(annotation, filterSelection.userScope) &&
                this.checkAnnoType(annotation, filterSelection.annoType) &&
                checkTimeRange(annotation, filterSelection.timeRange) &&
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
              checkTimeRange(annotation, filterSelection.timeRange) &&
              this.checkTags(annotation, filterSelection.tags) &&
              this.checkArchived(annotation, filterSelection.showArchived)
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
            checkTimeRange(annotation, this.state.filterSelection.timeRange) &&
            this.checkTags(annotation, this.state.filterSelection.tags) &&
            this.checkArchived(annotation, this.state.showArchived);
        })
    });
  }

  returnFilteredAnnotations = (annotations) => {
    return annotations.filter(annotation => {
      return this.checkSiteScope(annotation, this.state.filterSelection.siteScope) &&
        this.checkUserScope(annotation, this.state.filterSelection.userScope) &&
        this.checkAnnoType(annotation, this.state.filterSelection.annoType) &&
        checkTimeRange(annotation, this.state.filterSelection.timeRange) &&
        this.checkTags(annotation, this.state.filterSelection.tags) &&
        this.checkArchived(annotation, this.state.showArchived);
    })
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
            checkTimeRange(annotation, this.state.filterSelection.timeRange) &&
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

  notifySidebarOfPassword = (pass) => {
    this.setState({ firstTimeUserPrompt: false });
    chrome.runtime.sendMessage({
      msg: 'USER_PASS_RECEIVED',
      from: 'sidebar',
      payload: {
        email: this.state.currentUser.email,
        pass
      }
    })
  }

  scrollToNewAnnotation = (id) => {
    let annoDiv = null;
    annoDiv = document.getElementById(this.state.newAnnotationId);
    if (annoDiv !== null) {
      annoDiv.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }

  }

  filterTags = () => {
    let tagSet = {};
    let renderedAnnotations = [];
    if (this.state.searchedAnnotations.length) {
      renderedAnnotations = this.state.searchedAnnotations.concat(this.state.filteredAnnotations);
    }
    else if (this.state.groupAnnotations.length) {
      renderedAnnotations = renderedAnnotations.concat(this.state.groupAnnotations);
    }
    else {
      renderedAnnotations = this.state.filteredAnnotations;
    }

    renderedAnnotations.forEach(annotation => {
      if(annotation.tags !== undefined) {
        annotation.tags.forEach(tag => {
          if (tagSet.hasOwnProperty(tag)) {
            tagSet[tag] += 1;
          }
          else {
            tagSet[tag] = 1;
          }
        });
      }
      if(annotation.replies !== undefined && annotation.replies.length) {
        const replyTags = annotation.replies.filter(r => r.tags !== undefined && r.tags.length).map(r => r.tags)
        replyTags.forEach(tag => {
          if (tagSet.hasOwnProperty(tag)) {
            tagSet[tag] += 1;
          }
          else {
            tagSet[tag] = 1;
          }
        })
      }
      const anchorTags = annotation.childAnchor.filter(c => c.tags !== undefined && c.tags.length).map(c => c.tags).flat();
      anchorTags.forEach(tag => {
        if (tagSet.hasOwnProperty(tag)) {
          tagSet[tag] += 1;
        }
        else {
          tagSet[tag] = 1;
        }
      })
    })
      
    return tagSet;
  }

  scrollToNewAnnotationEditor = () => {
    let editorDiv = document.getElementById(this.state.newAnnotationId);
    if (editorDiv !== null) {
      editorDiv.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }
  }

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
    else if (groupAnnotations.length) {
      renderedAnnotations = renderedAnnotations.concat(this.state.groupAnnotations);
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

    renderedAnnotations = renderedAnnotations.filter(anno => !anno.deleted && (!anno.archived || (this.state.filterSelection.showArchived && anno.archived)));
    let pinnedAnnosCopy = pinnedAnnos.sort((a, b) =>
      (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
    );

    pinnedAnnosCopy = pinnedAnnosCopy.filter(anno => !anno.deleted && (!anno.archived || (this.state.filterSelection.showArchived && anno.archived)));
    renderedAnnotations = this.state.showPinned ? renderedAnnotations.filter(annoR => !pinnedAnnosCopy.find(annoP => (annoR.id === annoP.id))) : renderedAnnotations;

    let tempSearchCount;
    if (this.state.showPinned) {
      tempSearchCount = this.returnFilteredAnnotations(renderedAnnotations).length + pinnedAnnosCopy.length;
    }
    else {
      tempSearchCount = this.returnFilteredAnnotations(renderedAnnotations).length;
    }
    // const newAnnoId = uuidv4();
    return (

      <div className="SidebarContainer" >

        <Title 
          currentUser={currentUser}
          groups={groups}
          handleShowAnnotatePage={this.handleShowAnnotatePage}
          closeSidebar={this.closeSidebar}
          openOptions={this.openOptions}
          openDocumentation={this.openDocumentation}
          openAdamiteSite={this.openAdamiteSite}
          openBugForm={this.openBugForm}
          updateSidebarGroup={this.updateSidebarGroup}
          currentGroup={this.state.activeGroups}
          addNewGroup={this.addNewGroup}
        />
        {currentUser === null && <Authentication />}
        {currentUser !== null && (
          <div className="SideBarCardContent">
          <div className="ControlPanel">
            <div className="TopRow">
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
              <div className="FilterSummaryContainer">
                {renderedAnnotations.length || this.state.annotations.length ?
                  (<FilterSummary
                    applyFilter={this.applyFilter}
                    groups={groups}
                    filter={this.state.filterSelection}
                    openFilter={this.openFilter}
                    filterTags={this.filterTags}
                    uid={currentUser.uid}
                    tempSearchCount={tempSearchCount}
                    showingSelectedAnno={this.state.showClearClickedAnnotation}
                    clearSelectedAnno={this.clearSelectedAnno}
                    notifySidebarSort={this.notifySidebarSort}
                    currentSort={this.state.sortBy}
                    filteredAnnotations={renderedAnnotations}
                    numArchivedAnnotations={this.state.annotations.filter(anno => anno.archived).length}
                  />) : (null)
                }
              </div>
              {(this.state.firstTimeUserPrompt) && 
                (
                  <GetUserEmailPass notifySidebarOfPassword={this.notifySidebarOfPassword} />
                )
              }
              
              {(this.state.newSelection || this.state.annotatingPage) &&
                (
                  <Annotation
                    key={uuidv4()}
                    idx={-1}
                    isNew={true}
                    annotation={{
                      id: this.state.newAnnotationId,
                      type: this.state.newAnnotationType,
                      content: this.state.newAnnotationContent ?? '',
                      tags: [],
                      isPrivate: true,
                      groups: [],
                      childAnchor: this.state.annotatingPage ? [
                        {
                          id: uuidv4(),
                          anchor: this.state.pageName,
                          parentId: this.state.newAnnotationId,
                          xpath: null,
                          offsets: null,
                          url: this.state.url,
                          tags: []
                        }
                      ] : [
                        {
                          id: uuidv4(),
                          anchor: this.state.newSelection,
                          parentId: this.state.newAnnotationId,
                          xpath: this.state.xpath,
                          offsets: this.state.offsets,
                          url: this.state.url,
                          tags: []
                        }
                      ]
                    }}
                    notifyParentOfPinning={this.handlePinnedAnnotation}
                    userGroups={groups}
                    currentUrl={this.state.url}
                    currentUser={currentUser}
                    resetNewSelection={this.resetNewSelection}
                    scrollToNewAnnotation={this.scrollToNewAnnotation}
                  />
                )}
            </div>
            </div>
            <div className="userQuestions">
              {pinnedAnnosCopy.length ? (
                <div className="userQuestionButtonContainer">
                  <div className="ModifyFilter userQuestions" onClick={_ => {
                    this.setState({ showPinned: !this.state.showPinned })
                  }}>
                    {this.state.showPinned ? ("Hide " + (pinnedAnnosCopy.length) + " Pinned Annotations") : ("Show " + (pinnedAnnosCopy.length) + " Pinned Annotations")}
                  </div>
                </div>
              ) : (null)}
              {this.state.showPinned ? (

                <React.Fragment>
                  <AnnotationList
                    annotations={pinnedAnnosCopy}
                    groups={groups}
                    currentUser={currentUser}
                    url={this.state.url}
                    requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                    notifyParentOfPinning={this.handlePinnedAnnotation}
                  />
                  {pinnedAnnosCopy.length && (
                    <div className="userQuestionButtonContainer">
                      <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showPinned: !this.state.showPinned }) }}>
                        {this.state.showPinned ? ("Hide " + (pinnedAnnosCopy.length) + " Pinned Annotations") : ("Show " + (pinnedAnnosCopy.length) + " Pinned Annotations")}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ) : (null)
              }

            </div>
            <div>
              {!renderedAnnotations.length && this.state.newSelection === null && !this.state.annotatingPage ? (
                <div className="whoops">
                  There's nothing here! Try searching for an annotation, modifying your groups or filters, or creating a new annotation
                </div>
              ) : (
                <AnnotationList annotations={this.returnFilteredAnnotations(renderedAnnotations)}
                  groups={groups}
                  currentUser={currentUser}
                  url={this.state.url}
                  requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                  notifyParentOfPinning={this.handlePinnedAnnotation} />
              )}
              {searchedAnnotations.length && filteredAnnotations.length ? (
                  <div className="userQuestionButtonContainer">
                    <div className="ModifyFilter userQuestions" onClick={_ => {
                      this.setState({ showFiltered: !this.state.showFiltered })
                    }}>
                      {this.state.showFiltered ? ("Hide " + (filteredAnnotations.length) + " Annotations On Page") : ("Show " + (filteredAnnotations.length) + " Annotations On Page")}
                    </div>
                  </div>

              ) : (null)}
              {(this.state.showFiltered && searchedAnnotations.length) ?
              <AnnotationList annotations={filteredAnnotations}
                  currentUser={currentUser}
                  url={this.state.url}
                  requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                  notifyParentOfPinning={this.handlePinnedAnnotation} />
              : (null)}


              {((this.state.url !== '') && (this.state.url.includes("facebook.com") || this.state.url.includes("google.com") || this.state.url.includes("twitter.com"))) && !this.state.url.includes("developer") ? (
                <div className="whoops">
                  NOTE: Adamite does not work well on dynamic webpages such as Facebook, Google Docs, or Twitter where content is likely to change. Proceed with caution.
                </div>
              ) : (null)}
            </div>
          
          </div>
        )
        }
      </div>
    );
  }
}

export default Sidebar;
