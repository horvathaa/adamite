import '../../assets/img/Adamite.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';
import { clean } from './helpers/objectCleaner';

import {
  auth,
  createAnnotation,
  getAllAnnotationsByUserId,
  updateAnnotationById,
  getAllAnnotations
} from '../../firebase/index';
import { FaSadCry } from 'react-icons/fa';

let unsubscribeAnnotations = null;
let annotations = [];
auth.onAuthStateChanged(user => {
  if (user) {
    // unsubscribeAnnotations = getAllAnnotationsByUserId(user.uid)
    //   .orderBy('createdTimestamp', 'desc')
    //   .onSnapshot(querySnapshot => {
    unsubscribeAnnotations = getAllAnnotations()
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

let createdWindow = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    sendResponse({ url: sender.tab.url });
  } else if (request.msg === 'SAVE_ANNOTATED_TEXT') {
    let { url, content } = request.payload;

    // firebase: in action
    //content = JSON.parse(content); // consider just pass content as an object
    createAnnotation({
      taskId: null,
      SharedId: null,
      AnnotationContent: content.annotation,
      AnnotationAnchorContent: content.anchor,
      AnnotationAnchorPath: null,
      offsets: content.offsets,
      xpath: content.xpath,
      AnnotationType: content.annotationType, // could be other types (string)
      url,
      AnnotationTags: content.tags,
      childAnchor: []
    }).then(value => {
      sendResponse({
        msg: 'DONE',
        value: value.id
      });
    });
  } else if (request.from === 'content' && request.msg === 'SAVE_NEW_ANCHOR') {
    let { newAnno, xpath, url, anchor, offsets } = request.payload;
    // console.log('somewhow made it here', newAnno, xpath);
    createAnnotation({
      taskId: null,
      childAnchor: null,
      AnnotationContent: newAnno.content,
      AnnotationType: newAnno.type,
      SharedId: newAnno.sharedId,
      xpath: xpath,
      url: url,
      AnnotationTags: newAnno.tags,
      AnnotationAnchorContent: anchor,
      offsets: offsets
    }).then(value => {
      console.log(value);
      let highlightObj = {
        id: value.id,
        content: newAnno.content,
        xpath: xpath
      }
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            msg: 'ANNOTATION_ADDED',
            newAnno: highlightObj,
          }
        );
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
    const annotationsOnPage = annotations.filter(a => a.url === url); // can use this later so we get all annotations that match our filter criterias
    sendResponse({ annotationsOnPage });
  } else if (request.msg === 'UPDATE_XPATH_BY_IDS') {
    // firebase: in action
    // var assd = request.payload.toUpdate;
    // for (var i = 0; i < assd.length; i++) {
    //   console.log("PAYLOAD", assd)
    //   console.log("CLEANNN", clean({
    //     "xpath.start": assd[i].xpath.start,
    //     "xpath.startOffset": assd[i].xpath.startOffset,
    //     "xpath.end": assd[i].xpath.end,
    //     "xpath.endOffset": assd[i].xpath.endOffset,
    //   }));
    // }


    request.payload.toUpdate.forEach(e =>
      updateAnnotationById(
        e.id, clean({
          "xpath.start": e.xpath.start,
          "xpath.startOffset": e.xpath.startOffset,
          "xpath.end": e.xpath.end,
          "xpath.endOffset": e.xpath.endOffset,
        }),
      )
    );
  } else if (request.msg === 'LOAD_EXTERNAL_ANCHOR' && request.from === 'content') {
    chrome.tabs.create({ url: request.payload });
  }
  return true;
});
