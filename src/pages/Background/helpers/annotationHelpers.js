import * as fb from '../../../firebase/index';
import {
  transmitMessage,
  transmitUpdateAnnotationMessage,
} from '../backgroundTransmitter';
import { clean } from './objectCleaner';
import firebase from '../../../firebase/firebase';
import {
  getCurrentUserId,
  getCurrentUser,
  createSearchEvent,
} from '../../../firebase/index';
import { getPathFromUrl } from '../backgroundEventListeners';
import { getGroups, groupListener } from './groupAnnotationsHelper';
import { handleLinkingGithub } from './authHelper';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'path';

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
let pinnedPrivateListener,
  pinnedPublicListener,
  publicListener,
  privateListener;
let userGroups = [];

const isContent = res => res.from === 'content';
const isModal = res => res.from === 'modal';

function broadcastAnnotationsUpdated(msg, id) {
  transmitMessage({
    msg: msg,
    data: { payload: id },
    sentFrom: 'AnnotationHelper',
    currentTab: false,
  });
}

function broadcastAnnotationsUpdatedTab(msg, id, url, tabId) {
  transmitMessage({
    msg: msg,
    data: { payload: id, url, tabId },
    sentFrom: 'AnnotationHelper',
    currentTab: true,
  });
}

function broadcastAnnotationsToTab(msg, id, url, tabId) {
  transmitMessage({
    msg: msg,
    data: { payload: id, url, tabId },
    sentFrom: 'AnnotationHelper',
    currentTab: false,
    specificTab: true,
  });
}

export function setPinnedAnnotationListeners(request, sender, sendResponse) {
  if (!isContent(request)) return;
  pinnedPrivateListener = getPinnedAnnotationsWrapper(
    'private',
    fb.getAllPrivatePinnedAnnotationsByUserId
  );
  pinnedPublicListener = getPinnedAnnotationsWrapper(
    'public',
    fb.getAllPinnedAnnotationsByUserId
  );
}

export async function getAnnotationsPageLoad(request, sender, sendResponse) {
  let uid = getCurrentUserId();
  let { email } = getCurrentUser();
  let groups = [];

  chrome.storage.local.get(['groups'], result => {
    if (result.groups !== undefined && result.groups.length) {
      groups = result.groups.map(g => g.gid);
    } else {
      getGroups({ request: { uid: uid } });
    }
    getAnnotationsByUrlListener(request.url, groups, request.tabId);
  });

  let userName = email.substring(0, email.indexOf('@'));
  if (request.tabId !== undefined) {
    chrome.tabs.sendMessage(request.tabId, {
      msg: 'CREATE_GROUP',
      from: 'background',
      owner: {
        uid: uid,
        email: email,
        userName: userName,
      },
    });
  }
  // consider moving these into promise to prevent race condition???
  // getPrivateAnnotationsByUrlListener(request.url, request.tabId);
  // chrome.browserAction.setBadgeText({ text: String(annotations.length) });
}

export function getGroupAnnotations(request, sender, sendResponse) {
  const { gid } = request.payload;
  fb.getGroupAnnotationsByGroupId(gid)
    .get()
    .then(function (querySnapshot) {
      let groupAnnotations = querySnapshot.empty
        ? []
        : getListFromSnapshots(querySnapshot); // .filter(anno => anno.url.includes(request.payload.url));
      groupAnnotations = groupAnnotations.filter(anno => !anno.deleted);
      console.log('Getting Groups', groupAnnotations);
      sendResponse(groupAnnotations);
    })
    .catch(function (error) {
      console.error('Get group annotation error', error);
    });
}

export function getPinnedAnnotations(request, sender, sendResponse) {
  // eslint-disable-next-line no-unused-expressions
  isContent(request) ? sendResponse({ annotations: pinnedAnnotations }) : false;
}
export function getAnnotationById(request, sender, sendResponse) {
  const { id } = request.payload;
  fb.getAnnotationById(id)
    .get()
    .then(function (doc) {
      sendResponse({ annotation: { id: id, ...doc.data() } });
    })
    .catch(function (error) {
      console.log('getAnnotationById error', error);
    });
}

