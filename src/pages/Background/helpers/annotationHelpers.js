import * as fb from '../../../firebase/index';
import { transmitMessage, transmitUpdateAnnotationMessage } from '../backgroundTransmitter';
import { clean } from './objectCleaner';
import firebase from '../../../firebase/firebase';
import { getCurrentUserId } from '../../../firebase/index';


//let unsubscribeAnnotations = null;
export let tabAnnotationCollect = [];
let annotationsAcrossWholeSite = [];
let annotations = [];
let publicAnnotations = [];
let privateAnnotations = [];
let publicPinnedAnnotations = [];
let privatePinnedAnnotations = [];
let pinnedAnnotations = [];
let pinnedPrivateListener, pinnedPublicListener, publicListener, privateListener



const isContent = (res) => res.from === 'content';
const isModal = (res) => res.from === 'modal';


function broadcastAnnotationsUpdated(msg, id) {
    transmitMessage({ msg: msg, data: { payload: id }, sentFrom: "AnnotationHelper", currentTab: false })
}
function broadcastAnnotationsUpdatedTab(msg, id, url, tabId) {
    transmitMessage({ msg: msg, data: { payload: id, url, tabId }, sentFrom: "AnnotationHelper", currentTab: true })
}

export function setPinnedAnnotationListeners(request, sender, sendResponse) {
    if (!isContent(request)) return;
    getAllPrivatePinnedAnnotationsListener();
    getAllPublicPinnedAnnotationsListener();
}

export async function getAnnotationsPageLoad(request, sender, sendResponse) {
    console.log("GET_ANNOTATIONS_PAGE_LOAD");

    // let email = fb.getCurrentUser().email;
    // let userName = email.substring(0, fb.getCurrentUser().email.indexOf('@'));
    getAllAnnotationsByUrlListener(request.url, request.tabId,)
    getPrivateAnnotationsByUrlListener(request.url, request.tabId,);
    // chrome.browserAction.setBadgeText({ text: String(annotations.length) });
}

export function getPinnedAnnotations(request, sender, sendResponse) {
    // eslint-disable-next-line no-unused-expressions
    (isContent(request)) ? sendResponse({ "annotations": pinnedAnnotations }) : false;
}
export function getAnnotationById(request, sender, sendResponse) {
    const { id } = request.payload;
    fb.getAnnotationById(id).get().then(function (doc) {
        sendResponse({ annotation: { id: id, ...doc.data() } });
    }).catch(function (error) {
        console.log('getAnnotationById error', error);
    });
}

