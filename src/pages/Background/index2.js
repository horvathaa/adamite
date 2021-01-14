

// import '../../assets/img/Adamite.png';
// import '../../assets/img/icon-128.png';
// import './helpers/authHelper';
// import './helpers/sidebarHelper';
// import './helpers/elasticSearchWrapper';
// import { toggleSidebar } from './helpers/sidebarHelper';
// import { clean } from './helpers/objectCleaner';
// import {
//     getAllAnnotationsByUrl,
//     getPrivateAnnotationsByUrl,
//     createAnnotation,
//     updateAnnotationById,
//     getAnnotationsByTag,
//     getCurrentUser,
//     getAllPinnedAnnotationsByUserId,
//     getAllPrivatePinnedAnnotationsByUserId,
//     deleteGroupForeverByGid,
//     getCurrentUserId,
//     getAnnotationById,
//     getGroupAnnotationsByGroupId,
//     getUserByUserId,
//     getAllUserGroups,
//     addNewGroup
// } from '../../firebase/index';
// import firebase from '../../firebase/firebase';

// let unsubscribeAnnotations = null;
// let tabAnnotationCollect = [];
// let annotationsAcrossWholeSite = [];
// let annotations = [];
// let publicAnnotations = [];
// let privateAnnotations = [];
// let publicPinnedAnnotations = [];
// let privatePinnedAnnotations = [];
// let pinnedAnnotations = [];
// let pinnedPrivateListener;
// let pinnedPublicListener;
// let publicListener;
// let privateListener;
// let groupListener;
// let clicked = false;
// /*
// broadcastGroupsUpdated("GROUPS_UPDATED", groups);
// broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
// broadcastAnnotationsUpdated("CONTENT_UPDATED", annotationsToBroadcast);
// broadcastAnnotationsUpdated('CONTENT_UPDATED', tabInfo[0].annotations);
// broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id)
// broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id)
// */



// // let messagesIn = {
// //     'REQUEST_TAB_INFO':()=>{

// //     },
// //     'GET_ANNOTATIONS_PAGE_LOAD':()=>{

// //     },
// //     'SET_UP_PIN':()=>{},
// //     'ADD_NEW_GROUP':()=>{},
// //     "DELETE_GROUP":()=>{},
// //     'UPDATE_READ_COUNT':()=>{},
// //     'SHOW_GROUP':()=>{},
// //     'HIDE_GROUP':()=>{},
// //     'UNSUBSCRIBE':()=>{},
// //     'ANNOTATION_UPDATED':()=>{

// //     },
// //     'ANNOTATION_UPDATED':()=>{},
// // }



// let commands = {
//     //     //sidebarHelper
//     //     'REQUEST_SIDEBAR_STATUS': () => { },
//     //     'REQUEST_TOGGLE_SIDEBAR': () => { },
//     //     'USER_CHANGE_SIDEBAR_LOCATION': () => { },
//     //     'USER_CHANGE_SIDEBAR_SHOULD_SHRINK_BODY': () => { },

//     //     // elasticSearchWrapper

//     //     'SEARCH_ELASTIC':()=>{},
//     //     'GROUP_ELASTIC':()=>{},
//     //     'SCROLL_ELASTIC':()=>{},
//     //     "SEARCH_ELASTIC_BY_ID":()=>{},
//     //     "REFRESH_FOR_CONTENT_UPDATED":()=>{},
//     //     'REMOVE_PAGINATION_SEARCH_CACHE': () => { },


//     //     //authHelper
//     //     'GET_CURRENT_USER':()=>{},
//     //     'USER_SIGNUP':()=>{},
//     //     'USER_SIGNIN':()=>{},
//     //     'USER_SIGNOUT':()=>{},
//     //     'USER_FORGET_PWD':()=>{},

//     /////////////////////
//     ///  SIDEBAR.jsx  ///
//     /////////////////////
//     'SEARCH_BY_TAG': async (request, sender, sendResponse) => {
//         const { tag } = request.payload;
//         if (!isContent(request) || tag === "") return;
//         let annotationsWithTag = [];
//         getAnnotationsByTag(tag).get().then(function (doc) {
//             if (!doc.empty)
//                 doc.docs.forEach(anno => { annotationsWithTag.push({ id: anno.id, ...anno.data() }); });
//             sendResponse({ annotations: annotationsWithTag });
//         }).catch(function (error) { console.log('could not get doc: ', error); })
//     },
//     'REQUEST_PIN_UPDATE': async (request, sender, sendResponse) => {
//         const { id, pinned } = request.payload;
//         await updateAnnotationById(id, {
//             pinned: pinned, events: fbUnion(editEvent("PIN_UPDATE", { is_pinned: pinned ? "TRUE" : "FALSE" }))
//         })
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
//     },
//     'GET_PINNED_ANNOTATIONS': (request, sender, sendResponse) =>
//         (isContent(request)) ? sendResponse({ annotations: pinnedAnnotations }) : false,

//     'REQUEST_TAB_INFO': (request, sender, sendResponse) => {
//         const cleanUrl = getPathFromUrl(sender.tab.url);
//         const tabId = sender.tab.id;
//         sendResponse({ url: cleanUrl, tabId });
//     },
//     'UNSUBSCRIBE': (request, sender, sendResponse) => {
//         if (typeof privateListener === "function") privateListener();
//         if (typeof publicListener === "function") publicListener();
//         if (typeof pinnedPrivateListener === "function") pinnedPrivateListener();
//         if (typeof pinnedPublicListener === "function") pinnedPublicListener();
//     },
//     'SET_UP_PIN': (request, sender, sendResponse) => {
//         if (!isContent(request)) return;
//         pinnedPrivateListener = getAllPrivatePinnedAnnotationsListener();
//         pinnedPublicListener = getAllPublicPinnedAnnotationsListener();
//     },
//     'GET_ANNOTATIONS_PAGE_LOAD': (request, sender, sendResponse) => {
//         sendMsg('CREATE_GROUP', request.tabId)
//         publicListener = setUpGetAllAnnotationsByUrlListener(request.url, annotations);
//         privateListener = promiseToComeBack(request.url, annotations);
//         chrome.browserAction.setBadgeText({ text: String(annotations.length) });
//     },

//     ///////////////////////////
//     /// Anchor.jsx ///
//     ///////////////////////////
//     'LOAD_EXTERNAL_ANCHOR': (request, sender, sendResponse) => chrome.tabs.create({ url: request.payload }),

