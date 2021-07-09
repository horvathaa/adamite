import * as fb from '../../../firebase/index';
import { transmitMessage, transmitUpdateAnnotationMessage } from '../backgroundTransmitter';
import { clean } from './objectCleaner';
import firebase from '../../../firebase/firebase';
import { getCurrentUserId, getCurrentUser } from '../../../firebase/index';
import { getPathFromUrl } from '../backgroundEventListeners';
import { getGroups, groupListener } from './groupAnnotationsHelper';

// from: https://stackoverflow.com/questions/34151834/javascript-array-contains-includes-sub-array
function hasSubArray(master, sub) {
    return sub.every((i => v => i = master.indexOf(v, i) + 1)(0));
}

function removeDuplicates(idArray) {
    const flags = new Set();
    const annotations = idArray.filter(highlight => {
        if (flags.has(highlight.id)) {
            return false;
        }
        flags.add(highlight.id);
        return true;
    });
    return annotations;
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

//let unsubscribeAnnotations = null;
export let tabAnnotationCollect = [];
let annotationsAcrossWholeSite = [];
let annotations = [];
let publicAnnotations = [];
let privateAnnotations = [];
let groupAnnotations = [];
let publicPinnedAnnotations = [];
let privatePinnedAnnotations = [];
let pinnedAnnotations = [];
let pinnedPrivateListener, pinnedPublicListener, publicListener, privateListener;
let userGroups = [];



const isContent = (res) => res.from === 'content';
const isModal = (res) => res.from === 'modal';


function broadcastAnnotationsUpdated(msg, id) {
    transmitMessage({ msg: msg, data: { payload: id }, sentFrom: "AnnotationHelper", currentTab: false })
}

function broadcastAnnotationsUpdatedTab(msg, id, url, tabId) {
    transmitMessage({ msg: msg, data: { payload: id, url, tabId }, sentFrom: "AnnotationHelper", currentTab: true })
}

function broadcastAnnotationsToTab(msg, id, url, tabId) {
    transmitMessage({ msg: msg, data: { payload: id, url, tabId }, sentFrom: "AnnotationHelper", currentTab: false, specificTab: true })
}

export function setPinnedAnnotationListeners(request, sender, sendResponse) {
    if (!isContent(request)) return;
    getAllPrivatePinnedAnnotationsListener();
    getAllPublicPinnedAnnotationsListener();
}

export async function getAnnotationsPageLoad(request, sender, sendResponse) {
    let uid = getCurrentUserId();
    let { email } = getCurrentUser();
    let groups = [];

    chrome.storage.local.get(['groups'], (result) => {
        if (result.groups !== undefined && result.groups.length) {
            groups = result.groups.map(g => g.gid);
        }
        else {
            getGroups({ request: { uid: uid } });
        }
        getAnnotationsByUrlListener(request.url, groups)
    })

    let userName = email.substring(0, email.indexOf('@'));
    if (request.tabId !== undefined) {
        chrome.tabs.sendMessage(
            request.tabId,
            {
                msg: 'CREATE_GROUP',
                from: 'background',
                owner: {
                    uid: uid,
                    email: email,
                    userName: userName
                }
            }
        );
    }
    // consider moving these into promise to prevent race condition???
    // getPrivateAnnotationsByUrlListener(request.url, request.tabId);
    // chrome.browserAction.setBadgeText({ text: String(annotations.length) });
}

export function getGroupAnnotations(request, sender, sendResponse) {
    const { gid } = request.payload;
    fb.getGroupAnnotationsByGroupId(gid).get().then(function (querySnapshot) {
        let groupAnnotations = querySnapshot.empty ? [] : getListFromSnapshots(querySnapshot) // .filter(anno => anno.url.includes(request.payload.url));
        groupAnnotations = groupAnnotations.filter(anno => !anno.deleted)
        sendResponse(groupAnnotations)
    }).catch(function (error) {
        console.error('Get group annotation error', error)
    })
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
    let { url, newAnno } = request.payload;
    const hostname = new URL(url).hostname;
    const author = getAuthor();

    fb.createAnnotation({
        ...newAnno,
        authorId: getCurrentUserId(),
        url: [url],
        hostname: hostname,
        pinned: newAnno.type === 'question' || newAnno.type === 'to-do',
        author: author,
        groups: newAnno.groups,
        readCount: 0,
        replies: [],
        events: [],
        deleted: false,
        archived: false,
        createdTimestamp: new Date().getTime(),
    });
    sendResponse({ "msg": 'DONE' });
    if(newAnno.tags.length) {
        chrome.storage.local.get(['lastUsedTags'], ( { lastUsedTags } ) => {
            if(!lastUsedTags) {

                chrome.storage.local.set({ lastUsedTags: newAnno.tags })
            }
            else {
                const newTags = lastUsedTags?.length <= 5 ? 
                    [...new Set(lastUsedTags?.concat(newAnno.tags))] : 
                    [...new Set(newAnno.tags.concat(lastUsedTags?.splice(0, 5 - newAnno.tags.length)))] // this sucks 
                chrome.storage.local.set({ lastUsedTags: newTags })
            }
        })
    }
}


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
        try {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: 'ANNOTATION_ADDED',
                        newAnno: highlightObj,
                    }
                );
            });
        }
        catch (error) {
            console.error('tabs cannot be queried right now', error)
        }

        broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', newAnno.sharedId);
    });
}


