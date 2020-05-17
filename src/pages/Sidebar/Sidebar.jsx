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
    offsets: null,
    xpath: null,
    currentUser: undefined,
    // showFilter: false,
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

  // displayFilter() {
  //   this.setState({ showFilter: !this.state.showFilter });
  // }

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

  checkAnnoType(annotation, annoType) {
    if (!annoType.length || annoType === 'all') {
      return true;
    }
    return this.containsObject(annotation.type, annoType);
  }

  checkSiteScope(annotation, siteScope) {
    if (siteScope === null) {
      return true;
    }
    if (siteScope === 'onPage') {
      console.log('onpage sitescope');
      console.log(annotation.url === this.state.url);
      return annotation.url === this.state.url;
    }
    else if (siteScope === 'acrossWholeSite') {
      let url = new URL(this.state.url);
      return annotation.url.includes(url.hostname)
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

  applyFilter = (filterSelection) => {
    if (filterSelection === 'setDefault') {
      console.log('setting default');
      this.setState({
        filteredAnnotations:
          this.state.annotations.filter(annotation => {
            return this.checkSiteScope(annotation, 'onPage') &&
              this.checkUserScope(annotation, ['public']) &&
              this.checkAnnoType(annotation, 'all')
          })
      });
    }
    else {
      this.setState({
        filteredAnnotations:
          this.state.annotations.filter(annotation => {
            return this.checkSiteScope(annotation, filterSelection.siteScope) &&
              this.checkUserScope(annotation, filterSelection.userScope) &&
              this.checkAnnoType(annotation, filterSelection.annoType);
          })
      });
    }

    console.log(this.state.filteredAnnotations);

  }


  resetNewSelection = () => {
    this.setState({ newSelection: null });
  };

  render() {
    const { currentUser, annotations, filteredAnnotations } = this.state;
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
            {/* <FaFilter className="Filter" onClick={_ => this.displayFilter()} />
            {this.state.showFilter &&  }*/}
            <Filter applyFilter={this.applyFilter} />
            {' '}
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
            <div className="AnnotationListPadding"></div>
            {this.state.filteredAnnotations.length === 0 ? (
              <AnnotationList annotations={annotations} currentUser={currentUser} />
            ) :
              (
                <AnnotationList annotations={filteredAnnotations} currentUser={currentUser} />
              )
            }
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default Sidebar;