//     /////////////////////////////////////
//     /// Reply.jsx &&  ReplyEditor.jsx ///
//     /////////////////////////////////////
//     'UPDATE_REPLIES': async (request, sender, sendResponse) => {
//         await updateAnnotationById(request.payload.id, {
//             events: fbUnion(editEvent(request.msg)),
//             replies: request.payload.replies
//         })
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', request.payload.id);
//     },
//     /////////////////////////////////////
//     /// Reply.jsx &&  Annotation.jsx ///
//     /////////////////////////////////////
//     'REQUEST_ADOPTED_UPDATE': async (request, sender, sendResponse) => {
//         const { annoId, replyId, adoptedState } = request.payload;
//         await updateAnnotationById(annoId, {
//             adopted: adoptedState ? replyId : false,
//             events: fbUnion(
//                 editEvent("ANSWER_ADOPTED_UPDATE", { is_question_answered: adoptedState ? "TRUE" : "FALSE" })
//             )
//         });
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', annoId);
//     },
//     //////////////////////////////////////////////////
//     /// Reply.jsx &&  QuestionAnswerAnnotation.jsx ///
//     /////////////////////////////////////////////////
//     'UPDATE_QUESTION': async (request, sender, sendResponse) => {
//         const { id, isClosed, howClosed } = request.payload;
//         await updateAnnotationById(id, {
//             isClosed,
//             howClosed,
//             events: fbUnion(editEvent(request.msg))
//         })
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
//     },

//     /////////////////////////////////////
//     /// Reply.jsx                     ///
//     /////////////////////////////////////
//     'ADD_NEW_REPLY': async (request, sender, sendResponse) => {
//         const { id, } = request.payload;
//         await updateAnnotationById(id, {
//             events: fbUnion(editEvent(request.msg)),
//             replies: fbUnion(_createReply(request))
//         });
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
//         sendResponse({ msg: 'DONE' });
//     },

//     /////////////////////////////////////
//     ///  Annotation.jsx               ///
//     /////////////////////////////////////
//     'ANNOTATION_UPDATED': async (request, sender, sendResponse) => {
//         const { id, content, type, tags, isPrivate, groups } = request.payload;
//         let doc = await getAnnotationById(id).get();
//         await updateAnnotationById(id, {
//             content, type, tags, private: isPrivate, groups,
//             createdTimestamp: new Date().getTime(),
//             deletedTimestamp: 0,
//             events: fbUnion(editEvent(request.msg, doc.data())),
//         })
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
//         console.log("TODO", request.message);

//     },

//     'ANNOTATION_DELETED': async (request, sender, sendResponse) => {
//         const { id } = request.payload;
//         await updateAnnotationById(id, {
//             deletedTimestamp: new Date().getTime(),
//             deleted: true,
//             events: fbUnion(editEvent(request.msg))
//         });
//         broadcastAnnotationsUpdated("ELASTIC_CONTENT_DELETED", id);
//         console.log("TODO", request.message);
//     },
//     'FINISH_TODO': async (request, sender, sendResponse) => {
//         const { id } = request.payload;
//         await updateAnnotationById(id, {
//             createdTimestamp: new Date().getTime(),
//             trashed: true,
//             events: fbUnion(editEvent(request.msg))
//         })
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);

//     },
//     'UNARCHIVE': async (request, sender, sendResponse) => {
//         const { id } = request.payload;
//         await updateAnnotationById(id, {
//             createdTimestamp: new Date().getTime(),
//             trashed: false,
//             events: fbUnion(editEvent(request.msg))
//         });
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
//     },
//     'UPDATE_READ_COUNT': async (request, sender, sendResponse) => {
//         const { id, readCount } = request.payload;
//         await updateAnnotationById(id, {
//             readCount: readCount + 1,
//             events: fbUnion(editEvent(request.msg))
//         })
//         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
//     },
//     /////////////////////////////
//     /// NewAnnotation.jsx      ///
//     /////////////////////////////
//     'SAVE_ANNOTATED_TEXT': (request, sender, sendResponse) => {
//         createAnnotation(_createAnnotation(request)).then(value => {
//             console.log("background", value);
//             sendResponse({ msg: 'DONE', value: value.id });
//         });
//     },

//     /////////////////////////////////////
//     ///  CustomTag.jsx               ///
//     /////////////////////////////////////
//     'FILTER_BY_TAG': (request, sender, sendResponse) =>
//         isContent(request)
//             ? sendMsg('FILTER_BY_TAG', null, false, request.payload)
//             : false,

//     ///////////////////////////
//     /// GroupModal.jsx      ///
//     ///////////////////////////
//     'HIDE_GROUP': (request, sender, sendResponse) => {
//         console.log('HIDE_GROUP', request)
//         return isModal(request) ? sendMsg('HIDE_GROUP', null, true) : false;
//     },
//     "DELETE_GROUP": (request, sender, sendResponse) => {
//         if (!isModal(request)) return;
//         console.log("this is the request for a delete group", request.gid);
//         const { gid } = request;
//         deleteGroupForeverByGid(gid).then(value => sendMsg('GROUP_DELETE_SUCCESS', null, true));
//     },
//     'ADD_NEW_GROUP': (request, sender, sendResponse) => {
//         if (!isContent(request)) return;
//         addNewGroup({
//             name: request.group.name,
//             description: request.group.description,
//             owner: request.group.owner,
//             emails: request.group.emails
//         }).then(value => sendMsg('GROUP_CREATE_SUCCESS', null, true))
//     },


//     /////////////////////////////////////////////////
//     /// MultiSelect.jsx && FilterSummary.jsx    ///
//     ///////////////////////////////////////////////
//     'SHOW_GROUP': (request, sender, sendResponse) => isContent(request) ? sendMsg('SHOW_GROUP', null, true) : false,


//     ///////////////////////////
//     /// AnchorCreated.js    ///
//     ///////////////////////////
//     'SAVE_HIGHLIGHT': (request, sender, sendResponse) => {
//         console.log("TODO", request.message);
//     },
//     'CONTENT_SELECTED': (request, sender, sendResponse) =>
//         isContent(request) ? sendMsg('CONTENT_SELECTED', sender.tab.id, false, request.payload) : false,


