import '../../assets/img/Adamite.png';
import '../../assets/img/icon-128.png';
import './helpers/authHelper';
import './helpers/sidebarHelper';
import './helpers/elasticSearchWrapper';
import { toggleSidebar } from './helpers/sidebarHelper';
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
  deleteGroupForeverByGid,
  getCurrentUserId,
  getAllGroupsByUserId,
  getPrivateAnnotationsAcrossSite,
  updateAllAnnotations, getAnnotationById,
  getGroupAnnotationsByGroupId,
  getUserByUserId,
  getAllUserGroups,
  addNewGroup
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
let publicPinnedAnnotations = [];
let privatePinnedAnnotations = [];
let pinnedAnnotations = [];
let pinnedPrivateListener;
let pinnedPublicListener;
let publicListener;
let privateListener;
let groupListener;
let clicked = false;

const broadcastAnnotationsUpdated = (message, annotations) => {
  chrome.runtime.sendMessage({
    msg: message,
    from: 'background',
    payload: annotations,
  });
};

const broadcastAnnotationsUpdatedTab = (message, annotations, tabId) => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        msg: message,
        from: 'background',
        payload: annotations,
        tabId: tabs[0].id
      }
    );
  });
};

const broadcastGroupsUpdated = (message, groups) => {
  chrome.runtime.sendMessage({
    msg: message,
    from: 'background',
    payload: groups,
  });
}

function setUpGetGroupListener(uid) {
  return new Promise((resolve, reject) => {
    resolve(getAllUserGroups(uid).onSnapshot(querySnapshot => {
      let groups = [];
      querySnapshot.forEach(snapshot => {
        groups.push({
          gid: snapshot.id,
          ...snapshot.data()
        });
      })
      broadcastGroupsUpdated("GROUPS_UPDATED", groups);
    }))
  })

}

function getAllPrivatePinnedAnnotationsListener() {
  return new Promise((resolve, reject) => {
    resolve(getAllPrivatePinnedAnnotationsByUserId(getCurrentUserId()).onSnapshot(querySnapshot2 => {
      let tempPrivatePinnedAnnotations = [];
      querySnapshot2.forEach(snapshot => {
        tempPrivatePinnedAnnotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      })
      pinnedAnnotations = tempPrivatePinnedAnnotations.concat(publicPinnedAnnotations);
      privatePinnedAnnotations = tempPrivatePinnedAnnotations;
      broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
    }))
  })
}

function getAllPublicPinnedAnnotationsListener() {
  return new Promise((resolve, reject) => {
    resolve(getAllPinnedAnnotationsByUserId(getCurrentUserId()).onSnapshot(querySnapshot2 => {
      let tempPublicPinnedAnnotations = [];
      querySnapshot2.forEach(snapshot => {
        tempPublicPinnedAnnotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      })
      pinnedAnnotations = tempPublicPinnedAnnotations.concat(privatePinnedAnnotations);
      publicPinnedAnnotations = tempPublicPinnedAnnotations;
      broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
    }))
  })
}


function setUpGetAllAnnotationsByUrlListener(url, annotations) {
  return new Promise((resolve, reject) => {
    resolve(getAllAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
      let tempPublicAnnotations = [];
      querySnapshot2.forEach(snapshot => {
        tempPublicAnnotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      })
      let annotationsToBroadcast = tempPublicAnnotations.concat(privateAnnotations);
      annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
          tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
        }
        else {
          tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
        }
      });
      broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToBroadcast);

      publicAnnotations = tempPublicAnnotations;

    }))
  })
}

