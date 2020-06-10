import '../../assets/img/Adamite.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';
import { clean } from './helpers/objectCleaner';
import {
  getAllAnnotationsByUrl,
  createAnnotation,
  updateAnnotationById,
} from '../../firebase/index';

import './filterWindow.html';

let unsubscribeAnnotations = null;
var pageannotationsActive = [];

const broadcastAnnotationsUpdated = (message, annotations) => {
  chrome.runtime.sendMessage({
    msg: message,
    from: 'background',
    payload: annotations,
  });
};

const broadcastAnnotationsUpdatedTab = (message, annotations, tabId) => {
  chrome.tabs.query({ active: true }, tabs => {
    console.log("here are the tabs you cuck", tabs)
    chrome.tabs.sendMessage(
      tabId,
      {
        msg: message,
        from: 'background',
        payload: annotations,
      }
    );
  });
};

function promiseToComeBack(url) {
  pageannotationsActive.push({
    url: url,
    annotations: null,
    timeout: 500,
    unsubscribe: null
  });
  return new Promise((resolve, reject) => {
    resolve(getAllAnnotationsByUrl(url).onSnapshot(querySnapshot => {
      let annotations = [];
      querySnapshot.forEach(snapshot => {
        annotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      });
      var pos = pageannotationsActive.map(function (e) { return e.url; }).indexOf(url);
      pageannotationsActive[pos].annotations = annotations;
      broadcastAnnotationsUpdated("CONTENT_UPDATED", annotations)
      chrome.tabs.query({}, tabs => {

        tabs = tabs.filter(e => e.url === pageannotationsActive[pos].url)
        tabs.forEach(function (tab) {
          chrome.tabs.sendMessage(tab.id, {
            msg: 'REFRESH_HIGHLIGHTS',
            payload: annotations,
          });
        });
        console.log("these are changed tabs", tabs)
      });
    }));
  });
}

let createdWindow = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    sendResponse({ url: sender.tab.url });
  }
  else if (request.msg === 'GET_ANNOTATIONS_PAGE_LOAD') {
    var findActiveUrl = pageannotationsActive.filter(e => e.url === request.url)
    if (findActiveUrl.length !== 0) {
      console.log("Found snnotations!", sender.tab.id)
      broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", findActiveUrl[0].annotations, sender.tab.id);
      broadcastAnnotationsUpdatedTab("HIGHLIGHT_ANNOTATIONS", findActiveUrl[0].annotations, sender.tab.id);
    }
    else {
      promiseToComeBack(request.url)
        .then(function (e) {
          pageannotationsActive[pageannotationsActive.length - 1].unsubscribe = e;
        });
    }
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
      // chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      //   chrome.tabs.sendMessage(
      //     tabs[0].id,
      //     {
      //       msg: 'ANNOTATION_ADDED',
      //       newAnno: highlightObj,
      //     }
      //   );
      // });
    });
  } else if (request.from === 'content' && request.msg === 'CONTENT_SELECTED') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: 'CONTENT_SELECTED',
      from: 'background',
      payload: request.payload,
    });
  } else if (request.msg === 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE') {
    const { url } = request.payload;
    //console.log("REQUEST ANNOTATED TEXT ON THIS PAGE", annotations)
    // var test = getAllAnnotationsByUrlCache(url).then(function (cacheAnno) {
    //   var test = cacheAnno.filter(e => e.url === url);
    //   const annotationsOnPage = test // can use this later so we get all annotations that match our filter criterias
    //   console.log("THIS IS HIGHLIGHTS", test)
    //   //sendResponse({ annotationsOnPage });
    // });

    // const annotationsOnPage = test // can use this later so we get all annotations that match our filter criterias
    // sendResponse({ annotationsOnPage });
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