//     ///////////////////////////
//     /// AnchorDestroy.js    ///
//     ///////////////////////////
//     'UPDATE_XPATH_BY_IDS': (request, sender, sendResponse) => {
//         request.payload.toUpdate.forEach(e =>
//             updateAnnotationById(
//                 e.id, clean({
//                     "xpath.start": e.xpath.start,
//                     "xpath.startOffset": e.xpath.startOffset,
//                     "xpath.end": e.xpath.end,
//                     "xpath.endOffset": e.xpath.endOffset,
//                 }),
//             )
//         );
//     },

//     'CONTENT_NOT_SELECTED': (request, sender, sendResponse) =>
//         isContent(request) ? sendMsg('CONTENT_NOT_SELECTED', sender.tab.id, false, request.payload) : false,
//     'GET_ANNOTATION_BY_ID': (request, sender, sendResponse) => {
//         if (!isContent(request)) return;
//         const { id } = request.payload;
//         getAnnotationById(id).get().then(function (doc) {
//             sendResponse({ annotation: { id: id, ...doc.data() } });
//         }).catch(function (error) { console.log(request.message, "error", error); });
//     },
//     'GET_GROUPS_PAGE_LOAD': (request, sender, sendResponse) => {
//         if (isContent(request)) groupListener = setUpGetGroupListener(request.uid);
//     },
//     'GET_GROUP_ANNOTATIONS': (request, sender, sendResponse) => {
//         let GroupAnnotations = [];
//         getGroupAnnotationsByGroupId(getCurrentUserId()).get().then(function (doc) {
//             doc.docs.forEach(anno => { pinnedAnnotations.push({ id: anno.id, ...anno.data() }); });
//             getAllPrivatePinnedAnnotationsByUserId(getCurrentUserId()).get().then(function (doc) {
//                 doc.docs.forEach(anno => { pinnedAnnotations.push({ id: anno.id, ...anno.data() }); });
//                 sendResponse({ annotations: pinnedAnnotations });
//             })
//         });
//     },
// };





// const fbUnion = (content) => firebase.firestore.FieldValue.arrayUnion({ ...content });
// const safeSet = (val, alt = null) => val !== undefined ? val : alt;
// const getAuthor = () => getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));

// const sendMsg = (msg = "", tabId = null, getActiveTab = false, payload = null) => {
//     const email = getCurrentUser().email;
//     const uid = getCurrentUser().uid;
//     const userName = email.substring(0, email.indexOf('@'));
//     const _content = {
//         msg: msg,
//         from: 'background',
//         owner: { uid: uid, email: email, userName: userName },
//         payload: payload
//     }

//     if (tabId) chrome.tabs.sendMessage(tabId, _content);
//     else if (getActiveTab) {
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             chrome.tabs.sendMessage(tabs[0].id, _content);
//         });
//     }
//     else chrome.runtime.sendMessage(_content);
// }
// const broadcastAnnotationsUpdated = (message, annotations) => {
//     sendMsg(message, null, null, annotations)
// };


// const editEvent = (msg, data = {}, author = null, eventTime = null,) => {
//     if (!author) author = getAuthor();
//     if (!eventTime) eventTime = new Date().getTime();
//     let content = {
//         timestamp: eventTime,
//         user: author,
//         event: msg,
//     };
//     if (msg === "ANNOTATION_UPDATED") {
//         content = {
//             ...content,
//             oldContent: data.content,
//             oldType: data.type,
//             oldTags: data.tags,
//             oldGroups: data.groups,
//             oldPrivate: data.private
//         }
//     } else if (data !== {}) {
//         content = {
//             ...content,
//             ...data
//         }
//     }
//     return Object.assign({}, content);
// }

// const _createReply = (request) => {
//     const eventTime = new Date().getTime();
//     const author = getAuthor();
//     const { id, reply, replyTags, answer, question, replyId, xpath, anchor, hostname, url, offsets, adopted } = request.payload;
//     return Object.assign({}, {
//         replyId: replyId,
//         replyContent: reply,
//         author: author,
//         authorId: getCurrentUserId(),
//         timestamp: eventTime,
//         answer: answer,
//         question: question,
//         tags: replyTags,
//         xpath: safeSet(xpath, null),
//         anchor: safeSet(anchor, null),
//         hostname: safeSet(hostname, null),
//         url: safeSet(url, null),
//         offsets: safeSet(offsets, null),
//         adopted: safeSet(adopted, null)
//     });
// }

// const _createAnnotation = (request) => {
//     let { url, content } = request.payload;
//     console.log("background", url, content);
//     const hostname = new URL(url).hostname;
//     // username is just front of email
//     const author = getAuthor();
//     return {
//         taskId: null,
//         SharedId: null,
//         AnnotationContent: content.annotation,
//         AnnotationAnchorContent: content.anchor,
//         AnnotationAnchorPath: null,
//         offsets: content.offsets,
//         xpath: content.xpath,
//         AnnotationType: content.annotationType, // could be other types (string)
//         url,
//         hostname,
//         isClosed: false,
//         pinned: false,
//         AnnotationTags: content.tags,
//         childAnchor: [],
//         isPrivate: content.private,
//         author,
//         groups: content.groups,
//         readCount: 0,
//         deleted: false,
//         events: []
//     };
// }




// /*
// This listens for events and if the command is in the command map,
//  it runs the commad
// */

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     console.log(request);
//     if (request.msg in commands) {
//         commands[request.msg](request, sender, sendResponse);
//     }

//     else
//         console.log("Unknown Command", request.message);
// });








// function updateList(list, id, annotations) {
//     let obj = list.filter(obj => id === obj.tabId);
//     let objToUpdate = obj[0];
//     objToUpdate.annotations = annotations;
//     let temp2 = list.filter(obj => obj.tabId !== id);
//     temp2.push(objToUpdate);
//     // temp2 = removeDuplicates(temp2);
//     return temp2;
// }

// // helper method from
// // https://stackoverflow.com/questions/2540969/remove-querystring-from-url
// function getPathFromUrl(url) { return url.split(/[?#]/)[0]; }

// function containsObjectWithId(id, list) {
//     const test = list.filter(obj => obj.tabId === id);
//     return test.length !== 0;
// }
// // helper method from
// // https://stackoverflow.com/questions/18773778/create-array-of-unique-objects-by-property
// function removeDuplicates(annotationArray) {
//     const flags = new Set();
//     const annotations = annotationArray.filter(anno => {
//         if (flags.has(anno.id)) { return false; }
//         flags.add(anno.id);
//         return true;
//     });
//     return annotations;
// }



