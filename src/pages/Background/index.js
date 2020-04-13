import '../../assets/img/icon-34.png';
import '../../assets/img/icon-128.png';
import './helpers/sidebarHelper';

console.log('This is the background page.');
console.log('Put the background scripts here.');

const broadcastAllAnnotations = () => {
  let annotations = localStorage.getItem('annotations');
  annotations = annotations ? JSON.parse(annotations) : {};
  chrome.tabs.query(
    {
      currentWindow: true
    }, function (tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          msg: 'annotations_updated',
          payload: {
            annotations
          }
        })
      })
    }
  )
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'what_is_my_url') {
    sendResponse({ url: sender.tab.url })
  }
  if (request.msg === 'SAVE_ANNOTATED_TEXT') {
    const { url, content } = request.payload;
    let annotations = localStorage.getItem('annotations');
    annotations = annotations ? JSON.parse(annotations) : {};
    if (annotations[url]) {
      annotations[url].push(content);
    } else {
      annotations[url] = [content];
    }
    localStorage.setItem('annotations', JSON.stringify(annotations));
    broadcastAllAnnotations()
  } else if (request.msg === 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE') {
    let { url } = request.payload;
    if (!url) {
      url = sender.tab.url;
    }
    let annotations = localStorage.getItem('annotations');
    annotations = annotations ? JSON.parse(annotations) : {};
    const annotationsOnPage = annotations[url] ? annotations[url] : [];
    sendResponse({ annotationsOnPage });
  }
});
