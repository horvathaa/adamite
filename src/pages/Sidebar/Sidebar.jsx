import React from 'react';
import './Sidebar.css';
import { FaFilter } from 'react-icons/fa';
import Title from './containers/Title/Title';
import Authentication from './containers//Authentication//Authentication';
import AnnotationList from './containers/AnnotationList/AnnotationList';
import NewAnnotation from './containers/NewAnnotation/NewAnnotation';
import Filter from './containers/Filter/Filter';
import { getAllAnnotationsByUserIdAndUrl, getAllAnnotationsByUrl, getAllAnnotations, trashAnnotationById } from '../../firebase/index';
import { style } from 'glamor';

class Sidebar extends React.Component {
  state = {
    url: '',
    annotations: [],
    filteredAnnotations: [],
    newSelection: null,
    rect: null,
    offset: 0,
    currentUser: undefined,
    showFilter: false,
    selected: undefined
    // selected: { - need to get default filter working
    //   siteScope: "onPage",
    //   userScope: "public",
    //   annoType: "all",
    //   timeRange: "all",
    //   archive: "no",
    //   tag: "all"
    // }
  };

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
        const { selection, rect, offset } = request.payload;
        this.setState({
          newSelection: selection,
          rect: rect,
          offset: offset,
        });
      } else if (
        request.from === 'content' &&
        request.msg === 'ANCHOR_CLICKED'
      ) {
        const { target } = request.payload;
        this.state.annotations.forEach(anno => {
          if (anno.id === target) {
            anno.active = true;
          } else {
            anno.active = false;
          }
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
    });
  }

  displayFilter() {
    this.setState({ showFilter: !this.state.showFilter });
  }

  applyFilter = (filterSelection) => {
    console.log(filterSelection);
    // this.setState(prevState => { - need to get filter working as a state variable
    //   let selected = Object.assign({}, prevState.selected);
    //   selected.siteScope = filterSelection.siteScope;
    //   selected.userScope = filterSelection.userScope;
    //   selected.annoType = filterSelection.annoType;
    //   selected.timeRange = filterSelection.timeRange;
    //   selected.archive = filterSelection.archive;
    //   selected.tags = filterSelection.tags;
    //   console.log(selected);
    //   return { selected };
    // });
    //console.log(this.state.selected);
    // if (this.state.selected !== undefined) {
    // switch to filteredAnnotations - set default filter and then pass those filtered
    // annotations to annotationlist
    this.setState({
      annotations:
        this.state.annotations.filter(annotation => {
          if (filterSelection.siteScope !== null) {
            if (filterSelection.siteScope === 'onPage') {
              console.log('in onpage');
              if (filterSelection.userScope.includes('onlyMe')) {
                return annotation.url === this.state.url && annotation.authorId === this.state.currentUser.uid;
              }
              else if (filterSelection.userScope.includes('public') || !filterSelection.userScope.length) {
                return annotation.url === this.state.url;
              }
            }
            else if (filterSelection.siteScope === 'acrossWholeSite') {
              let url = new URL(this.state.url);
              if (filterSelection.userScope.includes('onlyMe')) {
                return annotation.url.includes(url.hostname) && annotation.authorId === this.state.currentUser.uid;
              }
              else if (filterSelection.userScope.includes('public') || !filterSelection.userScope.length) {
                return annotation.url.includes(url.hostname);
              }
            }
          }
          else if (filterSelection.userScope.length) {
            if (filterSelection.userScope.includes('onlyMe')) {
              return annotation.authorId === this.state.currentUser.uid;
            }
            else if (filterSelection.userScope.includes('public')) {
              return true;
            }
          }
        })
    });

  }


  resetNewSelection = () => {
    this.setState({ newSelection: null });
  };

  render() {
    const { currentUser, annotations } = this.state;
    console.log(annotations);

    if (currentUser === undefined) {
      // loading currentUser
      return null;
    }

    return (
      <div className="SidebarContainer">
        <Title currentUser={currentUser} />
        {currentUser === null && <Authentication />}
        {currentUser !== null && (
          <React.Fragment>
            <FaFilter className="Filter" onClick={_ => this.displayFilter()} />
            {this.state.showFilter && <Filter applyFilter={this.applyFilter} />}
            {' '}
            {this.state.newSelection !== null &&
              this.state.newSelection.trim().length > 0 && (
                <NewAnnotation
                  url={this.state.url}
                  newSelection={this.state.newSelection}
                  resetNewSelection={this.resetNewSelection}
                  rect={this.state.rect}
                  offset={this.state.offset}
                />
              )}
            <div className="AnnotationListPadding"></div>
            <AnnotationList annotations={annotations} currentUser={currentUser} />
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default Sidebar;