// const isContent = (res) => res.from === 'content';
// const isModal = (res) => res.from === 'modal';


// const broadcastUpdated = (message, annotations = null, groups = null, tabId = null) => {
//     let payload = annotations ? annotations : groups;
//     let chromeMsg = {
//         msg: message,
//         from: 'background',
//         payload: payload,
//     };
//     if (tabId)
//         chrome.tabs.query({ active: true }, tabs => {
//             chrome.tabs.sendMessage(tabId, chromeMsg);
//         });
//     else chrome.runtime.sendMessage(chromeMsg);
// };



// const broadcastAnnotationsUpdatedTab = (message, annotations, tabId) =>
//     broadcastUpdated(message, annotations, null, tabId);
// const broadcastGroupsUpdated = (message, groups) =>
//     broadcastUpdated(message, null, groups, null);

// function setUpGetGroupListener(uid) {
//     // console.log('in setupgrouplistener', uid);
//     return new Promise((resolve, reject) => {
//         resolve(getAllUserGroups(uid).onSnapshot(querySnapshot => {
//             let groups = [];
//             querySnapshot.forEach(snapshot => {
//                 groups.push({
//                     gid: snapshot.id,
//                     ...snapshot.data()
//                 });
//             })
//             // console.log('groups in back', groups);
//             broadcastGroupsUpdated("GROUPS_UPDATED", groups);
//         }))
//     })
// }

// function getAllPrivatePinnedAnnotationsListener() {
//     return new Promise((resolve, reject) => {
//         resolve(getAllPrivatePinnedAnnotationsByUserId(getCurrentUserId()).onSnapshot(querySnapshot2 => {
//             let tempPrivatePinnedAnnotations = [];
//             querySnapshot2.forEach(snapshot => {
//                 tempPrivatePinnedAnnotations.push({
//                     id: snapshot.id,
//                     ...snapshot.data(),
//                 });
//             })
//             // console.log("temp", tempPublicAnnotations);
//             pinnedAnnotations = tempPrivatePinnedAnnotations.concat(publicPinnedAnnotations);
//             privatePinnedAnnotations = tempPrivatePinnedAnnotations;

//             broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);

//         }))
//     })
// }

// function getAllPublicPinnedAnnotationsListener() {
//     return new Promise((resolve, reject) => {
//         resolve(getAllPinnedAnnotationsByUserId(getCurrentUserId()).onSnapshot(querySnapshot2 => {
//             let tempPublicPinnedAnnotations = [];
//             querySnapshot2.forEach(snapshot => {
//                 tempPublicPinnedAnnotations.push({
//                     id: snapshot.id,
//                     ...snapshot.data(),
//                 });
//             })
//             pinnedAnnotations = tempPublicPinnedAnnotations.concat(privatePinnedAnnotations);
//             publicPinnedAnnotations = tempPublicPinnedAnnotations;
//             // chrome.tabs.query({ active: true }, tabs => {
//             //   if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
//             //     tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
//             //   }
//             //   else {
//             //     tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
//             //   }
//             // });
//             broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
//             // publicAnnotations = tempPublicAnnotations;
//             // chrome.tabs.query({}, tabs => {
//             //   tabs = tabs.filter(e => getPathFromUrl(e.url) === url)
//             //   tabs.forEach(function (tab) {
//             //     chrome.tabs.sendMessage(tab.id, {
//             //       msg: 'REFRESH_HIGHLIGHTS',
//             //       payload: annotationsToBroadcast,
//             //     });
//             //   });
//             // });
//         }))
//     })
// }

// // Sets a listener in
// function setUpGetAllAnnotationsByUrlListener(url, annotations) {
//     return new Promise((resolve, reject) => {
//         resolve(getAllAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
//             let tempPublicAnnotations = [];
//             querySnapshot2.forEach(snapshot => {
//                 tempPublicAnnotations.push({
//                     id: snapshot.id,
//                     ...snapshot.data(),
//                 });
//             })

//             // console.log("temp", tempPublicAnnotations);
//             let annotationsToBroadcast = tempPublicAnnotations.concat(privateAnnotations);
//             annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);
//             chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//                 if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
//                     tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
//                 }
//                 else {
//                     tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
//                 }
//             });
//             // consider switching this to be in a chrome.tabs.query - check active URL
//             broadcastAnnotationsUpdated("CONTENT_UPDATED", annotationsToBroadcast);
//             const numChildAnchs = annotationsToBroadcast.filter(anno => anno.SharedId !== null);
//             chrome.browserAction.setBadgeText({ text: String(annotationsToBroadcast.length - numChildAnchs.length) });
//             publicAnnotations = tempPublicAnnotations;
//             chrome.tabs.query({}, tabs => {
//                 tabs = tabs.filter(e => getPathFromUrl(e.url) === url)
//                 tabs.forEach(function (tab) {
//                     chrome.tabs.sendMessage(tab.id, {
//                         msg: 'REFRESH_HIGHLIGHTS',
//                         payload: annotationsToBroadcast,
//                     });
//                 });
//             });
//         }))
//     })
// }

// function promiseToComeBack(url, annotations) {
//     return new Promise((resolve, reject) => {

//         resolve(getPrivateAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
//             let tempPrivateAnnotations = [];
//             querySnapshot2.forEach(snapshot => {
//                 tempPrivateAnnotations.push({
//                     id: snapshot.id,
//                     ...snapshot.data(),
//                 });
//             });
//             let annotationsToBroadcast = tempPrivateAnnotations.concat(publicAnnotations);
//             annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);
//             chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//                 if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
//                     tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
//                 }
//                 else {
//                     tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
//                 }
//             });
//             // console.log("annotations", annotationsToBroadcast)
//             broadcastAnnotationsUpdated("CONTENT_UPDATED", annotationsToBroadcast);
//             const numChildAnchs = annotationsToBroadcast.filter(anno => anno.SharedId !== null);
//             chrome.browserAction.setBadgeText({ text: String(annotationsToBroadcast.length - numChildAnchs.length) });
//             privateAnnotations = tempPrivateAnnotations;
//             chrome.tabs.query({}, tabs => {
//                 tabs = tabs.filter(e => getPathFromUrl(e.url) === url)
//                 tabs.forEach(function (tab) {
//                     sendMsg('REFRESH_HIGHLIGHTS', tab.id, false, annotationsToBroadcast)
//                 });
//             });
//         }))
//     })
// }

