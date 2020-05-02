import '../../assets/img/icon-34.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';

import {
  auth,
  createAnnotation,
  getAllAnnotationsByUserId,
} from '../../firebase/index';

console.log('This is the background page.');
console.log('Put the background scripts here.');

let unsubscribeAnnotations = null;
let annotations = [];
auth.onAuthStateChanged(user => {
  if (user) {
    unsubscribeAnnotations = getAllAnnotationsByUserId(user.uid)
      .orderBy('createdTimestamp', 'desc')
      .onSnapshot(querySnapshot => {
        let annArray = [];
        querySnapshot.forEach(snapshot => {
          annArray.push({
            ...snapshot.data(),
            id: snapshot.id,
          });
        });
        annotations = annArray;
        broadcastAnnotationsUpdated();
      });
  } else {
    if (unsubscribeAnnotations) {
      unsubscribeAnnotations();
      unsubscribeAnnotations = null;
    }
  }
});

const broadcastAnnotationsUpdated = () => {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        from: 'background',
        msg: 'ANNOTATIONS_UPDATED',
      });
    });
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    sendResponse({ url: sender.tab.url });
  } else if (request.msg === 'SAVE_ANNOTATED_TEXT') {
    let { url, content } = request.payload;

    // firebase: in action
    content = JSON.parse(content); // consider just pass content as an object
    createAnnotation({
      taskId: null,
      AnnotationContent: content.annotation,
      AnnotationAnchorContent: content.anchor,
      AnnotationAnchorPath: null,
      AnnotationType: 'default', // could be other types (string)
      url,
      AnnotationTags: [],
      div: content.div,
      todo: content.todo,
    }).then(value => {
      console.log(value);
      sendResponse({
        msg: 'DONE',
      });
    });
  } else if (request.from === 'content' && request.msg === 'CONTENT_SELECTED') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: 'CONTENT_SELECTED',
      from: 'background',
      payload: request.payload,
    });
  } else if (request.msg === 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE') {
    const { url } = request.payload;
    const annotationsOnPage = annotations.filter(a => a.url === url);
    sendResponse({ annotationsOnPage });
  }
  return true;
});
