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

class Sidebar extends React.Component {
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
    showFilter: false,
    showQuestions: false,
    userQuestions: [],
    annotatingPage: false,
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

  componentWillMount() {
    if (this.unsubscribeAnnotations) {
      this.unsubscribeAnnotations();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = (event, filterSelection) => {
    const scrollIsAtTheBottom = (document.documentElement.scrollHeight - window.innerHeight) - 1 <= Math.floor(window.scrollY);
    if (scrollIsAtTheBottom && filterSelection.siteScope.includes('acrossWholeSite')) {
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
      msg: 'GET_USER_QUESTIONS'
    }, response => {
      this.setState({ userQuestions: response.annotations });
    })

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
        const { selection, offsets, xpath, type } = request.payload;
        this.setState({
          newSelection: selection,
          offsets: offsets,
          xpath: xpath,
          newAnnotationType: type
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
        this.requestFilterUpdate();
        // console.log("HERE is johnnnnn", request.payload)
      }
    });
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

  handlePinnedAnnotation = (id, pinned) => {
    let annotation = this.state.filteredAnnotations.filter(anno => anno.id === id);
    annotation[0].pinned = pinned;
    let remainingAnnos = this.state.filteredAnnotations.filter(anno => anno.id !== id);
    remainingAnnos.push(...annotation);
    this.setState({ filteredAnnotations: remainingAnnos });
  };

  ElasticSearch = (inputText) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        msg: 'SEARCH_ELASTIC',
        userSearch: inputText
      },
        response => {
          resolve(response.response);
        });
    });
  }


  // handleSearchBarInputText = (event) => {
  handleSearchBarInputText = (searchAnnotations) => {
    // let inputText = event.target.value;
    console.log("IN HERE!", searchAnnotations)
    // console.log("handlebar", inputText)
    // this.ElasticSearch(inputText).then((searchAnnotations) => {
    //console.log("here is the result", searchAnnotations)
    this.setState({
      // searchBarInputText: inputText,
      searchedAnnotations: searchAnnotations
    });
    // });

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
    this.setState({ selection: filterSelection });
    if (filterSelection.siteScope.includes('onPage') && !filterSelection.siteScope.includes('acrossWholeSite')) {
      this.setState({
        filteredAnnotations:
          this.state.filteredAnnotations.filter(annotation => {
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
  };

  render() {
    const { currentUser, filteredAnnotations, searchBarInputText, searchedAnnotations } = this.state;

    if (currentUser === undefined) {
      return null;
    }
    console.log("this is the annotations", searchedAnnotations.length)
    const inputText = searchBarInputText.toLowerCase();
    let filteredAnnotationsCopy = searchedAnnotations.length === 0 ? filteredAnnotations : searchedAnnotations;
    //let filteredAnnotationsCopy = [];
    // filteredAnnotations.forEach((anno) => {
    //   const { content, anchorContent } = anno;
    //   if (content.toLowerCase().includes(inputText) || anchorContent.toLowerCase().includes(inputText)) {
    //     filteredAnnotationsCopy.push(anno);
    //   }
    // });

    filteredAnnotationsCopy = filteredAnnotationsCopy.sort((a, b) =>
      (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
    );

    let searchCount;
    if (this.state.showQuestions) {
      searchCount = filteredAnnotationsCopy.length + userQuestions.length;
    }
    else {
      searchCount = filteredAnnotationsCopy.length;
    }
    return (
      <div className="SidebarContainer" >
        <Title currentUser={currentUser} handleShowAnnotatePage={this.handleShowAnnotatePage} />
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
                searchCount={searchCount}
              />
            </div>
            <div>
              {!this.state.showFilter && <FilterSummary filter={this.state.filterSelection} />}
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
                  />
                )}
              {this.state.annotatingPage &&
                <NewAnnotation
                  url={this.state.url}
                  newSelection={this.state.pageName}
                  resetNewSelection={this.resetNewSelection}
                  offsets={null}
                  xpath={null}
                />
              }
            </div>
            <div className="userQuestions">
              <div className="userQuestionButtonContainer">
                <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showQuestions: !this.state.showQuestions }) }}>
                  {this.state.showQuestions ? ("Hide Questions") : ("Show Questions")}
                </div>
              </div>
              {this.state.showQuestions ? (
                <React.Fragment><AnnotationList annotations={userQuestions}
                  currentUser={currentUser}
                  url={this.state.url}
                  requestFilterUpdate={this.requestChildAnchorFilterUpdate}
                  notifyParentOfPinning={this.handlePinnedAnnotation} />
                  <div className="userQuestionButtonContainer">
                    <div className="ModifyFilter userQuestions" onClick={_ => { this.setState({ showQuestions: !this.state.showQuestions }) }}>
                      {this.state.showQuestions ? ("Hide Questions") : ("Show Questions")}
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
          </div>
        )
        }
      </div>
    );
  }
}

export default Sidebar;