// chrome.tabs.onActivated.addListener(function (activeInfo) {
//     if (containsObjectWithId(activeInfo.tabId, tabAnnotationCollect)) {
//         const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === activeInfo.tabId);
//         broadcastAnnotationsUpdated('CONTENT_UPDATED', tabInfo[0].annotations);
//         chrome.browserAction.setBadgeText({ text: String(tabInfo[0].annotations.length) });
//     }
//     else {
//         chrome.tabs.get(activeInfo.tabId, (tab) => {
//             publicListener = setUpGetAllAnnotationsByUrlListener(tab.url, annotations);
//             privateListener = promiseToComeBack(tab.url, annotations);
//         });
//     }
// });

// chrome.browserAction.onClicked.addListener(function () {
//     clicked = !clicked;
//     toggleSidebar(clicked);
// });

// const showModal = () => {
//     const modal = document.createElement("dialog");
//     modal.setAttribute("style", `height:450px;border: none;top:150px;border-radius:20px;background-color:white;position: fixed; box-shadow: 0px 12px 48px rgba(29, 5, 64, 0.32);`);
// }







// // let messagesIn = {
// //     //sidebarHelper
// //     'REQUEST_SIDEBAR_STATUS': () => { },
// //     'REQUEST_TOGGLE_SIDEBAR': () => { },
// //     'USER_CHANGE_SIDEBAR_LOCATION': () => { },
// //     'USER_CHANGE_SIDEBAR_SHOULD_SHRINK_BODY': () => { },

// //     // elasticSearchWrapper

// //     'SEARCH_ELASTIC':()=>{},
// //     'GROUP_ELASTIC':()=>{},
// //     'SCROLL_ELASTIC':()=>{},
// //     "SEARCH_ELASTIC_BY_ID":()=>{},
// //     "REFRESH_FOR_CONTENT_UPDATED":()=>{},
// //     'REMOVE_PAGINATION_SEARCH_CACHE': () => { },


// //     //authHelper
// //     'GET_CURRENT_USER':()=>{},
// //     'USER_SIGNUP':()=>{},
// //     'USER_SIGNIN':()=>{},
// //     'USER_SIGNOUT':()=>{},
// //     'USER_FORGET_PWD':()=>{},


// //     /////////////////////
// //     ///  SIDEBAR.jsx  ///
// //     /////////////////////
// //     'SEARCH_BY_TAG': async (request, sender, sendResponse) => {
// //         const { tag } = request.payload;
// //         if (!isContent(request) || tag === "") return;
// //         let annotationsWithTag = [];
// //         getAnnotationsByTag(tag).get().then(function (doc) {
// //             if (!doc.empty)
// //                 doc.docs.forEach(anno => { annotationsWithTag.push({ id: anno.id, ...anno.data() }); });
// //             sendResponse({ annotations: annotationsWithTag });
// //         }).catch(function (error) { console.log('could not get doc: ', error); })
// //     },
// //     'REQUEST_PIN_UPDATE': async (request, sender, sendResponse) => {
// //         const { id, pinned } = request.payload;
// //         await updateAnnotationById(id, {
// //             pinned: pinned, events: fbUnion(editEvent("PIN_UPDATE", { is_pinned: pinned ? "TRUE" : "FALSE" }))
// //         });broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
// //     },
// //     'GET_PINNED_ANNOTATIONS': (request, sender, sendResponse) =>
// //         (isContent(request)) ? sendResponse({ annotations: pinnedAnnotations }) : false,

// //     'REQUEST_TAB_INFO': (request, sender, sendResponse) => {
// //         const cleanUrl = getPathFromUrl(sender.tab.url);
// //         const tabId = sender.tab.id;
// //         sendResponse({ url: cleanUrl, tabId });
// //     },
// //     'UNSUBSCRIBE': (request, sender, sendResponse) => {
// //         if (typeof privateListener === "function") privateListener();
// //         if (typeof publicListener === "function") publicListener();
// //         if (typeof pinnedPrivateListener === "function") pinnedPrivateListener();
// //         if (typeof pinnedPublicListener === "function") pinnedPublicListener();
// //     },
// //     'SET_UP_PIN': (request, sender, sendResponse) => {
// //         if (!isContent(request)) return;
// //         pinnedPrivateListener = getAllPrivatePinnedAnnotationsListener();
// //         pinnedPublicListener = getAllPublicPinnedAnnotationsListener();
// //     },
// //     'GET_ANNOTATIONS_PAGE_LOAD': (request, sender, sendResponse) => {
// //         sendMsg('CREATE_GROUP', request.tabId)
// //         publicListener = setUpGetAllAnnotationsByUrlListener(request.url, annotations);
// //         privateListener = promiseToComeBack(request.url, annotations);
// //         chrome.browserAction.setBadgeText({ text: String(annotations.length) });
// //     },
// //     'LOAD_EXTERNAL_ANCHOR': (request, sender, sendResponse) => chrome.tabs.create({ url: request.payload }),
// //     'UPDATE_REPLIES': async (request, sender, sendResponse) => {
// //         await updateAnnotationById(request.payload.id, {
// //             events: fbUnion(editEvent(request.msg)),
// //             replies: request.payload.replies
// //         })
// //         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', request.payload.id);
// //     },
// //     'REQUEST_ADOPTED_UPDATE': async (request, sender, sendResponse) => {
// //         const { annoId, replyId, adoptedState } = request.payload;
// //         await updateAnnotationById(annoId, {
// //             adopted: adoptedState ? replyId : false,
// //             events: fbUnion(
// //                 editEvent("ANSWER_ADOPTED_UPDATE", { is_question_answered: adoptedState ? "TRUE" : "FALSE" })
// //             )
// //         }); broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', annoId);
// //     },
// //     'UPDATE_QUESTION': async (request, sender, sendResponse) => {
// //         const { id, isClosed, howClosed } = request.payload;
// //         await updateAnnotationById(id, {
// //             isClosed,
// //             howClosed,
// //             events: fbUnion(editEvent(request.msg))
// //         })
// //         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
// //     },
// //     'ADD_NEW_REPLY': async (request, sender, sendResponse) => {
// //         const { id, } = request.payload;
// //         await updateAnnotationById(id, {
// //             events: fbUnion(editEvent(request.msg)),
// //             replies: fbUnion(_createReply(request))
// //         });
// //         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
// //         sendResponse({ msg: 'DONE' });
// //     },
// //     'ANNOTATION_UPDATED': async (request, sender, sendResponse) => {
// //         const { id, content, type, tags, isPrivate, groups } = request.payload;
// //         let doc = await getAnnotationById(id).get();
// //         await updateAnnotationById(id, {
// //             content, type, tags, private: isPrivate, groups,
// //             createdTimestamp: new Date().getTime(),
// //             deletedTimestamp: 0,
// //             events: fbUnion(editEvent(request.msg, doc.data())),
// //         })
// //         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
// //         console.log("TODO", request.message);
// //     },
// //     'ANNOTATION_DELETED': async (request, sender, sendResponse) => {
// //         const { id } = request.payload;
// //         await updateAnnotationById(id, {
// //             deletedTimestamp: new Date().getTime(),
// //             deleted: true,
// //             events: fbUnion(editEvent(request.msg))
// //         });
// //         broadcastAnnotationsUpdated("ELASTIC_CONTENT_DELETED", id);
// //         console.log("TODO", request.message);
// //     },
// //     'FINISH_TODO': async (request, sender, sendResponse) => {
// //         const { id } = request.payload;
// //         await updateAnnotationById(id, {
// //             createdTimestamp: new Date().getTime(),
// //             trashed: true,
// //             events: fbUnion(editEvent(request.msg))
// //         })
// //         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);

