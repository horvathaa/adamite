import React from 'react';
import './Sidebar.css';

import Title from './containers/Title/Title';
import AnnotationList from './containers/AnnotationList/AnnotationList';
import NewAnnotation from './containers/NewAnnotation/NewAnnotation';

class Sidebar extends React.Component {
  state = {
    url: '',
    annotations: [],
    newSelection: null,
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
      } else if (
        request.from === 'background' &&
        request.msg === 'CONTENT_SELECTED'
      ) {
        console.log(request.payload);
        const { selection } = request.payload;
        this.setState({ newSelection: selection });
      }
    });
  }
  // todo: get rid of o(n2) complexity... it's pretty slow
  // possibly change way anchor's and annotations are associated

  render() {
    return (
      <div className="SidebarContainer">
        <Title />
        <NewAnnotation newAnnotation={this.state.newSelection} />
        <AnnotationList annotations={this.state.annotations} />
      </div>
    );
  }
}

export default Sidebar;