export async function getGoogleResultAnnotations(
  request,
  sender,
  sendResponse
) {
  let { urls } = request.payload;
  if (urls.length === 0) {
    sendResponse([]);
    return;
  }
  const uid = fb.getCurrentUser().uid;
  let annos = [];
  urls = urls.slice(0, 10);
  urls = urls.map(u => {
    if (u.includes('developer.mozilla.org/en/')) {
      let arr = u.split('/en/');
      u = arr[0] + '/en-US/' + arr[1];
    }
    return u;
  });
  fb.getAnnotationsFromArrayOfUrls(urls)
    .get()
    .then(function (querySnapshot) {
      annos = querySnapshot.empty ? [] : getListFromSnapshots(querySnapshot);
      annos = annos.filter(
        a => ((a.isPrivate && a.authorId === uid) || !a.isPrivate) && !a.deleted
      ); // (add check for user groups)
      sendResponse(annos);
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
  sendResponse({ msg: 'DONE' });
  if (newAnno.tags.length) {
    setLastUsedTags(newAnno.tags);
  }
  if (newAnno.groups.length) {
    setLastUsedGroup(newAnno.groups);
  }
}

export async function createAnnotationReply(request, sender, sendResponse) {
  const { id, url } = request.payload;
  if (url !== undefined && url !== '') {
    fb.updateAnnotationById(id, {
      events: fbUnion(editEvent(request.msg)),
      replies: fbUnion(_createReply(request)),
      url: fbUnionNoSpread(url),
    }).then(function (e) {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    });
  } else {
    fb.updateAnnotationById(id, {
      events: fbUnion(editEvent(request.msg)),
      replies: fbUnion(_createReply(request)),
    }).then(function (e) {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
    });
  }
  sendResponse({ msg: 'DONE' });
}

export async function createAnnotationChildAnchor(
  request,
  sender,
  sendResponse
) {
  let { newAnno, xpath, url, anchor, offsets, hostname } = request.payload;
  const id = new Date().getTime();
  const newAnchor = Object.assign(
    {},
    {
      parentId: newAnno.sharedId,
      id,
      anchor,
      url,
      offsets,
      hostname,
      xpath,
    }
  );

  fb.updateAnnotationById(newAnno.sharedId, {
    childAnchor: fbUnion(newAnchor),
    events: fbUnion(editEvent(request.msg)),
    url: fbUnionNoSpread(url),
  }).then(value => {
    let highlightObj = {
      id: newAnno.sharedId + '-' + id,
      content: newAnno.content,
      xpath: xpath,
    };
    try {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          msg: 'ANNOTATION_ADDED',
          newAnno: highlightObj,
        });
      });
    } catch (error) {
      console.error('tabs cannot be queried right now', error);
    }

    broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', newAnno.sharedId);
  });
}

export async function updateAnnotation(request, sender, sendResponse) {
  const { newAnno, updateType } = request.payload;
  let doc = await fb.getAnnotationById(newAnno.id).get();
  await fb
    .updateAnnotationById(newAnno.id, {
      ...newAnno,
      deletedTimestamp: 0,
      events: fbUnion(editEvent(request.msg, doc.data())),
    })
    .then(value => {
      if (updateType === 'NewAnchor') {
        try {
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
              msg: 'ANNOTATION_ADDED',
              newAnno: newAnno,
            });
          });
        } catch (error) {
          console.error('tabs cannot be queried right now', error);
        }
      }
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', newAnno.id);
      if (newAnno.tags?.length) {
        setLastUsedTags(newAnno.tags);
      }
      if (newAnno.groups?.length) {
        setLastUsedGroup(newAnno.groups);
      }
    });
}