// //     },
// //     'UNARCHIVE': async (request, sender, sendResponse) => {
// //         const { id } = request.payload;
// //         await updateAnnotationById(id, {
// //             createdTimestamp: new Date().getTime(),
// //             trashed: false,
// //             events: fbUnion(editEvent(request.msg))
// //         });
// //         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
// //     },
// //     'UPDATE_READ_COUNT': async (request, sender, sendResponse) => {
// //         const { id, readCount } = request.payload;
// //         await updateAnnotationById(id, {
// //             readCount: readCount + 1,
// //             events: fbUnion(editEvent(request.msg))
// //         })
// //         broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
// //     },
// //     'SAVE_ANNOTATED_TEXT': (request, sender, sendResponse) => {
// //         createAnnotation(_createAnnotation(request)).then(value => {
// //             console.log("background", value);
// //             sendResponse({ msg: 'DONE', value: value.id });
// //         });
// //     },
// //     'FILTER_BY_TAG': (request, sender, sendResponse) =>
// //         isContent(request)
// //             ? sendMsg('FILTER_BY_TAG', null, false, request.payload)
// //             : false,
// //     'HIDE_GROUP': (request, sender, sendResponse) => {
// //         console.log('HIDE_GROUP', request)
// //         return isModal(request) ? sendMsg('HIDE_GROUP', null, true) : false;
// //     },
// //     "DELETE_GROUP": (request, sender, sendResponse) => {
// //         if (!isModal(request)) return;
// //         console.log("this is the request for a delete group", request.gid);
// //         const { gid } = request;
// //         deleteGroupForeverByGid(gid).then(value => sendMsg('GROUP_DELETE_SUCCESS', null, true));
// //     },
// //     'ADD_NEW_GROUP': (request, sender, sendResponse) => {
// //         if (!isContent(request)) return;
// //         addNewGroup({
// //             name: request.group.name,
// //             description: request.group.description,
// //             owner: request.group.owner,
// //             emails: request.group.emails
// //         }).then(value => sendMsg('GROUP_CREATE_SUCCESS', null, true))
// //     },
// //     'SHOW_GROUP': (request, sender, sendResponse) => isContent(request) ? sendMsg('SHOW_GROUP', null, true) : false,
// //     'SAVE_HIGHLIGHT': (request, sender, sendResponse) => {
// //         console.log("TODO", request.message);
// //     },
// //     'CONTENT_SELECTED': (request, sender, sendResponse) =>
// //         isContent(request) ? sendMsg('CONTENT_SELECTED', sender.tab.id, false, request.payload) : false,

// //     'UPDATE_XPATH_BY_IDS': (request, sender, sendResponse) => {
// //         request.payload.toUpdate.forEach(e =>
// //             updateAnnotationById(
// //                 e.id, clean({
// //                     "xpath.start": e.xpath.start,
// //                     "xpath.startOffset": e.xpath.startOffset,
// //                     "xpath.end": e.xpath.end,
// //                     "xpath.endOffset": e.xpath.endOffset,
// //                 }),
// //             )
// //         );
// //     },
// //     'CONTENT_NOT_SELECTED': (request, sender, sendResponse) => isContent(request) ? sendMsg('CONTENT_NOT_SELECTED', sender.tab.id, false, request.payload) : false,
// //     'GET_ANNOTATION_BY_ID': (request, sender, sendResponse) => {
// //         if (!isContent(request)) return;
// //         const { id } = request.payload;
// //         getAnnotationById(id).get().then(function (doc) {
// //             sendResponse({ annotation: { id: id, ...doc.data() } });
// //         }).catch(function (error) { console.log(request.message, "error", error); });
// //     },
// //     'GET_GROUPS_PAGE_LOAD': (request, sender, sendResponse) => {
// //         if (isContent(request)) groupListener = setUpGetGroupListener(request.uid);
// //     },
// //     'GET_GROUP_ANNOTATIONS': (request, sender, sendResponse) => {
// //         let GroupAnnotations = [];
// //         getGroupAnnotationsByGroupId(getCurrentUserId()).get().then(function (doc) {
// //             doc.docs.forEach(anno => { pinnedAnnotations.push({ id: anno.id, ...anno.data() }); });
// //             getAllPrivatePinnedAnnotationsByUserId(getCurrentUserId()).get().then(function (doc) {
// //                 doc.docs.forEach(anno => { pinnedAnnotations.push({ id: anno.id, ...anno.data() }); });
// //                 sendResponse({ annotations: pinnedAnnotations });
// //             })
// //         });
// //     },

// // }




// // const fbUnion = (content) => firebase.firestore.FieldValue.arrayUnion({ ...content });
// // const safeSet = (val, alt = null) => val !== undefined ? val : alt;
// // const getAuthor = () => getCurrentUser().email.substring(0, getCurrentUser().email.indexOf('@'));

