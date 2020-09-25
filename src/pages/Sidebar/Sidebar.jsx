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
    newSelection: null,
    rect: null,
    offsets: null,
    xpath: null,
    newAnnotationType: 'default',
    currentUser: undefined,
    selected: undefined,
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
    filterSelection: {
      siteScope: ['onPage'],
      userScope: ['public'],
      annoType: ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'],
      timeRange: 'all',
      archive: null,
      tags: []
    }
  };


  setUpAnnotationsListener = (uid, url) => {

    chrome.runtime.sendMessage(
      {
        msg: 'GET_ANNOTATIONS_PAGE_LOAD',
        uid: uid,
        url: url,
      },
    );

  };

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
          console.log("THESE RESUsssssLTS", res.response.data)
          const results = res.response.data.hits.hits.map(h => h._source)
          console.log("THESE RESULTS", res.response)
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

        chrome.runtime.sendMessage(
          {
            msg: 'REQUEST_TAB_URL',
          },
          urlData => {
            this.setState({ url: urlData.url });
            if (currentUserData.payload.currentUser) {
              this.setUpAnnotationsListener(
                currentUserData.payload.currentUser.uid,
                urlData.url
              );
            } else {
              if (this.unsubscribeAnnotations) {
                this.unsubscribeAnnotations();
              }
            }
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
        console.log('in sidebar, content selected', selection);
        this.setState({
          newSelection: selection,
          offsets: offsets,
          xpath: xpath,
          newAnnotationType: type,
          newAnnotationContent: annoContent
        });
      } else if (
        request.from === 'background' &&
        request.msg === 'CONTENT_NOT_SELECTED'
      ) {
        // should check whether annotation has user-added content or not - will need to request
        // child annotation's state
        this.resetNewSelection();
      } else if (
        request.from === 'content' &&
        request.msg === 'ANCHOR_CLICKED'
      ) {
        const { target } = request.payload;

        chrome.runtime.sendMessage(
          {
            from: 'content',
            msg: 'REQUEST_SIDEBAR_STATUS',
          },
          (response) => {
            let sidebarOpen = response.sidebarOpen;
            if (!sidebarOpen) {
              chrome.runtime.sendMessage({
                from: 'content',
                msg: 'REQUEST_TOGGLE_SIDEBAR',
              });
            }
          }
        );
        this.setState({
          filteredAnnotations: this.state.annotations.filter(element => {
            if (element.childAnchor !== undefined && element.childAnchor !== null && element.childAnchor.length) {
              let doesContain = false;
              element.childAnchor.forEach(anno => {
                if (target.includes(anno.id)) {
                  doesContain = true;
                }
              })
              if (!doesContain) {
                doesContain = target.includes(element.id);
              }
              return doesContain;
            }
            return target.includes(element.id);
          })
        });
        this.setState({ showClearClickedAnnotation: true });
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
      else if (
        request.from === 'background' &&
        request.msg === 'CONTENT_UPDATED'
      ) {
        this.setState({ annotations: request.payload })
        // if (this.state.searchedAnnotations.length !== 0) {
        //   this.ElasticSearch("REFRESH_FOR_CONTENT_UPDATED").then(res => {
        //     console.log("THESE RESUsssssLTS", res.response.data)
        //     const results = res.response.data.hits.hits.map(h => h._source)
        //     console.log("THESE RESULTS", res.response)
        //     this.setState({
        //       searchedAnnotations: results
        //     })
        //   })

        // }
        // let mostRecentAnno, secondMostRecentAnno;
        // const filteredAnnotationsCopy = request.payload.sort((a, b) =>
        //   (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
        // );
        // if (this.state.filteredAnnotations.length) {
        //   mostRecentAnno = filteredAnnotationsCopy[0];
        //   secondMostRecentAnno = filteredAnnotationsCopy[1];
        //   if (mostRecentAnno.type === 'question' && secondMostRecentAnno.type === 'question' && !secondMostRecentAnno.isClosed) {
        //     this.setState({ askAboutRelatedAnnos: true });
        //   }
        // }
        this.requestFilterUpdate();
        // console.log("HERE is johnnnnn", request.payload)
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
              console.log('new list', tempArray);
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
        this.setState({
          filteredAnnotations: this.state.annotations.filter(anno => {
            return this.checkTags(anno, [request.payload]);
          })
        });
      }
    });
  }

  // if length is 0 does not contain object, else does contain object
  // stupid helper method made out of necessity
  containsObjectWithId(id, list) {
    const test = list.filter(obj => obj.id === id);
    return test.length !== 0;
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

  handleUnanchoredAnnotation = () => {
    // this.setState({ annotatingPage: true });
    this.setState({ unanchored: true });
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
    let annotation = this.state.filteredAnnotations.filter(anno => anno.id === id);
    if (this.containsObjectWithId(id, this.state.filteredAnnotations)) {
      annotation[0].pinned = pinned;
      let remainingAnnos = this.state.filteredAnnotations.filter(anno => anno.id !== id);
      remainingAnnos.push(...annotation);
      this.setState({ filteredAnnotations: remainingAnnos });
      this.state.pinnedAnnos.push(annotation[0]);
    }
    else if (this.containsObjectWithId(id, this.state.pinnedAnnos)) {
      // console.log(annotation);
      this.setState({ pinnedAnnos: this.state.pinnedAnnos.filter(anno => anno.id !== id) });
      return;
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

  handleSearchBarInputText = (searchAnnotations) => {
    console.log("IN HERE!", searchAnnotations)
    this.setState({
      searchState: searchAnnotations.searchState,
      searchedAnnotations: searchAnnotations.suggestion
    });
  };

  searchedSearchCount = (count) => {
    console.log("this is being called", count)
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
      return annotation.url === this.state.url;
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
      // console.log('wtf is happening lmao', annotations);
      let newList = annotations.concat(this.state.filteredAnnotations);
      newList = this.removeDuplicates(newList); // - for now commenting this out but for pagination
      // purposes, will probably need this back - should have background transmit whether or not we're still paginating
      // or whether all annotations across site have been received
      this.setState({ filteredAnnotations: newList });
    });
  }

  // wtf why is there this.state.annotations and this.state.filteredAnnotations? past amber? hello?
  applyFilter = (filterSelection) => {
    this.setState({ filterSelection: filterSelection });
    if (filterSelection.siteScope.includes('onPage') && !filterSelection.siteScope.includes('acrossWholeSite')) {
      this.setState({
        filteredAnnotations:
          this.state.annotations.filter(annotation => {
            return this.checkSiteScope(annotation, filterSelection.siteScope) &&
              this.checkUserScope(annotation, filterSelection.userScope) &&
              this.checkAnnoType(annotation, filterSelection.annoType) &&
              this.checkTimeRange(annotation, filterSelection.timeRange) &&
              this.checkTags(annotation, filterSelection.tags);
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
    if (this.state.unanchored) {
      this.setState({ unanchored: false });
    }
  };

  render() {
    const { currentUser, filteredAnnotations, searchBarInputText, searchedAnnotations, pinnedAnnos } = this.state;

    if (currentUser === undefined) {
      return null;
    }
    // console.log("this is a render");
    // console.log('bad bad', this.state.relatedQuestions);
    const inputText = searchBarInputText.toLowerCase();
    // console.log("these are searched annotations", searchedAnnotations, searchedAnnotations.length === 0)
    let filteredAnnotationsCopy = searchedAnnotations.length === 0 ? filteredAnnotations : searchedAnnotations;
    // console.log("these are searched annotations", filteredAnnotationsCopy, searchedAnnotations.length === 0)
    filteredAnnotationsCopy = filteredAnnotationsCopy.sort((a, b) =>
      (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
    );

    const pinnedAnnosCopy = pinnedAnnos.sort((a, b) =>
      (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
    );

    let tempSearchCount;
    if (this.state.showPinned) {
      // this.setState({ searchCount: filteredAnnotationsCopy.length + pinnedAnnos.length });
      tempSearchCount = filteredAnnotationsCopy.length + pinnedAnnos.length;
    }
    else {
      // this.setState({ searchCount: filteredAnnotationsCopy.length });

      tempSearchCount = filteredAnnotationsCopy.length;
    }
    return (
      <div className="SidebarContainer" >
        <Title currentUser={currentUser}
          handleShowAnnotatePage={this.handleShowAnnotatePage}
          handleUnanchoredAnnotation={this.handleUnanchoredAnnotation}
        />
        {currentUser === null && <Authentication />}
        {currentUser !== null && (
          <div>
            <div className={classNames({ TopRow: true, filterOpen: this.state.showFilter })}>
              <div className="FilterButton">
                <img src={filter} alt="Filter icon" onClick={this.handleShowFilter} className="Filter" />
              </div>
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
              {!this.state.showFilter && <FilterSummary applyFilter={this.applyFilter} filter={this.state.filterSelection} openFilter={this.openFilter} />}
              {this.state.askAboutRelatedAnnos && !this.state.showFilter ? (
                <React.Fragment>
                  <div className="FilterSummaryContainer">
                    I noticed that you have an open question and you just created a new question - are they related? &nbsp;
                    <Button variant="outline-info" size='sm' onClick={this.handleRelatedQuestions}>Yes</Button> &nbsp; &nbsp;
                    <Button variant="outline-info" size='sm' onClick={_ => this.setState({ askAboutRelatedAnnos: false })}>No</Button>
                  </div>

                </React.Fragment>
              ) : (null)}
              {this.state.showFilter &&
                <Filter applyFilter={this.applyFilter}
                  filterAnnotationLength={this.getFilteredAnnotationListLength}
                  getFilteredAnnotations={this.getFilteredAnnotations}
                  currentFilter={this.state.filterSelection}
                  searchByTag={this.searchByTag}
                />}
              {this.state.newSelection !== null &&
                !this.state.annotatingPage &&
                this.state.newSelection.trim().length > 0 && (
                  <NewAnnotation
                    url={this.state.url}
                    newSelection={this.state.newSelection}
                    resetNewSelection={this.resetNewSelection}
                    offsets={this.state.offsets}
                    xpath={this.state.xpath}
                    type={this.state.newAnnotationType}
                    annoContent={this.state.newAnnotationContent}
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
                />
              }
              {this.state.unanchored &&
                <NewAnnotation
                  url={this.state.url}
                  newSelection={''}
                  resetNewSelection={this.resetNewSelection}
                  annoContent={''}
                  offsets={null}
                  xpath={null}
                />
              }

            </div>
            <div className="userQuestions">
              <div className="userQuestionButtonContainer">
                <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showPinned: !this.state.showPinned }) }}>
                  {this.state.showPinned ? ("Hide Pinned Annotations") : ("Show Pinned Annotations")}
                </div>
              </div>
              {this.state.showPinned ? (
                <React.Fragment><AnnotationList annotations={pinnedAnnosCopy}
                  currentUser={currentUser}
                  url={this.state.url}
                  requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                  notifyParentOfPinning={this.handlePinnedAnnotation} />
                  <div className="userQuestionButtonContainer">
                    <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showPinned: !this.state.showPinned }) }}>
                      {this.state.showPinned ? ("Hide Pinned Annotations") : ("Show Pinned Annotations")}
                    </div>
                  </div>
                </React.Fragment>
              ) : (null)
              }

            </div>
            <div>
              {!filteredAnnotationsCopy.length && this.state.newSelection === null && !this.state.annotatingPage && !this.state.showFilter ? (
                <div className="whoops">
                  There's nothing here! Try
                  <button className="ModifyFilter" onClick={this.openFilter}>
                    modifying your filter,
                  </button>
                  or creating a new annotation
                </div>
              ) : (
                  <AnnotationList annotations={filteredAnnotationsCopy}
                    currentUser={currentUser}
                    url={this.state.url}
                    requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                    notifyParentOfPinning={this.handlePinnedAnnotation} />
                )}
            </div>
            {this.state.showClearClickedAnnotation && (
              <div className="userQuestionButtonContainer">
                <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showClearClickedAnnotation: false }); this.setState({ filteredAnnotations: this.state.annotations }) }}>
                  Clear Selected Annotation
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
