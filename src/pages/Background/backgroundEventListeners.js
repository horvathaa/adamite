import { transmitMessage } from "./backgroundTransmitter";
import * as anno from "./helpers/annotationHelpers";
import * as authHelper from "./helpers/authHelper";
import * as groups from './helpers/groupAnnotationsHelper';
import * as sidebar from './helpers/sidebarHelper';
import * as elastic from './helpers/elasticSearchWrapper';
import { toggleSidebar } from './helpers/sidebarHelper';

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
export function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
}

const isContent = (res) => res.from === 'content';
export let sidebarStatus = [];

let commands = {
    //authHelper
    'GET_CURRENT_USER': authHelper.getCurrentUser,
    'USER_SIGNUP': authHelper.userSignUp,
    'USER_SIGNIN': authHelper.userSignIn,
    'USER_SIGNOUT': authHelper.userSignOut,
    'USER_FORGET_PWD': authHelper.userForgotPwd,
    //background
    'CONTENT_SELECTED': (request, sender, sendResponse) =>
        isContent(request) ? transmitMessage({
            msg: 'CONTENT_SELECTED',
            data: { "senderId": sender.tab.id, "payload": request.payload, },
            currentTab: true
        }) : false,
    'CONTENT_NOT_SELECTED': (request, sender, sendResponse) =>
        isContent(request) ? transmitMessage({
            msg: 'CONTENT_NOT_SELECTED',
            data: { "senderId": sender.tab.id, "payload": request.payload, },
            currentTab: true
        }) : false,

    // ANNOTATION HELPERS
    'GET_ANNOTATIONS_PAGE_LOAD': anno.getAnnotationsPageLoad,
    'GET_ANNOTATION_BY_ID': anno.getAnnotationById,
    'GET_PINNED_ANNOTATIONS': anno.getPinnedAnnotations,
    'SET_UP_PIN': anno.setPinnedAnnotationListeners,

    //'SAVE_ANNOTATED_TEXT': anno.createAnnotation,
    'CREATE_ANNOTATION': anno.createAnnotation,
    //  'SAVE_HIGHLIGHT': anno.createAnnotation,
    'ADD_NEW_REPLY': anno.createAnnotationReply,
    'SAVE_NEW_ANCHOR': anno.createAnnotation,
    // anno.createAnnotationChildAnchor,
    // 'SAVE_NEW_ANCHOR': anno.createAnnotationChildAnchor,

    'ANNOTATION_UPDATED': anno.updateAnnotation,
    'REQUEST_ADOPTED_UPDATE': anno.updateAnnotationAdopted,

    'REQUEST_PIN_UPDATE': anno.updateAnnotationPinned,
    'UPDATE_QUESTION': anno.updateAnnotationQuestion,
    'FINISH_TODO': anno.updateAnnotationTodoFinished,
    'UPDATE_XPATH_BY_IDS': anno.updateAnnotationXPath,
    'UPDATE_REPLIES': anno.updateAnnotationReplies,
    'UPDATE_READ_COUNT': anno.updateAnnotationReadCount,
    'UNARCHIVE': anno.updateAnnotationUnarchive,
    'GET_GROUP_ANNOTATIONS': anno.getGroupAnnotations,

    'FILTER_BY_TAG': anno.filterAnnotationsByTag,
    'SEARCH_BY_TAG': anno.searchAnnotationsByTag,

    'ANNOTATION_DELETED': anno.deleteAnnotation,
    'UNSUBSCRIBE': anno.unsubscribeAnnotations,

    'REQUEST_TAB_INFO': (request, sender, sendResponse) => {
        const cleanUrl = getPathFromUrl(sender.tab.url);
        const tabId = sender.tab.id;
        sendResponse({ url: cleanUrl, tabId });
    },

    'LOAD_EXTERNAL_ANCHOR': async (request, sender, sendResponse) => {
        await chrome.tabs.create({ url: request.payload });
    },



    // GROUP HELPERS
    'SHOW_GROUP': groups.showGroup,
    'HIDE_GROUP': groups.hideGroup,
    "DELETE_GROUP": groups.deleteGroup,
    'ADD_NEW_GROUP': groups.createGroup,
    'GET_GROUPS_PAGE_LOAD': groups.getGroups,

    // LOCAL COMMANDS
    'UPDATE_ANNOTATIONS_ON_TAB_ACTIVATED': anno.updateAnnotationsOnTabActivated,
    'HANDLE_BROWSER_ACTION_CLICK': () => {
        try {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                chrome.storage.local.get(['sidebarStatus'], sidebarStatus => {
                    sidebarStatus = sidebarStatus.sidebarStatus;
                    const index = sidebarStatus !== undefined && sidebarStatus.length ? sidebarStatus.findIndex(side => side.id === tabs[0].id) : -1;
                    sidebarStatus = sidebarStatus === undefined || Object.keys(sidebarStatus).length === 0 ? [] : sidebarStatus;
                    // console.log('what is sidebarstatus lol', sidebarStatus)
                    let opening;
                    if (index > -1) {
                        opening = !sidebarStatus[index].open;
                        sidebarStatus[index].open = opening;
                    }
                    else if (getPathFromUrl(tabs[0].url) !== "" && !getPathFromUrl(tabs[0].url).includes("chrome://")) {
                        sidebarStatus.push({ id: tabs[0].id, open: true, url: getPathFromUrl(tabs[0].url) })
                        opening = true;
                    }
                    toggleSidebar(opening);
                    chrome.storage.local.set({ sidebarStatus }, function () {
                        if (chrome.runtime.lastError) {
                            chrome.storage.local.clear();
                        }
                    })
                    if (opening) {
                        if (anno.containsObjectWithUrl(getPathFromUrl(tabs[0].url), anno.tabAnnotationCollect)) {
                            const tabInfo = anno.tabAnnotationCollect.filter(obj => obj.tabUrl === getPathFromUrl(tabs[0].url));
                            chrome.tabs.sendMessage(tabs[0].id, {
                                msg: 'HIGHLIGHT_ANNOTATIONS',
                                payload: tabInfo[0].annotations,
                                url: getPathFromUrl(tabs[0].url)
                            }, response => {
                                chrome.runtime.sendMessage({
                                    msg: 'SORT_LIST',
                                    from: 'background',
                                    payload: response
                                })
                            })
                        }
                    }
                    else {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            msg: 'REMOVE_HIGHLIGHTS'
                        })
                    }
                })
            })
        }
        catch (error) {
            console.error('couldnt query tabs', error);
        }

    },
    'HANDLE_TAB_URL_UPDATE': (tabId, changeInfo, tab) => {
        if ("url" in changeInfo) {
            anno.handleTabUpdate(getPathFromUrl(changeInfo.url), tabId);
            chrome.storage.local.get(['sidebarStatus'], sidebarStatus => {
                // console.log('what is sidebarstatus lol', sidebarStatus)
                sidebarStatus = sidebarStatus.sidebarStatus;
                sidebarStatus = sidebarStatus === undefined || Object.keys(sidebarStatus).length === 0 ? [] : sidebarStatus;
                const index = sidebarStatus.length ? sidebarStatus.findIndex(side => side.id === tabId) : -1;

                if (index === -1 && getPathFromUrl(changeInfo.url) !== "" && !getPathFromUrl(changeInfo.url).includes("chrome://")) {
                    sidebarStatus.push({ id: tabId, open: false, url: getPathFromUrl(changeInfo.url) })
                }
                else if (index > -1 && sidebarStatus[index].url !== getPathFromUrl(changeInfo.url) && !getPathFromUrl(changeInfo.url).includes("chrome://")) {
                    sidebarStatus[index].open = false;
                    toggleSidebar(false);
                }
                else if (index > -1) {
                    toggleSidebar(sidebarStatus[index].open)
                }
                else {
                    return;
                }
                chrome.storage.local.set({ sidebarStatus }, function () {
                    if (chrome.runtime.lastError) {
                        chrome.storage.local.clear();
                    }
                })
            })

        }
    },
    'HANDLE_TAB_REMOVED': (tab) => {
        chrome.storage.local.get(['sidebarStatus'], sidebarStatus => {
            // console.log('what is sidebarstatus lol', sidebarStatus)
            sidebarStatus = sidebarStatus.sidebarStatus;
            const newSidebarStatus = sidebarStatus.length ? sidebarStatus.filter(side => side.id !== tab) : -1;
            chrome.storage.local.set({ sidebarStatus: newSidebarStatus }, function () {
                if (chrome.runtime.lastError) {
                    chrome.storage.local.clear();
                }
            })
        })
    },

    'HANDLE_TAB_CREATED': (tab) => {
        if (getPathFromUrl(tab.url) !== "" && !getPathFromUrl(tab.url).includes("chrome://")) {
            chrome.storage.local.get(['sidebarStatus'], sidebarStatus => {
                // console.log('what is sidebarstatus lol', sidebarStatus)
                sidebarStatus = sidebarStatus.sidebarStatus;
                sidebarStatus = sidebarStatus === undefined || Object.keys(sidebarStatus).length === 0 ? [] : sidebarStatus;
                sidebarStatus.push({ id: tab.id, open: false, url: getPathFromUrl(tab.url) });
                chrome.storage.local.set({ sidebarStatus }, function () {
                    if (chrome.runtime.lastError) {
                        chrome.storage.local.clear();
                    }
                })
            })

        }
    },



    //sidebarHelper
    'REQUEST_SIDEBAR_STATUS': sidebar.requestSidebarStatus,
    'REQUEST_TOGGLE_SIDEBAR': sidebar.requestToggleSidebar,
    'USER_CHANGE_SIDEBAR_LOCATION': sidebar.userChangeSidebarLocation,
    'USER_CHANGE_SIDEBAR_SHOULD_SHRINK_BODY': sidebar.userChangeSidebarShouldShrink,

    // elasticSearchWrapper
    'SEARCH_ELASTIC': elastic.searchElastic,
    'GROUP_ELASTIC': elastic.groupElastic,
    'SCROLL_ELASTIC': elastic.scrollElastic,
    "SEARCH_ELASTIC_BY_ID": elastic.searchElasticById,
    "REFRESH_FOR_CONTENT_UPDATED": elastic.refreshContentUpdate,
    'REMOVE_PAGINATION_SEARCH_CACHE': elastic.removePaginationSearchCache,

};

if (!chrome.runtime.onMessage.hasListeners()) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.msg in commands) {
            commands[request.msg](request, sender, sendResponse);
        } else {
            // console.log("Unknown Command", request.msg);
        }
        return true;
    });
}



chrome.tabs.onActivated.addListener(function (activeInfo) {
    commands['UPDATE_ANNOTATIONS_ON_TAB_ACTIVATED'](activeInfo);
    return true;
});

chrome.browserAction.onClicked.addListener(function () {
    commands['HANDLE_BROWSER_ACTION_CLICK']();
    return true;
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    commands['HANDLE_TAB_URL_UPDATE'](tabId, changeInfo, tab);
    return true;
});

chrome.tabs.onCreated.addListener(function (tab) {
    commands['HANDLE_TAB_CREATED'](tab);
    return true;
});

chrome.tabs.onRemoved.addListener(function (tab) {
    commands['HANDLE_TAB_REMOVED'](tab);
    return true;
});

// chrome.runtime.onSuspend.addListener(function () {
//     anno.unsubscribeAnnotations();
//     chrome.runtime.Port.disconnect();
// })