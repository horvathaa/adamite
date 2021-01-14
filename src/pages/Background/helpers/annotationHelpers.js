import * as fb from '../../../firebase/index';
import { transmitMessage, transmitUpdateAnnotationMessage } from '../backgroundTransmitter';
import firebase from '../../../firebase/firebase';


//let unsubscribeAnnotations = null;
let tabAnnotationCollect = [];
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
function broadcastAnnotationsUpdatedTab(msg, id) {
    transmitMessage({ msg: msg, data: { payload: id }, sentFrom: "AnnotationHelper", currentTab: true })
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
    getAllAnnotationsByUrlListener(request.url, annotations,)
    getPrivateAnnotationsByUrlListener(request.url, annotations,);
    chrome.browserAction.setBadgeText({ text: String(annotations.length) });
}

export function getPinnedAnnotations(request, sender, sendResponse) {
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
        sendResponse({ msg: 'DONE', value: value.id });
    });
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
export async function createAnnotationReply(request, sender, sendResponse) {

}
export async function createAnnotationChildAnchor(request, sender, sendResponse) {

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
    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
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
    if (!isModal(request)) return;
    console.log("this is the request for a delete group", request.gid);
    const { gid } = request;
    fb.deleteGroupForeverByGid(gid).then(value => sendMsg('GROUP_DELETE_SUCCESS', null, true));
}




export function unsubscribeAnnotations(request, sender, sendResponse) {
    if (typeof privateListener === "function") privateListener();
    if (typeof publicListener === "function") publicListener();
    if (typeof pinnedPrivateListener === "function") pinnedPrivateListener();
    if (typeof pinnedPublicListener === "function") pinnedPublicListener();
}

export async function filterByTag(request, sender, sendResponse) {
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

export function handleTabUpdate(url) {
    console.log("Handle tab update");
    getAllAnnotationsByUrlListener(url);
    getPrivateAnnotationsByUrlListener(url);
}


const fbUnion = (content) => firebase.firestore.FieldValue.arrayUnion({ ...content });
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
    const { id, reply, replyTags, answer, question, replyId, xpath, anchor, hostname, url, offsets, adopted } = request.payload;
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
    console.log("background", url, content);
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
    };
}



function containsObjectWithUrl(url, list) {
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


function getAllAnnotationsByUrlListener(url, annotations) {
    console.log("getAllAnnotationsByUrlListener");
    publicListener = fb.getAllAnnotationsByUrl(url, fb.getCurrentUser().uid).onSnapshot(annotationsSnapshot => {
        let tempPublicAnnotations = getListFromSnapshots(annotationsSnapshot);
        let annotationsToBroadcast = tempPublicAnnotations.concat(privateAnnotations);
        annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            console.log(tabs[0].url);
            if (containsObjectWithUrl(tabs[0].url, tabAnnotationCollect))
                tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].url, annotationsToBroadcast);
            else
                tabAnnotationCollect.push({ tabUrl: tabs[0].url, annotations: annotationsToBroadcast });
        });
        console.log(annotationsToBroadcast);
        broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToBroadcast);
        publicAnnotations = tempPublicAnnotations;

    });
}



function getPrivateAnnotationsByUrlListener(url, annotations) {
    console.log("getPrivateAnnotationsByUrlListener");
    privateListener = fb.getPrivateAnnotationsByUrl(url, fb.getCurrentUser().uid).onSnapshot(annotationsSnapshot => {
        let tempPrivateAnnotations = getListFromSnapshots(annotationsSnapshot);
        let annotationsToBroadcast = tempPrivateAnnotations.concat(publicAnnotations);
        annotationsToBroadcast = annotationsToBroadcast.filter(anno => !anno.deleted);

        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (containsObjectWithUrl(tabs[0].url, tabAnnotationCollect))
                tabAnnotationCollect = updateList(tabAnnotationCollect, tabs[0].url, annotationsToBroadcast);
            else
                tabAnnotationCollect.push({ tabUrl: tabs[0].url, annotations: annotationsToBroadcast });

        });
        broadcastAnnotationsUpdatedTab("CONTENT_UPDATED", annotationsToBroadcast);
        privateAnnotations = tempPrivateAnnotations;
    });

}

