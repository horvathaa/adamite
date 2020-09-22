import '../../assets/img/Adamite.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';
import './helpers/elasticSearchWrapper';
import { clean } from './helpers/objectCleaner';
import {
  getAllAnnotationsByUrl,
  getPrivateAnnotationsByUrl,
  createAnnotation,
  updateAnnotationById,
  getAnnotationsAcrossSite,
  getAnnotationsByTag,
  getCurrentUser,
  getAllPinnedAnnotationsByUserId,
  getAllPrivatePinnedAnnotationsByUserId,
  deleteAnnotationForeverById,
  getCurrentUserId,
  getPrivateAnnotationsAcrossSite,
  updateAllAnnotations
} from '../../firebase/index';
import firebase from '../../firebase/firebase';

function updateList(list, id, annotations) {
  let obj = list.filter(obj => id === obj.tabId);
  let objToUpdate = obj[0];
  objToUpdate.annotations = annotations;
  let temp2 = list.filter(obj => obj.tabId !== id);
  temp2.push(objToUpdate);
  // temp2 = removeDuplicates(temp2);
  return temp2;
}

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) {
  return url.split(/[?#]/)[0];
}

function containsObjectWithId(id, list) {
  const test = list.filter(obj => obj.tabId === id);
  return test.length !== 0;
}
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
let tabAnnotationCollect = [];
let annotationsAcrossWholeSite = [];
let annotations = [];
let publicAnnotations = [];
let privateAnnotations = [];
let publicListener;
let privateListener;

const broadcastAnnotationsUpdated = (message, annotations) => {
  chrome.runtime.sendMessage({
    msg: message,
    from: 'background',
    payload: annotations,
  });
};

const broadcastAnnotationsUpdatedTab = (message, annotations, tabId) => {
  chrome.tabs.query({ active: true }, tabs => {
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


function setUpGetAllAnnotationsByUrlListener(url, annotations) {
  // pageannotationsActive.push({
  //   url: url,
  //   annotations: null,
  //   timeout: 500,
  //   unsubscribe: null
  // });
  return new Promise((resolve, reject) => {
    let tempPublicAnnotations = [];
    resolve(getAllAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
      querySnapshot2.forEach(snapshot => {
        tempPublicAnnotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      })
      // console.log('public annos', tempPublicAnnotations);
      // var pos = pageannotationsActive.map(function (e) { return e.url; }).indexOf(url);
      // let host = new URL(url).hostname;
      // if (annotationsAcrossWholeSite[host] !== undefined) {
      //   annotations.concat(annotationsAcrossWholeSite[host].annotations);
      let annotationsToBroadcast = tempPublicAnnotations.concat(privateAnnotations);
      annotationsToBroadcast = removeDuplicates(annotationsToBroadcast);
      chrome.tabs.query({ active: true }, tabs => {
        // console.log('here be public tabs idk what happened', tabs, annotationsToBroadcast);
        if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
          tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
          // console.log('updated tabAnnotationCollect', tabAnnotationCollect);
          // tabAnnotationCollect[tabs[0].id] = annotationsToBroadcast;
        }
        else {
          tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
        }
      });

      // annotations = removeDuplicates(annotations);
      // }
      // pageannotationsActive[pos].annotations = annotations;
      // pageannotationsActive[pos].annotations = pageannotationsActive[pos].annotations.sort((a, b) =>
      //   (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
      // );
      // pageannotationsActive[pos].annotations = removeDuplicates(pageannotationsActive[pos].annotations);
      // console.log('bout to broadcast sigh', annotations);
      broadcastAnnotationsUpdated("CONTENT_UPDATED", annotationsToBroadcast);
      publicAnnotations = tempPublicAnnotations;
      chrome.tabs.query({}, tabs => {
        tabs = tabs.filter(e => e.url === url)
        tabs.forEach(function (tab) {
          chrome.tabs.sendMessage(tab.id, {
            msg: 'REFRESH_HIGHLIGHTS',
            payload: annotationsToBroadcast,
          });
        });
        // console.log("these are changed tabs", tabs)
      });
    }))
  })
}

function promiseToComeBack(url, annotations) {
  // pageannotationsActive.push({
  //   url: url,
  //   annotations: null,
  //   timeout: 500,
  //   unsubscribe: null
  // });
  return new Promise((resolve, reject) => {
    let tempPrivateAnnotations = [];
    resolve(getPrivateAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
      querySnapshot2.forEach(snapshot => {
        tempPrivateAnnotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      });

      // var pos = pageannotationsActive.map(function (e) { return e.url; }).indexOf(url);
      // let host = new URL(url).hostname;
      // if (annotationsAcrossWholeSite[host] !== undefined) {
      //   annotations.concat(annotationsAcrossWholeSite[host].annotations);

      let annotationsToBroadcast = tempPrivateAnnotations.concat(publicAnnotations);
      annotationsToBroadcast = removeDuplicates(annotationsToBroadcast);
      chrome.tabs.query({ active: true }, tabs => {
        // console.log('here be tabs idk what happened', tabs, annotationsToBroadcast);
        if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
          tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
          // console.log('updated tabAnnotationCollect', tabAnnotationCollect);
        }
        else {
          tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
        }
      });
      // }
      // pageannotationsActive[pos].annotations = annotations;
      // pageannotationsActive[pos].annotations = pageannotationsActive[pos].annotations.sort((a, b) =>
      //   (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
      // );
      // pageannotationsActive[pos].annotations = removeDuplicates(pageannotationsActive[pos].annotations);
      // console.log('bout to broadcast in private sigh', annotationsToBroadcast);
      broadcastAnnotationsUpdated("CONTENT_UPDATED", annotationsToBroadcast);
      privateAnnotations = tempPrivateAnnotations;
      chrome.tabs.query({}, tabs => {
        tabs = tabs.filter(e => e.url === url)
        tabs.forEach(function (tab) {
          chrome.tabs.sendMessage(tab.id, {
            msg: 'REFRESH_HIGHLIGHTS',
            payload: annotationsToBroadcast,
          });
        });
        // console.log("these are changed tabs", tabs)
      });
    }))
  })
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
  // console.log('change tab', tabAnnotationCollect);
  if (containsObjectWithId(activeInfo.tabId, tabAnnotationCollect)) {
    const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === activeInfo.tabId);
    broadcastAnnotationsUpdated('CONTENT_UPDATED', tabInfo[0].annotations);
  }
  else {
    // publicListener = setUpGetAllAnnotationsByUrlListener(request.url, annotations);
    // privateListener = promiseToComeBack(request.url, annotations);
  }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_URL') {
    const cleanUrl = getPathFromUrl(sender.tab.url);
    sendResponse({ url: cleanUrl });
  }
  else if (request.msg === 'GET_ANNOTATIONS_PAGE_LOAD') {
    // var findActiveUrl = pageannotationsActive.filter(e => e.url === request.url)
    // if (findActiveUrl.length !== 0) {
    //   let annotationsToTransmit = findActiveUrl[0].annotations.filter(anno => {
    //     if (anno.private && anno.authorId === getCurrentUser().uid) {
    //       return true;
    //     }
    //     else if (!anno.private) {
    //       return true;
    //     }
    //     else {
    //       return false;
    //     }
    //   });
    //   annotationsToTransmit = annotationsToTransmit.sort((a, b) =>
    //     (a.createdTimestamp < b.createdTimestamp) ? 1 : -1
    //   );
    //   annotationsToTransmit = removeDuplicates(annotationsToTransmit);
    //   broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToTransmit, sender.tab.id);
    //   broadcastAnnotationsUpdatedTab("HIGHLIGHT_ANNOTATIONS", annotationsToTransmit, sender.tab.id);
    // }
    // else {
    // let snapshotSubscriptions = [];
    // let annotations = [];
    // console.log('requesting annotations for url', request.url);
    // console.log('gonna update all annotations');
    // updateAllAnnotations();
    publicListener = setUpGetAllAnnotationsByUrlListener(request.url, annotations);
    privateListener = promiseToComeBack(request.url, annotations);
    // setUpGetAllAnnotationsByUrlListener(request.url, annotations).then(function (e) {
    //   snapshotSubscriptions.push(e);
    //   promiseToComeBack(request.url, annotations)
    //     .then(function (f) {
    //       // console.log('at end of then', annotations);
    //       snapshotSubscriptions.push(f);
    //       // snapshotSubscriptions.forEach(sub => sub());
    //     });
    // })

    // }
  }
  else if (request.msg === 'UNSUBSCRIBE' && request.from === 'content') {
    privateListener();
    publicListener();
  }
  else if (request.msg === 'ANNOTATION_UPDATED' && request.from === 'content') {
    const { id, content, type, tags, isPrivate } = request.payload;
    updateAnnotationById(id, {
      content, type, tags, isPrivate,
      createdTimestamp: new Date().getTime(),
      deletedTimestamp: 0
    }).then(function () {
      // console.log('in annotation updated');
      if (containsObjectWithId(sender.tab.id, tabAnnotationCollect)) {
        const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === sender.tab.id);
        // console.log('tabInfo', tabInfo);
        let annotations = tabInfo[0].annotations;
        let anno = annotations.filter(anno => id === anno.id);
        let updatedAnno = anno[0];
        Object.assign(updatedAnno, { id, content, type, tags, isPrivate });
        let temp2 = annotations.filter(anno => anno.id !== id);
        temp2.push(updatedAnno);
        temp2 = removeDuplicates(temp2);
        broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
      }
      else {
        let temp = publicAnnotations.concat(privateAnnotations);
        let anno = temp.filter(anno => id === anno.id);
        let updatedAnno = anno[0];
        Object.assign(updatedAnno, { id, content, type, tags, isPrivate });
        let temp2 = temp.filter(anno => anno.id !== id);
        temp2.push(updatedAnno);
        temp2 = removeDuplicates(temp2);
        // console.log('updated thing', temp2, updatedAnno);
        broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
      }
    })
  }
  else if (request.msg === 'ANNOTATION_DELETED' && request.from === 'content') {
    deleteAnnotationForeverById(request.payload.id).then(function () {
      annotations = publicAnnotations.concat(privateAnnotations);
      annotations = annotations.filter(anno => anno.id !== request.payload.id);
      annotations = removeDuplicates(annotations);
      broadcastAnnotationsUpdated("CONTENT_UPDATED", annotations);
    });
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
      childAnchor: [],
      isPrivate: false
    });
  }
  else if (request.from === 'content' && request.msg === 'UNARCHIVE') {
    const { id } = request.payload;
    updateAnnotationById(id, {
      createdTimestamp: new Date().getTime(),
      trashed: false
    }).then(function () {
      let temp = publicAnnotations.concat(privateAnnotations);
      let anno = temp.filter(anno => id === anno.id);
      let updatedAnno = anno[0];
      updatedAnno.trashed = false;
      updatedAnno.createdTimestamp = new Date().getTime();
      let temp2 = temp.filter(anno => anno.id !== id);
      temp2.push(updatedAnno);
      temp2 = removeDuplicates(temp2);
      broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
    });
  }
  else if (request.from === 'content' && request.msg === 'FINISH_TODO') {
    const { id } = request.payload;
    updateAnnotationById(id, {
      createdTimestamp: new Date().getTime(),
      trashed: true
    }).then(function () {
      let temp = publicAnnotations.concat(privateAnnotations);
      let anno = temp.filter(anno => id === anno.id);
      let updatedAnno = anno[0];
      updatedAnno.trashed = true;
      updatedAnno.createdTimestamp = new Date().getTime();
      let temp2 = temp.filter(anno => anno.id !== id);
      temp2.push(updatedAnno);
      temp2 = removeDuplicates(temp2);
      broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
    });
  }
  else if (request.from === 'content' && request.msg === 'UPDATE_QUESTION') {
    const { id, isClosed, howClosed } = request.payload;
    updateAnnotationById(id, {
      isClosed,
      howClosed
    }).then(function () {
      let temp = publicAnnotations.concat(privateAnnotations);
      let anno = temp.filter(anno => id === anno.id);
      let updatedAnno = anno[0];
      updatedAnno.isClosed = isClosed;
      updatedAnno.howClosed = howClosed;
      let temp2 = temp.filter(anno => anno.id !== id);
      temp2.push(updatedAnno);
      temp2 = removeDuplicates(temp2);
      broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
    });
  }
  else if (request.msg === 'FILTER_BY_TAG' && request.from === 'content') {
    chrome.runtime.sendMessage({
      msg: 'FILTER_BY_TAG',
      from: 'background',
      payload: request.payload
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
      isClosed: false,
      pinned: false,
      AnnotationTags: content.tags,
      childAnchor: [],
      isPrivate: content.private
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
      hostname: hostname,
      AnnotationTags: [],
      childAnchor: [],
      isPrivate: false
    }).then(value => {
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
  } else if (request.msg === 'ADD_NEW_REPLY') {
    const { id, reply, replyTags, answer, question, replyId, xpath, anchor, hostname, url, offsets } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const replies = Object.assign({}, {
      replyId: replyId,
      replyContent: reply,
      author: author,
      authorId: getCurrentUserId(),
      timestamp: new Date().getTime(),
      answer: answer,
      question: question,
      tags: replyTags,
      xpath: xpath !== undefined ? xpath : null,
      anchor: anchor !== undefined ? anchor : "",
      hostname: hostname !== undefined ? hostname : "",
      url: url !== undefined ? url : "",
      offsets: offsets !== undefined ? offsets : null
    });
    console.log("BUGGED REPLY", replies)
    updateAnnotationById(id, {
      createdTimestamp: new Date().getTime(),
      replies: firebase.firestore.FieldValue.arrayUnion({
        ...replies
      })
    }).then(function () {
      let temp = publicAnnotations.concat(privateAnnotations);
      let anno = temp.filter(anno => id === anno.id);
      console.log(anno)
      let updatedAnno = anno[0];
      if (updatedAnno.replies !== undefined && updatedAnno.replies !== null && updatedAnno.replies.length) {
        updatedAnno.replies = updatedAnno.replies.concat(replies);
      } else {
        updatedAnno.replies = [replies];
      }
      let temp2 = temp.filter(anno => anno.id !== id);
      temp2.push(updatedAnno);
      temp2 = removeDuplicates(temp2);
      broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
    });
  }
  else if (request.msg === 'UPDATE_REPLIES') {
    updateAnnotationById(request.payload.id, {
      createdTimestamp: new Date().getTime(),
      replies: request.payload.replies
    }).then(function () {
      let temp = publicAnnotations.concat(privateAnnotations);
      let anno = temp.filter(anno => request.payload.id === anno.id);
      let updatedAnno = anno[0];
      if (updatedAnno.replies.length) {
        updatedAnno.replies = request.payload.replies;
      }
      let temp2 = temp.filter(anno => anno.id !== request.payload.id);
      temp2.push(updatedAnno);
      temp2 = removeDuplicates(temp2);
      broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
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
  else if (request.from === 'content' && request.msg === 'GET_PINNED_ANNOTATIONS') {
    let pinnedAnnotations = [];
    getAllPinnedAnnotationsByUserId(getCurrentUserId()).get().then(function (doc) {
      doc.docs.forEach(anno => {
        pinnedAnnotations.push({ id: anno.id, ...anno.data() });
      });
      getAllPrivatePinnedAnnotationsByUserId(getCurrentUserId()).get().then(function (doc) {
        doc.docs.forEach(anno => {
          pinnedAnnotations.push({ id: anno.id, ...anno.data() });
        });
        // annotations = annotations.filter(anno => anno.isClosed === false);
        sendResponse({ annotations: pinnedAnnotations });
      })
    });
  }
  else if (request.from === 'content' && request.msg === 'REQUEST_PIN_UPDATE') {
    const { id, pinned } = request.payload;
    updateAnnotationById(id, { pinned: pinned }).then(function () {
      let temp = publicAnnotations.concat(privateAnnotations);
      let anno = temp.filter(anno => id === anno.id);
      let updatedAnno = anno[0];
      updatedAnno.pinned = pinned;
      let temp2 = temp.filter(anno => anno.id !== id);
      temp2.push(updatedAnno);
      temp2 = removeDuplicates(temp2);
      broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
    });
  }
  else if (request.from === 'content' && request.msg === 'REQUEST_ADOPTED_UPDATE') {
    const { annoId, replyId, adoptedState } = request.payload;
    if (adoptedState) {
      updateAnnotationById(annoId, { adopted: replyId }).then(function () {
        let temp = publicAnnotations.concat(privateAnnotations);
        let anno = temp.filter(anno => annoId === anno.id);
        let updatedAnno = anno[0];
        updatedAnno.adopted = replyId;
        let temp2 = temp.filter(anno => anno.id !== annoId);
        temp2.push(updatedAnno);
        temp2 = removeDuplicates(temp2);
        broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
      });;
    } else {
      updateAnnotationById(annoId, { adopted: false }).then(function () {
        let temp = publicAnnotations.concat(privateAnnotations);
        let anno = temp.filter(anno => annoId === anno.id);
        let updatedAnno = anno[0];
        updatedAnno.adopted = false;
        let temp2 = temp.filter(anno => anno.id !== annoId);
        temp2.push(updatedAnno);
        temp2 = removeDuplicates(temp2);
        broadcastAnnotationsUpdated('CONTENT_UPDATED', temp2);
      });;
    }
  }
  else if (request.from === 'content' && request.msg === 'REQUEST_PAGINATED_ACROSS_SITE_ANNOTATIONS') {
    const { hostname, url } = request.payload;
    let cursor = undefined;
    if (hostname in annotationsAcrossWholeSite) {
      cursor = annotationsAcrossWholeSite[hostname].cursor;
    }
    else {
      annotationsAcrossWholeSite[hostname] = { cursor: undefined, annotations: [] };
      // console.log(annotationsAcrossWholeSite);
    }
    if (cursor === 'DONE') {
      sendResponse({ annotations: annotationsAcrossWholeSite[hostname].annotations, cursor: "DONE" });
      return;
    }
    if (cursor !== undefined) {
      // use startAfter 
      getAnnotationsAcrossSite(hostname).startAfter(annotationsAcrossWholeSite[hostname].cursor).get().then(function (doc) {
        // let currPage = pageannotationsActive.filter(page => page.url === url);
        // annotationsAcrossWholeSite[hostname].annotations.push(...currPage[0].annotations);
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
        getPrivateAnnotationsAcrossSite(hostname, getCurrentUserId()).get().then(function (doc2) {
          // let currPage = pageannotationsActive.filter(page => page.url === url);
          // annotationsAcrossWholeSite[hostname].annotations.push(...currPage[0].annotations);
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
          if (!doc2.empty) {
            doc2.docs.forEach(anno => {
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

      });
      // need to think about use case where user's current URL has the majority of annotations on it - pagination will result
      // in many duplicate annotations that need to be filtered out and then keep reading to find unique annotations?
      // it seems like we need to do the comparison locally which sucks ass fuck u firebase

    }
    // need to think about use case where user's current URL has the majority of annotations on it - pagination will result
    // in many duplicate annotations that need to be filtered out and then keep reading to find unique annotations?
    // it seems like we need to do the comparison locally 


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