function promiseToComeBack(url, annotations) {
  return new Promise((resolve, reject) => {

    resolve(getPrivateAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
      let tempPrivateAnnotations = [];
      querySnapshot2.forEach(snapshot => {
        tempPrivateAnnotations.push({
          id: snapshot.id,
          ...snapshot.data(),
        });
      });
      let annotationsToBroadcast = tempPrivateAnnotations.concat(publicAnnotations);
      annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
          tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
        }
        else {
          tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
        }
      });
      broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToBroadcast);
      privateAnnotations = tempPrivateAnnotations;
    }))
  })
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (containsObjectWithId(activeInfo.tabId, tabAnnotationCollect)) {
    const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === activeInfo.tabId);
    broadcastAnnotationsUpdatedTab('CONTENT_UPDATED', tabInfo[0].annotations);
  }
  else {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      publicListener = setUpGetAllAnnotationsByUrlListener(tab.url, annotations);
      privateListener = promiseToComeBack(tab.url, annotations);
    });
  }
});

chrome.browserAction.onClicked.addListener(function () {
  clicked = !clicked;
  toggleSidebar(clicked);
  if (clicked) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
        const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, {
          msg: 'HIGHLIGHT_ANNOTATIONS',
          payload: tabInfo[0].annotations
        })
      }
    })
  }
  else {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {
        msg: 'REMOVE_HIGHLIGHTS'
      })
    })
  }
});

