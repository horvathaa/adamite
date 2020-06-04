import '../../assets/img/Adamite.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';
import { clean } from './helpers/objectCleaner';

import './filterWindow.html';

import {
  auth,
  createAnnotation,
  getAllAnnotationsByUserId,
  getAllAnnotationsByUrl,
  getAllAnnotationsByUserUrlAndMaxTime,
  getAllAnnotationsByUserIdAndUrl,
  updateAnnotationById,
  getAllAnnotations
} from '../../firebase/index';
import { FaSadCry } from 'react-icons/fa';
import Annotation from '../Sidebar/containers/AnnotationList/Annotation/Annotation';

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

function yada(annotations, url, uid) {
  console.log("here is some value", annotations)
  if (!annotations.hasOwnProperty('annotations') || (annotations.annotations !== null && annotations.annotations.length === 0)) {
    console.log("ine here")
    getAllAnnotationsByUrl(url).get()
      .then(function (item) {
        var toStore = []
        item.forEach(function (doc) {
          console.log("ITEM => ", doc.data());
          toStore.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        console.log(toStore);
        chrome.storage.local.set({ annotations: toStore });
      }).catch(function (error) {
        console.log("Error getting documents: ", error);
      });
  }
  else {
    var maxTimeStamp = Math.max.apply(Math, annotations.annotations.map(function (o) { return o.createdTimestamp; }))
    maxTimeStamp--;
    console.log("HERE IS TT");
    getAllAnnotationsByUserUrlAndMaxTime(url, maxTimeStamp).get()
      .then(function (item) {
        console.log("here are the itmes found", item)
        var toStore = []

        item.forEach(function (doc) {
          console.log("ITEM => ", doc.data());
          toStore.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        console.log("tostore", toStore)
        for (var i = 0; i < annotations.annotations.length; i++) {
          console.log("id", annotations.annotations[i].id)
          var found = toStore.filter(e => e.id == annotations.annotations[i].id)
          console.log("was it found?", found)
        }
        //add old annotations to new annotations if they don't exist in the new one

        // console.log(toStore);
        // chrome.storage.sync.set({ annotations: toStore });
      }).catch(function (error) {
        console.log("Error getting documents: ", error);
      });
  }

}

let createdWindow = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    sendResponse({ url: sender.tab.url });
  }
  else if (request.msg === 'GET_ANNOTATIONS_PAGE_LOAD') {
    console.log("here is the message", request)
    chrome.storage.local.get(annotations => {
      yada(annotations, request.url, request.uid)
      // var tt = annotations.annotation.filter(function (element) {
      //   return element.id === nodeRange.id;
      // });
    });
  }
  else if (request.msg === 'SAVE_ANNOTATED_TEXT') {
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
  } else if (request.msg === 'FILTER_BY_TAG') {
    chrome.runtime.sendMessage({ msg: 'REQUEST_FILTERED_ANNOTATIONS', from: 'background' }, (response) => {
      setTimeout(() => {
        if (response.done) {
          chrome.windows.create({
            url: chrome.runtime.getURL('filterWindow.html'),
            width: 600,
            height: 400,
            type: 'popup'
          }, (window) => {
            createdWindow = window;
          });
        }
      }, 500);
    });

  } else if (request.msg === 'TAGS_SELECTED' && request.from === 'background') {
    chrome.runtime.sendMessage({ msg: 'FILTER_TAGS', from: 'background', payload: request.payload.tags });
    chrome.windows.remove(createdWindow.id);
  } else if (request.msg === 'LOAD_EXTERNAL_ANCHOR' && request.from === 'content') {
    chrome.tabs.create({ url: request.payload });
  }
  return true;
});
