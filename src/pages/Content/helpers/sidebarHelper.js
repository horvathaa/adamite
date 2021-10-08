import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import Frame from '../modules/frame/frame';
import { ToastContainer, toast } from 'react-toastify';
import './annoRec.css';
import CardWrapper from '../../Sidebar/containers/CardWrapper/CardWrapper';
import Adamite from '../../../assets/img/Adamite.png';


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

const AnnoPreview = ({ annoList }) => {

  const [show, setShow] = useState(false);
  const descrip = annoList.length === 1 ? `There is ${annoList.length} annotation on this page` : `There are ${annoList.length} annotations on this page`;

  const AnchorObject = ({ anchorText }) => {
    return (
        <div className="AnchorTextContainerExpanded">
          {anchorText}
        </div>
    )
  }

  const Anno = ({ anno }) => {
    const anchorText = anno.childAnchor.map(a => { if(anno.url.includes(a.url)) { return a.anchor} })
    return (
      <div className="AnnotationContainer">
        {anchorText.map(anch => <AnchorObject anchorText={anch} />)}
        <CardWrapper anno={anno} />
      </div>
    )
  }
  
  
  return (
    <React.Fragment>
      <div className="anno-rec-descrip" onClick={() => setShow(!show)}>
        <div className="img-container">
            <img src={chrome.extension.getURL(Adamite)} className="adamite-logo" />
        </div>
        {descrip}
      </div>
      {show && 
        <div className="anno-rec-container">
          {annoList.map(a => <Anno anno={a} />)}
        </div>
      }
    </React.Fragment>
  )
  
}


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
    const inputField = document.querySelectorAll("input.gLFyf.gsfi")[0];
    inputField.value ? sendResponse(inputField.value) : sendResponse("undefined");
    const links = [];
    document.querySelectorAll('div.yuRUbf > a').forEach(a => links.push(a.href));
    chrome.runtime.sendMessage({
      msg: 'GET_GOOGLE_RESULT_ANNOTATIONS',
      from: 'content',
      payload: {
        urls: links
      }
    }, response => {
      if(response && response.length) {
        const as = document.querySelectorAll('div.yuRUbf > a');
        const matchedUrls = [...new Set(response.flatMap(a => a.url))];
        let nodeAnnoPairs = [];
        as.forEach(a => {
          let href = a.href;
          if(href.includes("developer.mozilla.org/en/")) {
            let arr = href.split("/en/")
            href = arr[0] + '/en-US/' + arr[1]
          }
          if(matchedUrls.includes(href)) {
            nodeAnnoPairs.push({node: a.parentNode, anno: response.filter(anno => anno.url.includes(href))});
          }
        });
        
        
        nodeAnnoPairs.forEach((p) => {
          const parentDiv = document.createElement('div');
          p.node.appendChild(parentDiv);
          ReactDOM.render(<AnnoPreview annoList={p.anno} />, parentDiv);
        })
      }
    });
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