const showModal = () => {
  const modal = document.createElement("dialog");
  modal.setAttribute("style", `height:450px;border: none;top:150px;border-radius:20px;background-color:white;position: fixed; box-shadow: 0px 12px 48px rgba(29, 5, 64, 0.32);`);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'REQUEST_TAB_INFO') {
    const cleanUrl = getPathFromUrl(sender.tab.url);
    const tabId = sender.tab.id;
    sendResponse({ url: cleanUrl, tabId });
  }
  else if (request.msg === 'GET_ANNOTATIONS_PAGE_LOAD') {
    console.log("GET_ANNOTATIONS_PAGE_LOAD");

    let email = getCurrentUser().email;
    let userName = email.substring(0, getCurrentUser().email.indexOf('@'));

    chrome.tabs.sendMessage(
      request.tabId,
      {
        msg: 'CREATE_GROUP',
        from: 'background',
        owner: {
          uid: request.uid,
          email: email,
          userName: userName
        }
      }
    );

    publicListener = setUpGetAllAnnotationsByUrlListener(request.url, annotations);
    privateListener = promiseToComeBack(request.url, annotations);
    chrome.browserAction.setBadgeText({ text: String(annotations.length) });
  }
  else if (request.msg === 'SET_UP_PIN' && request.from === 'content') {
    // console.log('in pin listener');
    pinnedPrivateListener = getAllPrivatePinnedAnnotationsListener();
    pinnedPublicListener = getAllPublicPinnedAnnotationsListener();
  }
  else if (request.msg === 'ADD_NEW_GROUP' && request.from === 'content') {
    // console.log("this is the request for a new group", request);
    addNewGroup({
      name: request.group.name,
      description: request.group.description,
      owner: request.group.owner,
      emails: request.group.emails
    }).then(value => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(
          tabId,
          {
            msg: 'GROUP_CREATE_SUCCESS',
            from: 'background',
          }
        );
      });

    })
  }
  else if (request.msg === "DELETE_GROUP" && request.from === 'modal') {
    console.log("this is the request for a delete group", request.gid);
    const { gid } = request;
    deleteGroupForeverByGid(gid).then(value => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(
          tabId,
          {
            msg: 'GROUP_DELETE_SUCCESS',
            from: 'background',
          }
        );
      });
    });
  }
  else if (request.msg === 'UPDATE_READ_COUNT' && request.from === 'content') {
    const { id, readCount } = request.payload;
    const eventTime = new Date().getTime();
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: request.msg
    })
    updateAnnotationById(id, {
      readCount: readCount + 1,
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      })
    }).then(function () {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    });
  }
  // maybe switch to passing in tabId here instead of querying
  else if (request.msg === 'SHOW_GROUP' && request.from === 'content') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true },
      (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            msg: 'SHOW_GROUP',
            from: 'background',
          }
        );
      });
  }
  else if (request.msg === 'HIDE_GROUP' && request.from === 'modal') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true },
      (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            msg: 'HIDE_GROUP',
            from: 'background',
          }
        );
      });
  }
  else if (request.msg === 'UNSUBSCRIBE' && request.from === 'content') {
    if (typeof privateListener === "function") {
      privateListener();
    }
    if (typeof publicListener === "function") {
      publicListener();
    }
    if (typeof pinnedPrivateListener === "function") {
      pinnedPrivateListener();
    }
    if (typeof pinnedPublicListener === "function") {
      pinnedPublicListener();
    }
  }
  else if (request.msg === 'ANNOTATION_UPDATED' && request.from === 'content') {
    const { id, content, type, tags, isPrivate, groups } = request.payload;
    const eventTime = new Date().getTime();
    getAnnotationById(id).get().then(function (doc) {
      const anno = doc.data();
      const editEvent = Object.assign({}, {
        timestamp: eventTime,
        user: anno.author,
        event: request.msg,
        oldContent: anno.content,
        oldType: anno.type,
        oldTags: anno.tags,
        oldGroups: anno.groups,
        oldPrivate: anno.private
      })
      // these nested thens are bad lmao consider changing cardWrapper/Annotation.jsx to just
      // send the old content in the runtime message - even better to actually tease apart which
      // part of the anno has been updated
      updateAnnotationById(id, {
        content, type, tags, private: isPrivate, groups,
        createdTimestamp: new Date().getTime(),
        deletedTimestamp: 0,
        events: firebase.firestore.FieldValue.arrayUnion({
          ...editEvent
        }),
      }).then(function () {
        broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
      })
    });

  }
  else if (request.msg === 'ANNOTATION_DELETED' && request.from === 'content') {
    const { id } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const eventTime = new Date().getTime();
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: request.msg
    })
    updateAnnotationById(id, {
      deletedTimestamp: new Date().getTime(),
      deleted: true,
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      }),
    }).then(function () {
      broadcastAnnotationsUpdated("ELASTIC_CONTENT_DELETED", id);
    });
  }
  else if (request.msg === 'SAVE_HIGHLIGHT') {
    let { url, anchor, xpath, offsets } = request.payload;
    const hostname = new URL(url).hostname;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    createAnnotation({
      taskId: null,
      SharedId: null,
      AnnotationContent: "",
      AnnotationAnchorContent: anchor,
      AnnotationAnchorPath: null,
      offsets: offsets,
      xpath: xpath,
      AnnotationType: "highlight",
      url,
      hostname,
      pinned: false,
      AnnotationTags: [],
      childAnchor: [],
      isPrivate: true,
      author,
      groups: [], // later have this be a default group
      readCount: 0,
      deleted: false,
      events: []
    });
  }
  else if (request.from === 'content' && request.msg === 'UNARCHIVE') {
    const { id } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const eventTime = new Date().getTime();
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: request.msg
    })
    updateAnnotationById(id, {
      createdTimestamp: new Date().getTime(),
      trashed: false,
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      })
    }).then(function () {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    });
  }
  else if (request.from === 'content' && request.msg === 'FINISH_TODO') {
    const { id } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const eventTime = new Date().getTime();
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: request.msg
    })
    updateAnnotationById(id, {
      createdTimestamp: new Date().getTime(),
      trashed: true,
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      })
    }).then(function () {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    });
  }
  else if (request.from === 'content' && request.msg === 'UPDATE_QUESTION') {
    const { id, isClosed, howClosed } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const eventTime = new Date().getTime();
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: request.msg
    })
    updateAnnotationById(id, {
      isClosed,
      howClosed,
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      })
    }).then(function () {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
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
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));

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
      isPrivate: content.private,
      author,
      groups: content.groups,
      readCount: 0,
      deleted: false,
      events: []
    }).then(value => {
      sendResponse({
        msg: 'DONE',
        value: value.id
      });
    });
  } else if (request.from === 'content' && request.msg === 'SAVE_NEW_ANCHOR') {
    let { newAnno, xpath, url, anchor, offsets, hostname } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const eventTime = new Date().getTime();
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: request.msg
    });

    const newAnchor = Object.assign({}, {
      parentId: newAnno.sharedId, id: eventTime, anchor, url, offsets, hostname, xpath
    })

    updateAnnotationById(newAnno.sharedId, {
      childAnchor: firebase.firestore.FieldValue.arrayUnion({
        ...newAnchor
      }),
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      })
    }).then(value => {
      let highlightObj = {
        id: newAnno.sharedId + "-" + eventTime,
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
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', newAnno.sharedId);
    });

  } else if (request.msg === 'ADD_NEW_REPLY') {
    const { id, reply, replyTags, answer, question, replyId, xpath, anchor, hostname, url, offsets, adopted } = request.payload;
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const eventTime = new Date().getTime();
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: request.msg
    })
    const replies = Object.assign({}, {
      replyId: replyId,
      replyContent: reply,
      author: author,
      authorId: getCurrentUserId(),
      timestamp: eventTime,
      answer: answer,
      question: question,
      tags: replyTags,
      xpath: xpath !== undefined ? xpath : null,
      anchor: anchor !== undefined ? anchor : "",
      hostname: hostname !== undefined ? hostname : "",
      url: url !== undefined ? url : "",
      offsets: offsets !== undefined ? offsets : null,
      adopted: adopted !== undefined ? adopted : false
    });
    updateAnnotationById(id, {
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      }),
      replies: firebase.firestore.FieldValue.arrayUnion({
        ...replies
      })
    }).then(function (e) {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
      sendResponse({ msg: 'DONE' });
    });
  }
  else if (request.msg === 'UPDATE_REPLIES') {
    const eventTime = new Date().getTime();
    const user = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: user,
      event: request.msg
    });
    updateAnnotationById(request.payload.id, {
      events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      }),
      replies: request.payload.replies
    }).then(function () {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', request.payload.id);
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
    sendResponse({ annotations: pinnedAnnotations });
  }
  else if (request.from === 'content' && request.msg === 'GET_GROUPS_PAGE_LOAD') {
    groupListener = setUpGetGroupListener(request.uid);
  }
  else if (request.from === 'content' && request.msg === 'GET_GROUP_ANNOTATIONS') {
    let GroupAnnotations = [];
    getGroupAnnotationsByGroupId(getCurrentUserId()).get().then(function (doc) {
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
    const eventTime = new Date().getTime();
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: "PIN_UPDATE",
      is_pinned: pinned ? "TRUE" : "FALSE"
    })
    updateAnnotationById(id, {
      pinned: pinned, events: firebase.firestore.FieldValue.arrayUnion({
        ...editEvent
      })
    }).then(function () {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    });
  }
  else if (request.from === 'content' && request.msg === 'REQUEST_ADOPTED_UPDATE') {
    const { annoId, replyId, adoptedState } = request.payload;
    const eventTime = new Date().getTime();
    const author = getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));
    const editEvent = Object.assign({}, {
      timestamp: eventTime,
      user: author,
      event: "ANSWER_ADOPTED_UPDATE",
      is_question_answered: adoptedState ? "TRUE" : "FALSE"
    })
    if (adoptedState) {
      updateAnnotationById(annoId, {
        adopted: replyId, events: firebase.firestore.FieldValue.arrayUnion({
          ...editEvent
        })
      }).then(function () {
        broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', annoId);
      });
    } else {
      updateAnnotationById(annoId, {
        adopted: false, events: firebase.firestore.FieldValue.arrayUnion({
          ...editEvent
        })
      }).then(function () {
        broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', annoId);
      });
    }
  }
  else if (request.from === 'content' && request.msg === 'GET_ANNOTATION_BY_ID') {
    const { id } = request.payload;
    getAnnotationById(id).get().then(function (doc) {
      sendResponse({ annotation: { id: id, ...doc.data() } });
    }).catch(function (error) {
      console.log('getAnnotationById error', error);
    });

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