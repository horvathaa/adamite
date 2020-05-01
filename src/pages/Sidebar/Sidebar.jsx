import React from 'react';
import './Sidebar.css';

import Title from './containers/Title/Title';
import Authentication from './containers//Authentication//Authentication';
import AnnotationList from './containers/AnnotationList/AnnotationList';
import NewAnnotation from './containers/NewAnnotation/NewAnnotation';

class Sidebar extends React.Component {
  state = {
    url: '',
    annotations: [],
    newSelection: null,
    rect: null,
    offset: 0,
    currentUser: undefined,
  };

  componentDidMount() {
    chrome.runtime.sendMessage(
      {
        msg: 'GET_CURRENT_USER',
      },
      data => {
        this.setState({ currentUser: data.payload.currentUser });
      }
    );

    chrome.runtime.sendMessage(
      {
        msg: 'REQUEST_TAB_URL',
      },
      data => {
        this.setState({ url: data.url });
      }
    );

    chrome.runtime.sendMessage(
      {
        msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
        payload: {},
      },
      data => {
        console.log(data);
        this.setState({ annotations: data.annotationsOnPage });
        console.log(this.state.annotations);
      }
    );

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (
        request.from === 'background' &&
        request.msg === 'USER_AUTH_STATUS_CHANGED'
      ) {
        this.setState({ currentUser: request.payload.currentUser });
      } else if (
        request.from === 'background' &&
        request.msg === 'ANNOTATIONS_UPDATED' &&
        request.payload.specific === true
      ) {
        const { annotations } = request.payload;
        this.setState({ annotations: annotations });
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

  resetNewSelection = () => {
    this.setState({ newSelection: null });
  };

  render() {
    const { currentUser } = this.state;

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
            <AnnotationList annotations={this.state.annotations} />
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default Sidebar;