// // const sendMsg = (msg = "", tabId = null, getActiveTab = false, payload = null) => {
// //     const email = getCurrentUser().email;
// //     const uid = getCurrentUser().uid;
// //     const userName = email.substring(0, email.indexOf('@'));
// //     const _content = {
// //         msg: msg,
// //         from: 'background',
// //         owner: { uid: uid, email: email, userName: userName },
// //         payload: payload
// //     }

// //     if (tabId) chrome.tabs.sendMessage(tabId, _content);
// //     else if (getActiveTab) {
// //         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
// //             chrome.tabs.sendMessage(tabs[0].id, _content);
// //         });
// //     }
// //     else chrome.runtime.sendMessage(_content);
// // }
// // const broadcastAnnotationsUpdated = (message, annotations) => {
// //     sendMsg(message, null, null, annotations)
// // };


// // const editEvent = (msg, data = {}, author = null, eventTime = null,) => {
// //     if (!author) author = getAuthor();
// //     if (!eventTime) eventTime = new Date().getTime();
// //     let content = {
// //         timestamp: eventTime,
// //         user: author,
// //         event: msg,
// //     };
// //     if (msg === "ANNOTATION_UPDATED") {
// //         content = {
// //             ...content,
// //             oldContent: data.content,
// //             oldType: data.type,
// //             oldTags: data.tags,
// //             oldGroups: data.groups,
// //             oldPrivate: data.private
// //         }
// //     } else if (data !== {}) {
// //         content = {
// //             ...content,
// //             ...data
// //         }
// //     }
// //     return Object.assign({}, content);
// // }

// // const _createReply = (request) => {
// //     const eventTime = new Date().getTime();
// //     const author = getAuthor();
// //     const { id, reply, replyTags, answer, question, replyId, xpath, anchor, hostname, url, offsets, adopted } = request.payload;
// //     return Object.assign({}, {
// //         replyId: replyId,
// //         replyContent: reply,
// //         author: author,
// //         authorId: getCurrentUserId(),
// //         timestamp: eventTime,
// //         answer: answer,
// //         question: question,
// //         tags: replyTags,
// //         xpath: safeSet(xpath, null),
// //         anchor: safeSet(anchor, null),
// //         hostname: safeSet(hostname, null),
// //         url: safeSet(url, null),
// //         offsets: safeSet(offsets, null),
// //         adopted: safeSet(adopted, null)
// //     });
// // }

// // const _createAnnotation = (request) => {
// //     let { url, content } = request.payload;
// //     console.log("background", url, content);
// //     const hostname = new URL(url).hostname;
// //     // username is just front of email
// //     const author = getAuthor();
// //     return {
// //         taskId: null,
// //         SharedId: null,
// //         AnnotationContent: content.annotation,
// //         AnnotationAnchorContent: content.anchor,
// //         AnnotationAnchorPath: null,
// //         offsets: content.offsets,
// //         xpath: content.xpath,
// //         AnnotationType: content.annotationType, // could be other types (string)
// //         url,
// //         hostname,
// //         isClosed: false,
// //         pinned: false,
// //         AnnotationTags: content.tags,
// //         childAnchor: [],
// //         isPrivate: content.private,
// //         author,
// //         groups: content.groups,
// //         readCount: 0,
// //         deleted: false,
// //         events: []
// //     };
// // }




// // /*
// // This listens for events and if the command is in the command map,
// //  it runs the commad
// // */

// // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
// //     console.log(request);
// //     if (request.msg in commands) {
// //         commands[request.msg](request, sender, sendResponse);
// //     }

// //     else
// //         console.log("Unknown Command", request.message);
// // });








// // function updateList(list, id, annotations) {
// //     let obj = list.filter(obj => id === obj.tabId);
// //     let objToUpdate = obj[0];
// //     objToUpdate.annotations = annotations;
// //     let temp2 = list.filter(obj => obj.tabId !== id);
// //     temp2.push(objToUpdate);
// //     // temp2 = removeDuplicates(temp2);
// //     return temp2;
// // }

// // // helper method from
// // // https://stackoverflow.com/questions/2540969/remove-querystring-from-url
// // function getPathFromUrl(url) { return url.split(/[?#]/)[0]; }

// // function containsObjectWithId(id, list) {
// //     const test = list.filter(obj => obj.tabId === id);
// //     return test.length !== 0;
// // }
// // // helper method from
// // // https://stackoverflow.com/questions/18773778/create-array-of-unique-objects-by-property
// // function removeDuplicates(annotationArray) {
// //     const flags = new Set();
// //     const annotations = annotationArray.filter(anno => {
// //         if (flags.has(anno.id)) { return false; }
// //         flags.add(anno.id);
// //         return true;
// //     });
// //     return annotations;
// // }



// // const isContent = (res) => res.from === 'content';
// // const isModal = (res) => res.from === 'modal';


// // const broadcastUpdated = (message, annotations = null, groups = null, tabId = null) => {
// //     let payload = annotations ? annotations : groups;
// //     let chromeMsg = {
// //         msg: message,
// //         from: 'background',
// //         payload: payload,
// //     };
// //     if (tabId)
// //         chrome.tabs.query({ active: true }, tabs => {
// //             chrome.tabs.sendMessage(tabId, chromeMsg);
// //         });
// //     else chrome.runtime.sendMessage(chromeMsg);
// // };



// // const broadcastAnnotationsUpdatedTab = (message, annotations, tabId) =>
// //     broadcastUpdated(message, annotations, null, tabId);
// // const broadcastGroupsUpdated = (message, groups) =>
// //     broadcastUpdated(message, null, groups, null);

// // function setUpGetGroupListener(uid) {
// //     // console.log('in setupgrouplistener', uid);
// //     return new Promise((resolve, reject) => {
// //         resolve(getAllUserGroups(uid).onSnapshot(querySnapshot => {
// //             let groups = [];
// //             querySnapshot.forEach(snapshot => {
// //                 groups.push({
// //                     gid: snapshot.id,
// //                     ...snapshot.data()
// //                 });
// //             })
// //             // console.log('groups in back', groups);
// //             broadcastGroupsUpdated("GROUPS_UPDATED", groups);
// //         }))
// //     })
// // }