export async function updateAnnotationAdopted(request, sender, sendResponse) {
  const { annoId, replyId, adoptedState } = request.payload;
  await fb.updateAnnotationById(annoId, {
    adopted: adoptedState ? replyId : false,
    events: fbUnion(
      editEvent('ANSWER_ADOPTED_UPDATE', {
        is_question_answered: adoptedState ? 'TRUE' : 'FALSE',
      })
    ),
  });
  broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', annoId);
}
export async function updateAnnotationPinned(request, sender, sendResponse) {
  const { id, pinned } = request.payload;
  await fb.updateAnnotationById(id, {
    pinned: pinned,
    events: fbUnion(
      editEvent('PIN_UPDATE', { is_pinned: pinned ? 'TRUE' : 'FALSE' })
    ),
  });
  broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationQuestion(request, sender, sendResponse) {
  const { id, isClosed, howClosed } = request.payload;
  await fb.updateAnnotationById(id, {
    isClosed,
    howClosed,
    events: fbUnion(editEvent(request.msg)),
  });
  broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationTodoFinished(
  request,
  sender,
  sendResponse
) {
  const { id } = request.payload;
  await fb.updateAnnotationById(id, {
    createdTimestamp: new Date().getTime(),
    archived: true,
    pinned: false,
    events: fbUnion(editEvent(request.msg)),
  });
  broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationReadCount(request, sender, sendResponse) {
  const { id, readCount } = request.payload;
  await fb.updateAnnotationById(id, {
    readCount: readCount + 1,
    events: fbUnion(editEvent(request.msg)),
  });
  broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function updateAnnotationReplies(request, sender, sendResponse) {
  const { id } = request.payload;
  await fb.updateAnnotationById(id, {
    events: fbUnion(editEvent(request.msg)),
    replies: fbUnion(_createReply(request)),
  });
  broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
  sendResponse({ msg: 'DONE' });
}

export async function updateAnnotationXPath(request, sender, sendResponse) {
  request.payload.toUpdate.forEach(e =>
    fb.updateAnnotationById(
      e.id,
      clean({
        'xpath.start': e.xpath.start,
        'xpath.startOffset': e.xpath.startOffset,
        'xpath.end': e.xpath.end,
        'xpath.endOffset': e.xpath.endOffset,
      })
    )
  );
}
export async function updateAnnotationUnarchive(request, sender, sendResponse) {
  const { id } = request.payload;
  await fb.updateAnnotationById(id, {
    createdTimestamp: new Date().getTime(),
    archived: false,
    events: fbUnion(editEvent(request.msg)),
  });
  broadcastAnnotationsUpdated('ELASTIC_CONTENT_UPDATED', id);
}

export async function deleteAnnotation(request, sender, sendResponse) {
  const { id } = request.payload;
  await fb
    .updateAnnotationById(id, {
      deletedTimestamp: new Date().getTime(),
      deleted: true,
      events: fbUnion(editEvent(request.msg)),
    })
    .then(function () {
      broadcastAnnotationsUpdated('ELASTIC_CONTENT_DELETED', id);
    });
}

export function unsubscribeAnnotations(request, sender, sendResponse) {
  if (typeof privateListener === 'function') privateListener();
  if (typeof publicListener === 'function') publicListener();
  if (typeof pinnedPrivateListener === 'function') pinnedPrivateListener();
  if (typeof pinnedPublicListener === 'function') pinnedPublicListener();
  if (typeof groupListener === 'function') groupListener();
}

export async function filterAnnotationsByTag(request, sender, sendResponse) {
  chrome.runtime.sendMessage({
    msg: 'FILTER_BY_TAG',
    from: 'background',
    payload: request.payload,
  });
}

export async function searchAnnotationsByTag(request, sender, sendResponse) {
  const { tag } = request.payload;
  if (!isContent(request) || tag === '') return;
  let annotationsWithTag = [];
  fb.getAnnotationsByTag(tag)
    .get()
    .then(function (doc) {
      if (!doc.empty)
        doc.docs.forEach(anno => {
          annotationsWithTag.push({ id: anno.id, ...anno.data() });
        });
      sendResponse({ annotations: annotationsWithTag });
    })
    .catch(function (error) {
      console.log('could not get doc: ', error);
    });
}

export function updateAnnotationsOnTabActivated(activeInfo) {
  if (activeInfo.url) {
    if (
      tabAnnotationCollect !== undefined &&
      containsObjectWithUrl(
        getPathFromUrl(activeInfo.url),
        tabAnnotationCollect
      )
    ) {
      const tabInfo = tabAnnotationCollect.filter(
        obj => obj.tabUrl === getPathFromUrl(activeInfo.url)
      );
      broadcastAnnotationsUpdatedTab('CONTENT_UPDATED', tabInfo[0].annotations);
    } else {
      chrome.tabs.get(activeInfo.tabId, tab => {
        let groups = [];
        chrome.storage.local.get(['groups'], result => {
          if (result.groups !== undefined) {
            groups = result.groups.map(g => g.gid);
          }
        });
        getAnnotationsByUrlListener(
          getPathFromUrl(activeInfo.url),
          groups,
          activeInfo.tabId
        );
        // getAllAnnotationsByUrlListener(getPathFromUrl(tab.url), tab.id);
        // getPrivateAnnotationsByUrlListener(getPathFromUrl(tab.url), tab.id);
      });
    }
  }
}

export function handleTabUpdate(url, tabId) {
  let groups = [];
  chrome.storage.local.get(['groups'], result => {
    if (result.groups !== undefined) {
      groups = result.groups.map(g => g.gid);
    }
  });
  // unsubscribeAnnotations();
  getAnnotationsByUrlListener(url, groups, tabId);
}

const fbUnion = content =>
  firebase.firestore.FieldValue.arrayUnion({ ...content });
const fbUnionNoSpread = content =>
  firebase.firestore.FieldValue.arrayUnion(content);
const safeSet = (val, alt = null) => (val !== undefined ? val : alt);
const getAuthor = () =>
  fb
    .getCurrentUser()
    .email.substring(0, fb.getCurrentUser().email.indexOf('@'));

const editEvent = (msg, data = {}, author = null, eventTime = null) => {
  if (!author) author = getAuthor();
  if (!eventTime) eventTime = new Date().getTime();
  let content = {
    timestamp: eventTime,
    user: author,
    event: msg,
  };
  if (msg === 'ANNOTATION_UPDATED') {
    content = {
      ...content,
      oldContent: data.content,
      oldType: data.type,
      oldTags: data.tags,
      oldGroups: data.groups,
      oldPrivate: data.isPrivate,
    };
  } else if (data !== {}) {
    content = {
      ...content,
      ...data,
    };
  }
  return Object.assign({}, content);
};

const _createReply = request => {
  const eventTime = new Date().getTime();
  const author = getAuthor();
  const {
    reply,
    replyTags,
    answer,
    question,
    replyId,
    xpath,
    anchor,
    hostname,
    url,
    offsets,
    adopted,
  } = request.payload;
  return Object.assign(
    {},
    {
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
      adopted: safeSet(adopted, null),
    }
  );
};

export function containsObjectWithUrl(url, list) {
  const test = list.filter(obj => obj.tabUrl === url);
  return test.length !== 0;
}

function updateList(list, url, annotations, isPrivate) {
  let obj = list.filter(obj => url === obj.tabUrl);
  let objToUpdate = obj[0];

  objToUpdate.annotations = annotations;
  let temp2 = list.filter(obj => obj.tabUrl !== url);
  temp2.push(objToUpdate);

  return temp2;
}

function getListFromSnapshots(snapshots) {
  let out = [];
  snapshots.forEach(snapshot => {
    out.push({
      id: snapshot.id,
      ...snapshot.data(),
    });
  });
  return out;
}

function getPinnedAnnotationsWrapper(type, typeFunc) {
  const user = fb.getCurrentUser();
  if (user !== null) {
    return typeFunc(user.uid).onSnapshot(annotationsSnapshot => {
      pinnedInner(annotationsSnapshot, type);
    });
  }
}

function pinnedInner(annotationsSnapshot, concatType) {
  let tempPinnedAnno = getListFromSnapshots(annotationsSnapshot);
  fb.getPhotoForAnnosFunction(tempPinnedAnno).then(response => {
    let tempPinnedAnno = JSON.parse(response.data).annotations;
    pinnedAnnotations = tempPinnedAnno.concat(
      concatType === 'private'
        ? publicPinnedAnnotations
        : privatePinnedAnnotations
    );
    concatType === 'private'
      ? (privatePinnedAnnotations = tempPinnedAnno)
      : (publicPinnedAnnotations = tempPinnedAnno);
    broadcastAnnotationsUpdated('PINNED_CHANGED', pinnedAnnotations);
  });
}

export const cleanUrl = url => {
  const parsedUrl = new URL(url);
  console.log('parsedUrl', parsedUrl, 'orig', url);
  const cleanHostname = parsedUrl.hostname.includes('www.')
    ? parsedUrl.hostname.split('www.')[1]
    : parsedUrl.hostname;
  return parsedUrl.protocol + '//' + cleanHostname;
};

export const filterUrl = url => {
  return (
    whiteList.includes(cleanUrl(url)) ||
    programmingLanguages.some(l => url.includes(l))
  );
};

export const handleHistory = historyRes => {
  //   console.log('history', historyRes);
  const urls = historyRes.map(h => h.url);
  const filteredUrls = urls.filter(u => filterUrl(u));
  console.log('filtered', filteredUrls);
  return filteredUrls;
};

export const zipCopyAndUrl = obj => {
  const { copyData, urls, ...other } = obj;
  let zipped = {};
  copyData.forEach(c => {
    zipped[c.url] = zipped[c.url]
      ? [...zipped[c.url], c.copyText]
      : [c.copyText];
  });
  return zipped;
};

export const handleCopyEvent = (request, sender, sendResponse) => {
  const { copy } = request.payload;
  console.log('copy!', copy);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
    const tabId = tab[0].id;
    const url = tab[0].url;
    console.log('query res', tabId, 'url', url);
    chrome.storage.local.get('search', res => {
      if (!res || Object.keys(res).length === 0) {
        return;
      }
      if (res['search'][tabId]) {
        const obj = res['search'][tabId];
        const copyInfo = { copyText: copy, url };
        chrome.storage.local.set({
          search: {
            ...res['search'],
            [tabId]: {
              ...obj,
              copyData: obj.copyData
                ? obj.copyData.concat(copyInfo)
                : [copyInfo],
            },
          },
        });
      } else {
        for (let key in res['search']) {
          if (res['search'][key].children.includes(tabId)) {
            const obj = res['search'][key];
            const copyInfo = { copyText: copy, url };
            chrome.storage.local.set({
              search: {
                ...res['search'],
                [key]: {
                  ...obj,
                  copyData: obj.copyData
                    ? obj.copyData.concat(copyInfo)
                    : [copyInfo],
                },
              },
            });
          }
        }
      }
    });
  });
};

const whiteList = [
  'https://stackoverflow.com',
  'https://github.com',
  'https://medium.com',
  'https://geeksforgeeks.com',
  'https://developer.mozilla.org',
];

const programmingLanguages = [
  'javascript',
  'js',
  'typescript',
  'ts',
  'react',
  'vue',
  'angular',
  'html',
  'css',
  'cplusplus',
  'java',
  'csharp',
];

function getAnnotationsByUrlListener(url, groups, tabId) {
  const user = fb.getCurrentUser();
  // idk if this is really where this should go lol...
  if (url === 'https://www.google.com/search') {
    // chrome.tabs.query({ active: true, })
    chrome.tabs.sendMessage(
      tabId,
      {
        msg: 'GOOGLE_SEARCH',
        from: 'background',
      },
      response => {
        console.log('???');
        if (response && response !== 'undefined') {
          chrome.storage.local.get('search', res => {
            let searchInfo;
            console.log('wtf', res);
            if (!res || Object.keys(res).length === 0) {
              console.log('making new obj');
              chrome.storage.local.set({
                search: {
                  [tabId]: {
                    startTime: new Date().getTime(),
                    search: [response],
                    children: [],
                  },
                },
              });
              return;
            } else if (res['search'][tabId]) {
              console.log('obj', res['search'][tabId]);
              //   console.log(
              //     'tabId exists - spread',
              //     ...res['search'][tabId],
              //     'search',
              //     [...res['search'][tabId].search, response]
              //   );
              searchInfo = {
                ...res['search'][tabId],
                search: res['search'][tabId].search.concat(response),
                // children: []
              };
            } else {
              for (let key in res['search']) {
                if (res['search'][key].children.includes(tabId)) {
                  console.log('breaking here??', res['search'][key]);
                  searchInfo = {
                    ...res['search'][key],
                    search: res['search'][key].search.concat(response),
                    // children: []
                  };
                }
              }
            }
            if (!searchInfo) {
              console.log('nothing');
              searchInfo = {
                startTime: new Date().getTime(),
                search: [response],
                children: [],
              };
            }
            // const searchInfo = res['search'][tabId]
            //   ? {
            //       ...res['search'][tabId],
            //       search: [...res['search'][tabId].search, response],
            //       children: []
            //     }
            //   : { startTime: new Date().getTime(), search: [response], children: [] };
            console.log('setting this in google search', {
              search: {
                ...res['search'],
                [tabId]: searchInfo,
              },
            });
            chrome.storage.local.set({
              search: {
                ...res['search'],
                [tabId]: searchInfo,
              },
            });
          });
          //     chrome.storage.local.set({
          //     'search' : {
          //     'search': response, 'tabId': tabId, urls: [], startTime: new Date().getTime()
          // }}

          // console.log('set', )
          // createSearchEvent({ id: uuidv4(), uid: user.uid, search: response, urls: [] })
        }
      }
    );
  }

  if (user !== null) {
    publicListener = fb
      .getAnnotationsByUrl(url)
      .onSnapshot(annotationsSnapshot => {
        let annotationsToBroadcast = getListFromSnapshots(annotationsSnapshot);
        annotationsToBroadcast = annotationsToBroadcast.filter(anno => {
          return (
            !anno.deleted &&
            anno.url.includes(url) &&
            (!(anno.isPrivate && anno.authorId !== user.uid) ||
              anno.groups.some(g => groups.includes(g)))
          );
        });

        fb.getPhotoForAnnosFunction(annotationsToBroadcast).then(response => {
          let annotationsToBroadcastWithAuthInfo = JSON.parse(
            response.data
          ).annotations;
          try {
            chrome.tabs.query({}, tabs => {
              const tabsWithUrl = tabs.filter(
                t => getPathFromUrl(t.url) === url
              );
              if (containsObjectWithUrl(url, tabAnnotationCollect)) {
                tabAnnotationCollect = updateList(
                  tabAnnotationCollect,
                  url,
                  annotationsToBroadcastWithAuthInfo,
                  false
                );
              } else {
                tabAnnotationCollect.push({
                  tabUrl: url,
                  annotations: annotationsToBroadcastWithAuthInfo,
                });
              }
              let newList = tabAnnotationCollect.filter(
                obj => obj.tabUrl === url
              );
              tabsWithUrl.forEach(t => {
                broadcastAnnotationsToTab(
                  'CONTENT_UPDATED',
                  newList[0].annotations,
                  url,
                  t.id
                );
              });
            });
          } catch (error) {
            console.error('tabs cannot be queried right now', error);
            if (
              error ===
              'Error: Tabs cannot be edited right now (user may be dragging a tab).'
            )
              setTimeout(() => getAnnotationsByUrlListener(url, groups));
          }
        });
      });
  }
}

function setLastUsedTags(tags) {
  chrome.storage.local.get(['lastUsedTags'], ({ lastUsedTags }) => {
    if (!lastUsedTags) {
      chrome.storage.local.set({ lastUsedTags: tags });
    } else {
      const newTags =
        lastUsedTags?.length <= 5
          ? [...new Set(lastUsedTags?.concat(tags))]
          : [...new Set(tags.concat(lastUsedTags?.splice(0, 5 - tags.length)))]; // this sucks
      chrome.storage.local.set({ lastUsedTags: newTags }, function () {
        if (chrome.runtime.lastError) {
          chrome.storage.local.clear();
        }
      });
    }
  });
}

function setLastUsedGroup(group) {
  chrome.storage.local.get(['lastGroup'], ({ lastGroup }) => {
    if (lastGroup !== group) {
      chrome.storage.local.set({ lastGroup: group }, function () {
        if (chrome.runtime.lastError) {
          chrome.storage.local.clear();
        }
      });
    }
    return;
  });
}
