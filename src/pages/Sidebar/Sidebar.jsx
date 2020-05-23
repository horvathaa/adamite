import React from 'react';
import './Sidebar.css';
import { FaFilter } from 'react-icons/fa';
import Title from './containers/Title/Title';
import Authentication from './containers//Authentication//Authentication';
import AnnotationList from './containers/AnnotationList/AnnotationList';
import NewAnnotation from './containers/NewAnnotation/NewAnnotation';
import Filter from './containers/Filter/Filter';
import SearchBar from './containers/SearchBar/SearchBar';
import { getAllAnnotationsByUserIdAndUrl, getAllAnnotationsByUrl, getAllAnnotations, trashAnnotationById } from '../../firebase/index';
import { style } from 'glamor';

class Sidebar extends React.Component {

  state = {
    url: '',
    annotations: [],
    filteredAnnotations: [],
    newSelection: null,
    rect: null,
    offsets: null,
    xpath: null,
    currentUser: undefined,
    selected: undefined,
    dropdownOpen: false,
    searchBarInputText: ''
  };

  selection = {
    siteScope: 'onPage',
    userScope: ['public'],
    annoType: ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'],
    timeRange: 'all',
    archive: null,
    tags: []
  }

  setUpAnnotationsListener = (uid, url) => {
    if (this.unsubscribeAnnotations) {
      this.unsubscribeAnnotations();
    }
    // getAllAnnotationsByUserIdAndUrl(uid, url).onSnapshot(querySnapshot => {
    getAllAnnotations().onSnapshot(querySnapshot => {
      let annotations = [];
      querySnapshot.forEach(snapshot => {
        annotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      });
      this.setState({ annotations });
      this.requestFilterUpdate();
    });


  };

  componentWillMount() {
    if (this.unsubscribeAnnotations) {
      this.unsubscribeAnnotations();
    }

  }

  componentDidMount() {
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
        const { selection, offsets, xpath } = request.payload;
        this.setState({
          newSelection: selection,
          offsets: offsets,
          xpath: xpath,
        });
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
          filteredAnnotations: this.state.annotations.filter(function (element) { return element.id === target; })
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
      else if (request.from === 'background' && request.msg === 'REQUEST_FILTERED_ANNOTATIONS') {
        console.log(this.state);
        // sendResponse(this.state.filteredAnnotations);
        chrome.storage.local.set({ annotations: this.state.filteredAnnotations });
        sendResponse({ done: true });
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

  handleSearchBarInputText = (event) => {
    let inputText = event.target.value;
    this.setState({
      searchBarInputText: inputText,
    });
  };

  clearSearchBoxInputText = () => {
    this.setState({ searchBarInputText: '' });
  };

  checkAnnoType(annotation, annoType) {
    if (!annoType.length || annoType === 'all') {
      return true;
    }
    return this.containsObject(annotation.type, annoType);
  }

  checkSiteScope(annotation, siteScope) {
    if (!siteScope.length) {
      return true;
    }
    if (siteScope.includes('onPage') && !siteScope.includes('acrossWholeSite')) {
      return annotation.url === this.state.url;
    }
    else if (siteScope.includes('acrossWholeSite')) {
      let url = new URL(this.state.url);
      return annotation.url.includes(url.hostname)
    }
  }

  checkTimeRange(annotation, timeRange) {
    if (timeRange === null || timeRange === 'all') {
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
    if (!userScope.length) {
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
    if (!tags.length) {
      return true;
    }
    return tags.some(tag => annotation.tags.includes(tag));
  }

  getFilteredAnnotationListLength = () => {
    return this.state.filteredAnnotations.length;
  }

  applyFilter = (filterSelection) => {
    this.selection = filterSelection;
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

  requestFilterUpdate() {
    this.setState({
      filteredAnnotations:
        this.state.annotations.filter(annotation => {
          return this.checkSiteScope(annotation, this.selection.siteScope) &&
            this.checkUserScope(annotation, this.selection.userScope) &&
            this.checkAnnoType(annotation, this.selection.annoType) &&
            this.checkTimeRange(annotation, this.selection.timeRange) &&
            this.checkTags(annotation, this.selection.tags);
        })
    });
  }


  resetNewSelection = () => {
    this.setState({ newSelection: null });
  };

  render() {
    const { currentUser, annotations, dropdownOpen, filteredAnnotations, searchBarInputText } = this.state;

    if (currentUser === undefined) {
      return null;
    }

    const inputText = searchBarInputText.toLowerCase();
    const filteredAnnotationsCopy = [];
    filteredAnnotations.forEach((anno) => {
      const { content } = anno;
      if (content.toLowerCase().includes(inputText)) {
        filteredAnnotationsCopy.push(anno);
      }
    });

    return (
      <div className="SidebarContainer">
        <Title currentUser={currentUser} />
        {currentUser === null && <Authentication />}
        {currentUser !== null && (
          <div>
            <div className='TopRow'>
              <Filter applyFilter={this.applyFilter}
                filterAnnotationLength={this.getFilteredAnnotationListLength}
              />
              <SearchBar
                searchBarInputText={searchBarInputText}
                handleSearchBarInputText={this.handleSearchBarInputText}
                searchCount={filteredAnnotationsCopy.length}
              />
            </div>
            <div>
              {this.state.newSelection !== null &&
                this.state.newSelection.trim().length > 0 && (
                  <NewAnnotation
                    url={this.state.url}
                    newSelection={this.state.newSelection}
                    resetNewSelection={this.resetNewSelection}
                    offsets={this.state.offsets}
                    xpath={this.state.xpath}
                  />
                )}
            </div>
            <div>
              {!filteredAnnotationsCopy.length && this.state.newSelection === null ? (
                <div className="whoops">
                  There's nothing here! Try modifying your search/filter or writing a new annotation
                </div>
              ) : (
                  <AnnotationList annotations={filteredAnnotationsCopy}
                    currentUser={currentUser}
                    url={this.state.url} />
                )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Sidebar;