// // function getAllPrivatePinnedAnnotationsListener() {
// //     return new Promise((resolve, reject) => {
// //         resolve(getAllPrivatePinnedAnnotationsByUserId(getCurrentUserId()).onSnapshot(querySnapshot2 => {
// //             let tempPrivatePinnedAnnotations = [];
// //             querySnapshot2.forEach(snapshot => {
// //                 tempPrivatePinnedAnnotations.push({
// //                     id: snapshot.id,
// //                     ...snapshot.data(),
// //                 });
// //             })
// //             // console.log("temp", tempPublicAnnotations);
// //             pinnedAnnotations = tempPrivatePinnedAnnotations.concat(publicPinnedAnnotations);
// //             privatePinnedAnnotations = tempPrivatePinnedAnnotations;

// //             broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);

// //         }))
// //     })
// // }

// // function getAllPublicPinnedAnnotationsListener() {
// //     return new Promise((resolve, reject) => {
// //         resolve(getAllPinnedAnnotationsByUserId(getCurrentUserId()).onSnapshot(querySnapshot2 => {
// //             let tempPublicPinnedAnnotations = [];
// //             querySnapshot2.forEach(snapshot => {
// //                 tempPublicPinnedAnnotations.push({
// //                     id: snapshot.id,
// //                     ...snapshot.data(),
// //                 });
// //             })
// //             pinnedAnnotations = tempPublicPinnedAnnotations.concat(privatePinnedAnnotations);
// //             publicPinnedAnnotations = tempPublicPinnedAnnotations;
// //             // chrome.tabs.query({ active: true }, tabs => {
// //             //   if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
// //             //     tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
// //             //   }
// //             //   else {
// //             //     tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
// //             //   }
// //             // });
// //             broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
// //             // publicAnnotations = tempPublicAnnotations;
// //             // chrome.tabs.query({}, tabs => {
// //             //   tabs = tabs.filter(e => getPathFromUrl(e.url) === url)
// //             //   tabs.forEach(function (tab) {
// //             //     chrome.tabs.sendMessage(tab.id, {
// //             //       msg: 'REFRESH_HIGHLIGHTS',
// //             //       payload: annotationsToBroadcast,
// //             //     });
// //             //   });
// //             // });
// //         }))
// //     })
// // }

// // // Sets a listener in
// // function setUpGetAllAnnotationsByUrlListener(url, annotations) {
// //     return new Promise((resolve, reject) => {
// //         resolve(getAllAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
// //             let tempPublicAnnotations = [];
// //             querySnapshot2.forEach(snapshot => {
// //                 tempPublicAnnotations.push({
// //                     id: snapshot.id,
// //                     ...snapshot.data(),
// //                 });
// //             })

// //             // console.log("temp", tempPublicAnnotations);
// //             let annotationsToBroadcast = tempPublicAnnotations.concat(privateAnnotations);
// //             annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);
// //             chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
// //                 if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
// //                     tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
// //                 }
// //                 else {
// //                     tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
// //                 }
// //             });
// //             // consider switching this to be in a chrome.tabs.query - check active URL
// //             broadcastAnnotationsUpdated("CONTENT_UPDATED", annotationsToBroadcast);
// //             const numChildAnchs = annotationsToBroadcast.filter(anno => anno.SharedId !== null);
// //             chrome.browserAction.setBadgeText({ text: String(annotationsToBroadcast.length - numChildAnchs.length) });
// //             publicAnnotations = tempPublicAnnotations;
// //             chrome.tabs.query({}, tabs => {
// //                 tabs = tabs.filter(e => getPathFromUrl(e.url) === url)
// //                 tabs.forEach(function (tab) {
// //                     chrome.tabs.sendMessage(tab.id, {
// //                         msg: 'REFRESH_HIGHLIGHTS',
// //                         payload: annotationsToBroadcast,
// //                     });
// //                 });
// //             });
// //         }))
// //     })
// // }

// // function promiseToComeBack(url, annotations) {
// //     return new Promise((resolve, reject) => {

// //         resolve(getPrivateAnnotationsByUrl(url, getCurrentUser().uid).onSnapshot(querySnapshot2 => {
// //             let tempPrivateAnnotations = [];
// //             querySnapshot2.forEach(snapshot => {
// //                 tempPrivateAnnotations.push({
// //                     id: snapshot.id,
// //                     ...snapshot.data(),
// //                 });
// //             });
// //             let annotationsToBroadcast = tempPrivateAnnotations.concat(publicAnnotations);
// //             annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);
// //             chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
// //                 if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
// //                     tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].id, annotationsToBroadcast);
// //                 }
// //                 else {
// //                     tabAnnotationCollect.push({ tabId: tabs[0].id, annotations: annotationsToBroadcast });
// //                 }
// //             });
// //             // console.log("annotations", annotationsToBroadcast)
// //             broadcastAnnotationsUpdated("CONTENT_UPDATED", annotationsToBroadcast);
// //             const numChildAnchs = annotationsToBroadcast.filter(anno => anno.SharedId !== null);
// //             chrome.browserAction.setBadgeText({ text: String(annotationsToBroadcast.length - numChildAnchs.length) });
// //             privateAnnotations = tempPrivateAnnotations;
// //             chrome.tabs.query({}, tabs => {
// //                 tabs = tabs.filter(e => getPathFromUrl(e.url) === url)
// //                 tabs.forEach(function (tab) {
// //                     sendMsg('REFRESH_HIGHLIGHTS', tab.id, false, annotationsToBroadcast)
// //                 });
// //             });
// //         }))
// //     })
// // }

// // chrome.tabs.onActivated.addListener(function (activeInfo) {
// //     if (containsObjectWithId(activeInfo.tabId, tabAnnotationCollect)) {
// //         const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === activeInfo.tabId);
// //         broadcastAnnotationsUpdated('CONTENT_UPDATED', tabInfo[0].annotations);
// //         chrome.browserAction.setBadgeText({ text: String(tabInfo[0].annotations.length) });
// //     }
// //     else {
// //         chrome.tabs.get(activeInfo.tabId, (tab) => {
// //             publicListener = setUpGetAllAnnotationsByUrlListener(tab.url, annotations);
// //             privateListener = promiseToComeBack(tab.url, annotations);
// //         });
// //     }
// // });

// // chrome.browserAction.onClicked.addListener(function () {
// //     clicked = !clicked;
// //     toggleSidebar(clicked);
// // });

// // const showModal = () => {
// //     const modal = document.createElement("dialog");
// //     modal.setAttribute("style", `height:450px;border: none;top:150px;border-radius:20px;background-color:white;position: fixed; box-shadow: 0px 12px 48px rgba(29, 5, 64, 0.32);`);
// // }


