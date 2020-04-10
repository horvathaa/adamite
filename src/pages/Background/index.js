import '../../assets/img/icon-34.png';
import '../../assets/img/icon-128.png';

console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  } else if (request.msg === 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE') {
    const { url } = request.payload;
    let annotations = localStorage.getItem('annotations');
    annotations = annotations ? JSON.parse(annotations) : {};
    const annotationsOnPage = annotations[url] ? annotations[url] : [];
    sendResponse({ annotationsOnPage });
  }
});
