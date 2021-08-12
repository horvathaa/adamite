import React from 'react';
import ReactDOM from 'react-dom';
import Frame from '../modules/frame/frame';
import { ToastContainer, toast } from 'react-toastify';

let shouldShrinkBody = true;
let sidebarLocation = 'right';
let sidebarWidth = 280;

const setSidebarWidth = (width) => {
  sidebarWidth = width;
};

chrome.storage.sync.get(['doc-annotator-sidebar-width'], (result) => {
  let widthObj = result['doc-annotator-sidebar-width'];
  if (widthObj !== undefined) {
    sidebarWidth = JSON.parse(widthObj).width;
  }
});

document.body.style.transition = 'margin .25s cubic-bezier(0, 0, 0.3, 1)';

function shrinkBody(isOpen) {
  if (shouldShrinkBody) {
    if (sidebarLocation === 'right') {
      if (isOpen) {
        document.body.style.marginRight = `${sidebarWidth + 10}px`;
      } else {
        document.body.style.marginRight = '0px';
      }
    } else if (sidebarLocation === 'left') {
      if (isOpen) {
        document.body.style.marginLeft = `${sidebarWidth + 10}px`;
      } else {
        document.body.style.marginLeft = '0px';
      }
    }
  }
}

function fixShrinkBody(isOpen) {
  if (isOpen) {
    if (shouldShrinkBody) {
      if (sidebarLocation === 'left') {
        document.body.style.marginLeft = `${sidebarWidth + 10}px`;
      } else {
        document.body.style.marginRight = `${sidebarWidth + 10}px`;
      }
    } else {
      if (sidebarLocation === 'left') {
        document.body.style.marginLeft = '0px';
      } else {
        document.body.style.marginRight = '0px';
      }
    }
  } else {
    document.body.style.marginLeft = '0px';
    document.body.style.marginRight = '0px';
  }
}

let sidebarRoot = document.createElement('div');
document.body.appendChild(sidebarRoot);
sidebarRoot.setAttribute('id', 'doc-annotator-sidebar-root');

function mountSidebar() {
  const App = (
    <Frame
      url={chrome.extension.getURL('sidebar.html')}
      shrinkBody={shrinkBody}
      fixShrinkBody={fixShrinkBody}
      viewportWidth={window.innerWidth}
      sidebarLocation={sidebarLocation}
      setSidebarWidth={setSidebarWidth}
    />
  );
  ReactDOM.render(App, sidebarRoot);
}

function unmountSidebar() {
  try {
    document.body.style.marginLeft = '0px';
    document.body.style.marginRight = '0px';
    ReactDOM.unmountComponentAtNode(sidebarRoot);
  } catch (e) {
    console.log(e);
  }
}

chrome.storage.sync.get(['shouldShrinkBody'], (result) => {
  if (result.shouldShrinkBody !== undefined) {
    shouldShrinkBody = result.shouldShrinkBody === true;
  }
});

chrome.storage.sync.get(['sidebarOnLeft'], (result) => {
  if (result.sidebarOnLeft !== undefined) {
    sidebarLocation = result.sidebarOnLeft === true ? 'left' : 'right';
  }
  mountSidebar();
});

/**
 * Chrome runtime event listener
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.from === 'background' && request.msg === 'TOGGLE_SIDEBAR') {
    if (Frame.isReady()) {
      Frame.toggle(request.toStatus);
    }
  } else if(
    request.from === 'background' &&
    request.msg === 'GOOGLE_SEARCH'
  ) {
    console.log('in listener');
    const inputField = document.querySelectorAll("input.gLFyf.gsfi")[0];
    console.log('inputField', inputField);
    inputField.value ? sendResponse(inputField.value) : sendResponse("undefined");
  } else if (
    request.from === 'background' &&
    request.msg === 'UPDATE_SIDEBAR_ON_LEFT_STATUS'
  ) {
    const { toStatus } = request;
    sidebarLocation = toStatus === true ? 'left' : 'right';
    unmountSidebar();
    mountSidebar();
    checkSidebarStatus();
  } else if (
    request.from === 'background' &&
    request.msg === 'UPDATE_SHOULD_SHRINK_BODY_STATUS'
  ) {
    const { toStatus } = request;
    shouldShrinkBody = toStatus;
    Frame.shrinkBody();

  } else if (request.from === 'sidebar' && request.msg === 'RENDER_NO_SEARCH_RESULTS') {
    let positionString = "";
    chrome.storage.sync.get(['sidebarOnLeft'], result => {
      if (result.sidebarOnLeft) {
        positionString = "top-right";
      }
      else { positionString = "top-left"; }
      toast.warning('No results!', {
        position: positionString,
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      let modal = document.createElement("div");
      modal.classList.add("success-notif-div");
      document.body.appendChild(modal);
      const toastModal = <ToastContainer
        position={positionString}
        autoClose={4000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />;
      ReactDOM.render(toastModal, modal);
    })
  }
  else if (request.from === 'sidebar' && request.msg === 'SHOW_NO_GROUP_ANNOTATIONS') {
    let positionString = "";
    chrome.storage.sync.get(['sidebarOnLeft'], result => {
      if (result.sidebarOnLeft) {
        positionString = "top-right";
      }
      else { positionString = "top-left"; }
      toast.warning('No annotations in this group - try making some!', {
        position: positionString,
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      let modal = document.createElement("div");
      modal.classList.add("success-notif-div");
      document.body.appendChild(modal);
      const toastModal = <ToastContainer
        position={positionString}
        autoClose={4000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />;
      ReactDOM.render(toastModal, modal);
    })
  }

  // else if (
  //   request.from === 'background' &&
  //   request.msg === 'CONTENT_UPDATED') {
  //   chrome.runtime.sendMessage(
  //     {
  //       from: 'content',
  //       msg: 'CONTENT_UPDATED',
  //       payload: { annotations: request.payload, tabId: request.tabId, url: request.url }
  //     }
  //   )
  // }

  // return true;

});

const checkSidebarStatus = () => {
  chrome.runtime.sendMessage(
    {
      from: 'content',
      msg: 'REQUEST_SIDEBAR_STATUS',
    },
    (response) => {
      if(response !== 'annotateOnly') {
        let sidebarOpen = response;
        if (Frame.isReady()) {
          Frame.toggle(sidebarOpen);
        }
      }
    }
  );
};

// checkSidebarStatus();

window.addEventListener('keydown', (event) => {
  // use 'Ctrl/Command + Esc' or 'Ctrl + `' to toggle sidebar
  if (
    (event.ctrlKey && event.key === '`') ||
    (event.ctrlKey && event.key === 'Escape') ||
    (event.metaKey && event.key === 'Escape') ||
    (event.altKey && event.key === '`') ||
    (event.altKey && event.key === 'Escape')
  ) {
    chrome.runtime.sendMessage({
      from: 'content',
      msg: 'REQUEST_TOGGLE_SIDEBAR',
    });
  }
});