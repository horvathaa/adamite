import '../../assets/img/Adamite.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';
import { clean } from './helpers/objectCleaner';
import {
  getAllAnnotationsByUrl,
  createAnnotation,
  updateAnnotationById,
  getAnnotationsAcrossSite,
  getAnnotationsByTag,
  getCurrentUser
} from '../../firebase/index';
import firebase from '../../firebase/firebase';

// helper method from
// https://stackoverflow.com/questions/18773778/create-array-of-unique-objects-by-property
function removeDuplicates(annotationArray) {
  const flags = new Set();
  const annotations = annotationArray.filter(anno => {
    if (flags.has(anno.id)) {
      return false;
    }
    flags.add(anno.id);
    return true;
  });
  return annotations;
}

let unsubscribeAnnotations = null;
var pageannotationsActive = [];
let annotationsAcrossWholeSite = [];

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
      let host = new URL(url).hostname;
      if (annotationsAcrossWholeSite[host] !== undefined) {
        annotations.concat(annotationsAcrossWholeSite[host].annotations);
        annotations = removeDuplicates(annotations);
      }
      pageannotationsActive[pos].annotations = annotations.filter(anno => anno.url === url);
      console.log('when is this getting called', annotations);
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



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    sendResponse({ url: sender.tab.url });
  }
  else if (request.msg === 'GET_ANNOTATIONS_PAGE_LOAD') {
    var findActiveUrl = pageannotationsActive.filter(e => e.url === request.url)
    if (findActiveUrl.length !== 0) {
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
  else if (request.msg === 'SAVE_HIGHLIGHT') {
    let { url, anchor, xpath, offsets } = request.payload;
    const hostname = new URL(url).hostname;

    // firebase: in action
    //content = JSON.parse(content); // consider just pass content as an object
    createAnnotation({
      taskId: null,
      SharedId: null,
      AnnotationContent: "",
      AnnotationAnchorContent: anchor,
      AnnotationAnchorPath: null,
      offsets: offsets,
      xpath: xpath,
      AnnotationType: "highlight", // could be other types (string)
      url,
      hostname,
      pinned: false,
      AnnotationTags: [],
      childAnchor: []
    });
  }
  else if (request.msg === 'SAVE_ANNOTATED_TEXT') {
    let { url, content } = request.payload;
    const hostname = new URL(url).hostname;

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
      hostname,
      pinned: false,
      AnnotationTags: content.tags,
      childAnchor: []
    }).then(value => {
      sendResponse({
        msg: 'DONE',
        value: value.id
      });
    });
  } else if (request.from === 'content' && request.msg === 'SAVE_NEW_ANCHOR') {
    let { newAnno, xpath, url, anchor, offsets, hostname } = request.payload;
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
      offsets: offsets,
      pinned: false,
      hostname: hostname
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
  } else if (request.msg === 'ADD_NEW_REPLY') {
    const { id, reply, replyTags, answer, question } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const replies = Object.assign({}, {
      replyContent: reply,
      author: author,
      timestamp: new Date().getTime(),
      answer: answer,
      question: question,
      tags: replyTags
    });
    updateAnnotationById(id, {
      replies: firebase.firestore.FieldValue.arrayUnion({
        ...replies
      })
    });
  }
  else if (request.from === 'content' && request.msg === 'CONTENT_SELECTED') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: 'CONTENT_SELECTED',
      from: 'background',
      payload: request.payload,
    });
  }
  else if (request.from === 'content' && request.msg === 'CONTENT_NOT_SELECTED') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: 'CONTENT_NOT_SELECTED',
      from: 'background',
      payload: request.payload,
    });
  }
  else if (request.from === 'content' && request.msg === 'REQUEST_PAGINATED_ACROSS_SITE_ANNOTATIONS') {
    const { hostname, url } = request.payload;
    let cursor = undefined;
    if (hostname in annotationsAcrossWholeSite) {
      cursor = annotationsAcrossWholeSite[hostname].cursor;
    }
    else {
      annotationsAcrossWholeSite[hostname] = { cursor: undefined, annotations: [] };
    }
    if (cursor === 'DONE') {
      sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations, cursor: "DONE" });
      return;
    }
    if (cursor !== undefined) {
      // use startAfter 
      getAnnotationsAcrossSite(hostname).startAfter(annotationsAcrossWholeSite[hostname].cursor).get().then(function (doc) {
        let currPage = pageannotationsActive.filter(page => page.url === url);
        annotationsAcrossWholeSite[hostname].annotations.push(...currPage[0].annotations);
        if (!doc.empty) {
          doc.docs.forEach(anno => {
            annotationsAcrossWholeSite[hostname].annotations.push({ id: anno.id, ...anno.data() });
          });
        }
        else {
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
          sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations, cursor: "DONE" });
          return;
        }
        // this isn't a perfect check - if the set of annotations happens to be divisible by 15 we will get one last
        // read from the query with a length of 15 but the next query will return 0
        if (doc.docs.length < 15) {
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
        }
        else {
          annotationsAcrossWholeSite[hostname].cursor = doc.docs[doc.docs.length - 1];
        }
        sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations });
      }).catch(function (error) {
        console.log('could not get doc: ', error);
      });
    }
    else {
      // first time requesting across whole site annotations from this hostname
      getAnnotationsAcrossSite(hostname).get().then(function (doc) {
        let currPage = pageannotationsActive.filter(page => page.url === url);
        annotationsAcrossWholeSite[hostname].annotations.push(...currPage[0].annotations);
        if (!doc.empty) {
          doc.docs.forEach(anno => {
            annotationsAcrossWholeSite[hostname].annotations.push({ id: anno.id, ...anno.data() });
          });
        }
        else {
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
          sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations });
          return;
        }
        // same issue as stated above
        if (doc.docs.length < 15) {
          annotationsAcrossWholeSite[hostname].cursor = 'DONE';
        }
        else {
          annotationsAcrossWholeSite[hostname].cursor = doc.docs[doc.docs.length - 1];
        }
        sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations, cursor: "NOT_DONE" });
      }).catch(function (error) {
        console.log('could not get doc: ', error);
      });

    }
    // need to think about use case where user's current URL has the majority of annotations on it - pagination will result
    // in many duplicate annotations that need to be filtered out and then keep reading to find unique annotations?
    // it seems like we need to do the comparison locally which sucks ass fuck u firebase


  }
  else if (request.msg === 'SEARCH_BY_TAG' && request.from === 'content') {
    const { tag } = request.payload;
    let annotationsWithTag = [];
    if (tag !== "") {
      getAnnotationsByTag(tag).get().then(function (doc) {
        if (!doc.empty) {
          doc.docs.forEach(anno => {
            annotationsWithTag.push({ id: anno.id, ...anno.data() });
          });
        }
        sendResponse({ annotations: annotationsWithTag });
      }).catch(function (error) {
        console.log('could not get doc: ', error);
      })
    }
  }
  else if (request.msg === 'UPDATE_XPATH_BY_IDS') {
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


  // else if (request.msg === 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE') {
  //   const { url } = request.payload;
  //   //console.log("REQUEST ANNOTATED TEXT ON THIS PAGE", annotations)
  //   // var test = getAllAnnotationsByUrlCache(url).then(function (cacheAnno) {
  //   //   var test = cacheAnno.filter(e => e.url === url);
  //   //   const annotationsOnPage = test // can use this later so we get all annotations that match our filter criterias
  //   //   console.log("THIS IS HIGHLIGHTS", test)
  //   //   //sendResponse({ annotationsOnPage });
  //   // });

  //   // const annotationsOnPage = test // can use this later so we get all annotations that match our filter criterias
  //   // sendResponse({ annotationsOnPage });
  // } 