export async function updateAnnotation(request, sender, sendResponse) {
    const { newAnno, updateType } = request.payload;
    let doc = await fb.getAnnotationById(newAnno.id).get();
    await fb.updateAnnotationById(newAnno.id, {
        ...newAnno,
        deletedTimestamp: 0,
        events: fbUnion(editEvent(request.msg, doc.data())),
    }).then(value => {
        if (updateType === "NewAnchor") {
            try {
                chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        {
                            msg: 'ANNOTATION_ADDED',
                            newAnno: newAnno,
                        }
                    );
                });
            }
            catch (error) {
                console.error('tabs cannot be queried right now', error)
            }

        }
        broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', newAnno.id);
    });
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
        archived: true,
        pinned: false,
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
        archived: false,
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
    if (typeof publicListener === "function")  publicListener();
    if (typeof pinnedPrivateListener === "function") pinnedPrivateListener();
    if (typeof pinnedPublicListener === "function") pinnedPublicListener();
    if (typeof groupListener === 'function') groupListener();
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
    if (activeInfo.url) {
        if (tabAnnotationCollect !== undefined && containsObjectWithUrl(getPathFromUrl(activeInfo.url), tabAnnotationCollect)) {
            const tabInfo = tabAnnotationCollect.filter(obj => obj.tabUrl === getPathFromUrl(activeInfo.url));
            broadcastAnnotationsUpdatedTab('CONTENT_UPDATED', tabInfo[0].annotations);
        }
        else {
            chrome.tabs.get(activeInfo.tabId, (tab) => {
                let groups = [];
                chrome.storage.local.get(['groups'], (result) => {
                    if (result.groups !== undefined) {
                        groups = result.groups.map(g => g.gid);
                    }
                });
                getAnnotationsByUrlListener(getPathFromUrl(activeInfo.url), groups)
                // getAllAnnotationsByUrlListener(getPathFromUrl(tab.url), tab.id);
                // getPrivateAnnotationsByUrlListener(getPathFromUrl(tab.url), tab.id);
            });
        }
    }

}

