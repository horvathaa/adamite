import '../../assets/img/icon-34.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';

console.log('This is the background page.');
console.log('Put the background scripts here.');

const broadcastAllAnnotations = toUrl => {
  let annotations = localStorage.getItem('annotations');
  annotations = annotations ? JSON.parse(annotations) : {};
  if (annotations[toUrl]) {
    for (let i = 0; i < annotations[toUrl].length; i++) {
      annotations[toUrl][i] = JSON.parse(annotations[toUrl][i]);
    }
  }
  const query = { currentWindow: true };
  if (toUrl) {
    query.url = toUrl;
    annotations = annotations[toUrl] ? annotations[toUrl] : [];
  }
  chrome.tabs.query(query, function (tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        from: 'background',
        msg: 'ANNOTATIONS_UPDATED',
        payload: {
          specific: toUrl ? true : false,
          annotations,
        },
      });
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    sendResponse({ url: sender.tab.url });
  } else if (request.msg === 'SAVE_ANNOTATED_TEXT') {
    const { url, content } = request.payload;
    let annotations = localStorage.getItem('annotations');
    annotations = annotations ? JSON.parse(annotations) : {};
    if (annotations[url]) {
      annotations[url].push(content);
    } else {
      annotations[url] = [content];
    }
    localStorage.setItem('annotations', JSON.stringify(annotations));
    sendResponse({
      msg: 'DONE',
    });
    broadcastAllAnnotations(url);
  } else if (request.msg === 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE') {
    let { url } = request.payload;
    if (!url) {
      url = sender.tab.url;
    }
    let annotations = localStorage.getItem('annotations');
    annotations = annotations ? JSON.parse(annotations) : {};
    if (annotations[url]) {
      for (let i = 0; i < annotations[url].length; i++) {
        annotations[url][i] = JSON.parse(annotations[url][i]);
      }
    }
    const annotationsOnPage = annotations[url] ? annotations[url] : [];
    sendResponse({ annotationsOnPage });
  } else if (request.from === 'content' && request.msg === 'CONTENT_SELECTED') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: 'CONTENT_SELECTED',
      from: 'background',
      payload: request.payload,
    });
  }
});
