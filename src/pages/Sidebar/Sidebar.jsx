import React from 'react';
import './Sidebar.css';
import { FaFilter } from 'react-icons/fa';
import Title from './containers/Title/Title';
import Authentication from './containers//Authentication//Authentication';
import AnnotationList from './containers/AnnotationList/AnnotationList';
import NewAnnotation from './containers/NewAnnotation/NewAnnotation';

import { getAllAnnotationsByUserIdAndUrl, getAllAnnotationsByUrl, getAllAnnotations, trashAnnotationById } from '../../firebase/index';

class Sidebar extends React.Component {
  state = {
    url: '',
    annotations: [],
    newSelection: null,
    rect: null,
    offsets: null,
    xpath: null,
    currentUser: undefined,
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
        console.log("hsssssssss");
        console.log(xpath);
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
        <FaFilter />
        {currentUser !== null && (
          <React.Fragment>
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
            <AnnotationList annotations={annotations} currentUser={currentUser} />
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default Sidebar;