export function handleTabUpdate(url, tabId) {
    let groups = [];
    chrome.storage.local.get(['groups'], (result) => {
        if (result.groups !== undefined) {
            groups = result.groups.map(g => g.gid);
        }
    });
    // unsubscribeAnnotations();
    getAnnotationsByUrlListener(url, groups)
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
            oldPrivate: data.isPrivate
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


export function containsObjectWithUrl(url, list) {
    const test = list.filter(obj => obj.tabUrl === url);
    return test.length !== 0;
}

function updateList(list, url, annotations, isPrivate) {
    let obj = list.filter(obj => url === obj.tabUrl);
    let objToUpdate = obj[0];
    // if (isPrivate) {
    //     let newList = objToUpdate.annotations.filter(anno => anno.isPrivate !== true && !anno.deleted && anno.url.includes(url)) // removed anno.private check - if things break, well...
    //     objToUpdate.annotations = newList.concat(annotations);
    // }
    // else {
    //     let newList = objToUpdate.annotations.filter(anno => anno.isPrivate === true && !anno.deleted && anno.url.includes(url))
    //     objToUpdate.annotations = newList.concat(annotations);
    // }
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
    return out;
}

function getAllPrivatePinnedAnnotationsListener() {
    const user = fb.getCurrentUser();
    if (user !== null) {
        pinnedPrivateListener = fb.getAllPrivatePinnedAnnotationsByUserId(fb.getCurrentUserId()).onSnapshot(annotationsSnapshot => {
            let tempPrivatePinnedAnnotations = getListFromSnapshots(annotationsSnapshot);
            injectUserData(tempPrivatePinnedAnnotations).then(tempPrivatePinnedAnnotationsWithAuthInfo => {
                pinnedAnnotations = tempPrivatePinnedAnnotationsWithAuthInfo.concat(publicPinnedAnnotations);
                privatePinnedAnnotations = tempPrivatePinnedAnnotationsWithAuthInfo;
                broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
            });
        });
    }
}


function getAllPublicPinnedAnnotationsListener() {
    const user = fb.getCurrentUser();
    if (user !== null) {
        pinnedPublicListener = fb.getAllPinnedAnnotationsByUserId(user.uid).onSnapshot(annotationsSnapshot => {
            let tempPublicPinnedAnnotations = getListFromSnapshots(annotationsSnapshot);
            injectUserData(tempPublicPinnedAnnotations).then(tempPublicPinnedAnnotationsWithAuthInfo => {
                pinnedAnnotations = tempPublicPinnedAnnotationsWithAuthInfo.concat(privatePinnedAnnotations);
                publicPinnedAnnotations = tempPublicPinnedAnnotationsWithAuthInfo;
                broadcastAnnotationsUpdated("PINNED_CHANGED", pinnedAnnotations);
            });
        });
    }
}


function batchSearchFirestore(returnArray, searchArray, queryFunction) {
    return new Promise((resolve, reject) => {
        if (searchArray.length === 0) {
            resolve(returnArray);
        }
        else if (searchArray.length > 0) {
            var batchedSearch = searchArray.length > 10 ? searchArray.slice(0, 10) : searchArray;
            var arrayRecurSearch = searchArray.length > 10 ? searchArray.slice(10, searchArray.length) : [];
            resolve(queryFunction(batchedSearch)).then(e => {
                return batchSearchFirestore(returnArray.concat(e), arrayRecurSearch, queryFunction);
            })
                .catch(err => {
                    console.log('Error getting batchSearchFirestore', err);
                    reject(err);
                });
        }
        resolve(returnArray);
    });
}

function getUserDataFromAuthId(authIds) {
    return fb.getUsersbyID(authIds).get()
        .then(queryResult => {
            var tempArray = []
            if (!queryResult.empty) {
                queryResult.forEach(docs => {
                    tempArray.push({
                        id: docs.id,
                        ...docs.data(),
                    });
                });
                return tempArray;
            }
            return [];
        })
        .catch(err => {
            console.log('Error getting user Profiles', err);
            throw err;
        });
}

function getAllAuthIds(annotations) {
    let authors = []
    annotations.map(annotation => {
        authors.push(annotation.authorId);
        annotation.replies?.forEach(replies => {
            authors.push(replies.authorId)
        })
    })
    return authors;
}

// TODO: add error checking for if the annotation list and/or auth lists are empty
function injectUserData(annotationsToBroadcast) {

    let authIds = [...new Set(getAllAuthIds(annotationsToBroadcast))];
    return batchSearchFirestore([], authIds, getUserDataFromAuthId).then(authProfiles => {
        let annotationsWithAuthorInfo = annotationsToBroadcast.map(annotation => {
            const authdata = authProfiles.find(element => element.uid === annotation.authorId);
            annotation.replies = annotation.replies?.map(reply => {
                let authDataReplies = authProfiles.find(element => element.uid === reply.authorId);
                return {
                    photoURL: authDataReplies.photoURL,
                    displayName: authDataReplies.displayName,
                    ...reply
                }
            });
            return {
                photoURL: authdata.photoURL,
                displayName: authdata.displayName,
                ...annotation
            }
        })
        return (annotationsWithAuthorInfo);
    });
}


function getAnnotationsByUrlListener(url, groups) {
    const user = fb.getCurrentUser();
    console.log('url', url)
    if (user !== null) {
        publicListener = fb.getAnnotationsByUrl(url).onSnapshot(async annotationsSnapshot => {
            let annotationsToBroadcast = getListFromSnapshots(annotationsSnapshot);
            annotationsToBroadcast = annotationsToBroadcast.filter(anno => {
                return (!anno.deleted && anno.url.includes(url)) && (!(anno.isPrivate && anno.authorId !== user.uid) || (anno.groups.some(g => groups.includes(g))))
            })
            injectUserData(annotationsToBroadcast).then(annotationsToBroadcastWithAuthInfo => {
                try {
                    chrome.tabs.query({}, tabs => {
                        const tabsWithUrl = tabs.filter(t => getPathFromUrl(t.url) === url);
                        if (containsObjectWithUrl(url, tabAnnotationCollect)) {
                            tabAnnotationCollect = updateList(tabAnnotationCollect, url, annotationsToBroadcastWithAuthInfo, false);
                        }
                        else {
                            tabAnnotationCollect.push({ tabUrl: url, annotations: annotationsToBroadcast });
                        }
                        let newList = tabAnnotationCollect.filter(obj => obj.tabUrl === url);
                        tabsWithUrl.forEach(t => {
                            broadcastAnnotationsToTab("CONTENT_UPDATED", newList[0].annotations, url, t.id);
                        })
                    });
                }
                catch (error) {
                    console.error('tabs cannot be queried right now', error);
                    if (error == 'Error: Tabs cannot be edited right now (user may be dragging a tab).')
                        setTimeout(() => getAnnotationsByUrlListener(url, groups))
                }
            });
        });
    }
}