export async function createAnnotation(request, sender, sendResponse) {
    fb.createAnnotation(_createAnnotation(request)).then(value => {
        console.log("background", value);
        console.log('sendResponse', sendResponse);
    });
    sendResponse({ "msg": 'DONE' });
}
export async function createAnnotationHighlight(request, sender, sendResponse) {
    let { url, anchor, xpath, offsets } = request.payload;
    const hostname = new URL(url).hostname;
    const author = getAuthor();
    fb.createAnnotation({
        taskId: null,
        SharedId: null,
        AnnotationContent: "",
        AnnotationAnchorContent: anchor,
        AnnotationAnchorPath: null,
        offsets: offsets,
        xpath: xpath,
        AnnotationType: "highlight",
        url: [url],
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
// 
export async function createAnnotationReply(request, sender, sendResponse) {
    const { id, url } = request.payload;
    if (url !== undefined && url !== "") {
        fb.updateAnnotationById(id, {
            events: fbUnion(editEvent(request.msg)),
            replies: fbUnion(_createReply(request)),
            url: fbUnionNoSpread(url)
        }).then(function (e) {
            broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);

        });
    }
    else {
        fb.updateAnnotationById(id, {
            events: fbUnion(editEvent(request.msg)),
            replies: fbUnion(_createReply(request)),
        }).then(function (e) {
            broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
        });
    }
    sendResponse({ "msg": 'DONE' });
}

export async function createAnnotationChildAnchor(request, sender, sendResponse) {
    let { newAnno, xpath, url, anchor, offsets, hostname } = request.payload;
    const id = new Date().getTime();
    const newAnchor = Object.assign({}, {
        parentId: newAnno.sharedId, id, anchor, url, offsets, hostname, xpath
    });

    fb.updateAnnotationById(newAnno.sharedId, {
        childAnchor: fbUnion(newAnchor),
        events: fbUnion(editEvent(request.msg)),
        url: fbUnionNoSpread(url)
    }).then(value => {
        let highlightObj = {
            id: newAnno.sharedId + "-" + id,
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
}


export async function updateAnnotation(request, sender, sendResponse) {
    const { id, content, type, tags, isPrivate, groups } = request.payload;
    let doc = await fb.getAnnotationById(id).get();
    await fb.updateAnnotationById(id, {
        content, type, tags, private: isPrivate, groups,
        createdTimestamp: new Date().getTime(),
        deletedTimestamp: 0,
        events: fbUnion(editEvent(request.msg, doc.data())),
    })
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    console.log("TODO", request.message);
}


export async function updateAnnotationAdopted(request, sender, sendResponse) {
    const { annoId, replyId, adoptedState } = request.payload;
    await fb.updateAnnotationById(annoId, {
        adopted: adoptedState ? replyId : false,
        events: fbUnion(
            editEvent("ANSWER_ADOPTED_UPDATE", { is_question_answered: adoptedState ? "TRUE" : "FALSE" })
        )
    });
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', annoId);
}
export async function updateAnnotationPinned(request, sender, sendResponse) {
    const { id, pinned } = request.payload;
    await fb.updateAnnotationById(id, {
        pinned: pinned, events: fbUnion(editEvent("PIN_UPDATE", { is_pinned: pinned ? "TRUE" : "FALSE" }))
    })
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationQuestion(request, sender, sendResponse) {
    const { id, isClosed, howClosed } = request.payload;
    await fb.updateAnnotationById(id, {
        isClosed,
        howClosed,
        events: fbUnion(editEvent(request.msg))
    })
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationTodoFinished(request, sender, sendResponse) {
    const { id } = request.payload;
    await fb.updateAnnotationById(id, {
        createdTimestamp: new Date().getTime(),
        trashed: true,
        events: fbUnion(editEvent(request.msg))
    });
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationReadCount(request, sender, sendResponse) {
    const { id, readCount } = request.payload;
    await fb.updateAnnotationById(id, {
        readCount: readCount + 1,
        events: fbUnion(editEvent(request.msg))
    });
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationReplies(request, sender, sendResponse) {
    const { id, } = request.payload;
    await fb.updateAnnotationById(id, {
        events: fbUnion(editEvent(request.msg)),
        replies: fbUnion(_createReply(request))
    });
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    sendResponse({ msg: 'DONE' });
}

export async function updateAnnotationXPath(request, sender, sendResponse) {
    request.payload.toUpdate.forEach(e =>
        fb.updateAnnotationById(
            e.id, clean({
                "xpath.start": e.xpath.start,
                "xpath.startOffset": e.xpath.startOffset,
                "xpath.end": e.xpath.end,
                "xpath.endOffset": e.xpath.endOffset,
            }),
        )
    );
}
export async function updateAnnotationUnarchive(request, sender, sendResponse) {
    const { id } = request.payload;
    await fb.updateAnnotationById(id, {
        createdTimestamp: new Date().getTime(),
        trashed: false,
        events: fbUnion(editEvent(request.msg))
    });
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}


export async function deleteAnnotation(request, sender, sendResponse) {
    const { id } = request.payload;
    await fb.updateAnnotationById(id, {
        deletedTimestamp: new Date().getTime(),
        deleted: true,
        events: fbUnion(editEvent(request.msg))
    }).then(function () {
        broadcastAnnotationsUpdated("ELASTIC_CONTENT_DELETED", id);
    });
}

export function unsubscribeAnnotations(request, sender, sendResponse) {
    if (typeof privateListener === "function") privateListener();
    if (typeof publicListener === "function") publicListener();
    if (typeof pinnedPrivateListener === "function") pinnedPrivateListener();
    if (typeof pinnedPublicListener === "function") pinnedPublicListener();
}

export async function filterAnnotationsByTag(request, sender, sendResponse) {
    chrome.runtime.sendMessage({
        msg: 'FILTER_BY_TAG',
        from: 'background',
        payload: request.payload
    });
}

export async function searchAnnotationsByTag(request, sender, sendResponse) {
    const { tag } = request.payload;
    if (!isContent(request) || tag === "") return;
    let annotationsWithTag = [];
    fb.getAnnotationsByTag(tag).get().then(function (doc) {
        if (!doc.empty)
            doc.docs.forEach(anno => { annotationsWithTag.push({ id: anno.id, ...anno.data() }); });
        sendResponse({ annotations: annotationsWithTag });
    }).catch(function (error) { console.log('could not get doc: ', error); })
}


export function updateAnnotationsOnTabActivated(activeInfo) {
    if (containsObjectWithUrl(activeInfo.url, tabAnnotationCollect)) {
        const tabInfo = tabAnnotationCollect.filter(obj => obj.tabUrl === activeInfo.url);
        broadcastAnnotationsUpdatedTab('CONTENT_UPDATED', tabInfo[0].annotations);
    }
    else {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            getAllAnnotationsByUrlListener(tab.url);
            getPrivateAnnotationsByUrlListener(tab.url);
        });
    }
}

export function handleTabUpdate(url, tabId) {
    console.log("Handle tab update");
    getAllAnnotationsByUrlListener(url, tabId);
    getPrivateAnnotationsByUrlListener(url, tabId);
}


const fbUnion = (content) => firebase.firestore.FieldValue.arrayUnion({ ...content });
const fbUnionNoSpread = (content) => firebase.firestore.FieldValue.arrayUnion(content);
const safeSet = (val, alt = null) => val !== undefined ? val : alt;
const getAuthor = () => fb.getCurrentUser().email.substring(0, fb.getCurrentUser().email.indexOf('@'));



const editEvent = (msg, data = {}, author = null, eventTime = null,) => {
    if (!author) author = getAuthor();
    if (!eventTime) eventTime = new Date().getTime();
    let content = {
        timestamp: eventTime,
        user: author,
        event: msg,
    };
    if (msg === "ANNOTATION_UPDATED") {
        content = {
            ...content,
            oldContent: data.content,
            oldType: data.type,
            oldTags: data.tags,
            oldGroups: data.groups,
            oldPrivate: data.private
        }
    } else if (data !== {}) {
        content = {
            ...content,
            ...data
        }
    }
    return Object.assign({}, content);
}

const _createReply = (request) => {
    const eventTime = new Date().getTime();
    const author = getAuthor();
    const { reply, replyTags, answer, question, replyId, xpath, anchor, hostname, url, offsets, adopted } = request.payload;
    return Object.assign({}, {
        replyId: replyId,
        replyContent: reply,
        author: author,
        authorId: getCurrentUserId(),
        timestamp: eventTime,
        answer: answer,
        question: question,
        tags: replyTags,
        xpath: safeSet(xpath, null),
        anchor: safeSet(anchor, null),
        hostname: safeSet(hostname, null),
        url: safeSet(url, null),
        offsets: safeSet(offsets, null),
        adopted: safeSet(adopted, null)
    });
}

const _createAnnotation = (request) => {
    let { url, content } = request.payload;
    // console.log("background", url, content);
    const hostname = new URL(url).hostname;
    // username is just front of email
    const author = getAuthor();
    return {
        taskId: null,
        SharedId: null,
        AnnotationContent: content.annotation,
        AnnotationAnchorContent: content.anchor,
        AnnotationAnchorPath: null,
        offsets: content.offsets,
        xpath: content.xpath,
        AnnotationType: content.annotationType, // could be other types (string)
        url: [url],
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
    };
}



export function containsObjectWithUrl(url, list) {
    const test = list.filter(obj => obj.tabUrl === url);
    return test.length !== 0;
}

function updateList(list, url, annotations) {
    let obj = list.filter(obj => url === obj.tabUrl);
    let objToUpdate = obj[0];
    objToUpdate.annotations = annotations;
    let temp2 = list.filter(obj => obj.tabUrl !== url);
    temp2.push(objToUpdate);
    // temp2 = removeDuplicates(temp2);
    return temp2;
}


function getListFromSnapshots(snapshots) {
    let out = [];
    snapshots.forEach(snapshot => {
        out.push({
            id: snapshot.id, ...snapshot.data(),
        });
    });
    console.log(out);
    return out;
}

function getAllPrivatePinnedAnnotationsListener() {
    pinnedPrivateListener = fb.getAllPrivatePinnedAnnotationsByUserId(fb.getCurrentUserId()).onSnapshot(annotationsSnapshot => {
        let tempPrivatePinnedAnnotations = getListFromSnapshots(annotationsSnapshot);
        pinnedAnnotations = tempPrivatePinnedAnnotations.concat(publicPinnedAnnotations);
        privatePinnedAnnotations = tempPrivatePinnedAnnotations;

        broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
    });
}


function getAllPublicPinnedAnnotationsListener() {
    pinnedPublicListener = fb.getAllPinnedAnnotationsByUserId(fb.getCurrentUserId()).onSnapshot(annotationsSnapshot => {
        let tempPublicPinnedAnnotations = getListFromSnapshots(annotationsSnapshot);
        pinnedAnnotations = tempPublicPinnedAnnotations.concat(privatePinnedAnnotations);
        publicPinnedAnnotations = tempPublicPinnedAnnotations;
        broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
    });
}


function getAllAnnotationsByUrlListener(url, tabId) {
    console.log("getAllAnnotationsByUrlListener", url);
    publicListener = fb.getAllAnnotationsByUrl(url, fb.getCurrentUser().uid).onSnapshot(annotationsSnapshot => {
        let tempPublicAnnotations = getListFromSnapshots(annotationsSnapshot);
        console.log('temp pub', tempPublicAnnotations);
        let annotationsToBroadcast = tempPublicAnnotations.concat(privateAnnotations);
        annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted && anno.url.includes(url));

        // chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        console.log('hm url from onactivated', url, 'tabs query annos', annotationsToBroadcast)
        // if (tabs && tabs.length > 0 && tabs[0].url && tabs[0].url === url) {

        if (containsObjectWithUrl(url, tabAnnotationCollect)) {
            tabAnnotationCollect = updateList(tabAnnotationCollect, url, annotationsToBroadcast);
        }
        else {
            tabAnnotationCollect.push({ tabUrl: url, annotations: annotationsToBroadcast });
        }

        console.log('tabid', tabId);
        broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToBroadcast, url, tabId);
        console.log('broadcast', annotationsToBroadcast);
        console.log('tabAnnoCollect', tabAnnotationCollect);
        // }
        // });

        // broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToBroadcast);
        publicAnnotations = tempPublicAnnotations;

    });
}



function getPrivateAnnotationsByUrlListener(url, tabId) {
    console.log("getPrivateAnnotationsByUrlListener", url);
    privateListener = fb.getPrivateAnnotationsByUrl(url, fb.getCurrentUser().uid).onSnapshot(annotationsSnapshot => {
        let tempPrivateAnnotations = getListFromSnapshots(annotationsSnapshot);
        let annotationsToBroadcast = tempPrivateAnnotations.concat(publicAnnotations);
        annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted && anno.url.includes(url));

        // chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        console.log('hm url from onactivated', url, 'tabs query', 'annos', annotationsToBroadcast)
        // if (tabs && tabs.length && tabs[0].url && tabs[0].url === url) {

        if (containsObjectWithUrl(url, tabAnnotationCollect)) {
            tabAnnotationCollect = updateList(tabAnnotationCollect, url, annotationsToBroadcast);
        }
        else {
            tabAnnotationCollect.push({ tabUrl: url, annotations: annotationsToBroadcast });
        }

        console.log('tabid', tabId);
        broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToBroadcast, url, tabId);
        // }

        // });

        privateAnnotations = tempPrivateAnnotations;
    });

}

