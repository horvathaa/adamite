import React from 'react';
import Title from './containers/Title/Title';

import './Sidebar.css';
import AnnotationList from './containers/AnnotationList/AnnotationList';

class Sidebar extends React.Component {
  state = {
    url: '',
    annotations: [],
  };

  componentDidMount() {
    chrome.runtime.sendMessage(
      {
        msg: 'REQUEST_TAB_URL',
      },
      (data) => {
        this.setState({ url: data.url });
      }
    );

    chrome.runtime.sendMessage(
      {
        msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
        payload: {},
        // url: window.location.href
      },
      (data) => {
        console.log(data);
        this.setState({ annotations: data.annotationsOnPage });
        console.log(this.state.annotations);
      }
    );

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (
        request.from === 'background' &&
        request.msg === 'ANNOTATIONS_UPDATED' &&
        request.payload.specific === true
      ) {
        const { annotations } = request.payload;
        this.setState({ annotations: annotations });
      }
    });
  }

  render() {
    return (
      <div className="SidebarContainer">
        <Title />
        <AnnotationList annotations={this.state.annotations} />
      </div>
    );
  }
}

export default Sidebar;
