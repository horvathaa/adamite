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
    'USER_SIGNINGOOGLE': authHelper.userGoogleSignIn,
    'USER_SIGNINGITHUB': authHelper.githubUserSignIn,
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
    'GET_GOOGLE_RESULT_ANNOTATIONS': anno.getGoogleResultAnnotations,

    'REQUEST_PIN_UPDATE': anno.updateAnnotationPinned,
    'UPDATE_QUESTION': anno.updateAnnotationQuestion,
    'UPDATE_ANNOTATIONS_ON_TAB_ACTIVATED': anno.updateAnnotationsOnTabActivated,
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

    'HANDLE_BROWSER_ACTION_CLICK': () => {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.storage.local.get(['sidebarStatus'], sidebarStatus => {
                    sidebarStatus = sidebarStatus.sidebarStatus;
                    sidebarStatus = sidebarStatus !== undefined && sidebarStatus.length ? sidebarStatus : [];
                    const index = sidebarStatus.length ? sidebarStatus.findIndex(side => side.id === tabs[0].id) : -1;
                    let opening;
                    if (index > -1) {
                        opening = false;
                        sidebarStatus = sidebarStatus.length ? sidebarStatus.filter(side => side.id !== tabs[0].id) : [];
                    }
                    else if (getPathFromUrl(tabs[0].url) !== "" && !getPathFromUrl(tabs[0].url).includes("chrome://")) {
                        opening = true;
                        sidebarStatus.push({ id: tabs[0].id, open: true, windowId: tabs[0].windowId })
                    }
                    toggleSidebar(opening);
                    chrome.storage.local.set({ sidebarStatus }, function () {
                        if (chrome.runtime.lastError) {
                            chrome.storage.local.clear();
                        }
                    })
                    if (opening) {
                        chrome.storage.local.get(['annotateOnly'], (annotateOnly) => {
                            if(annotateOnly) {
                                chrome.storage.local.set({
                                    'annotateOnly': false
                                }, function () {
                                    if (chrome.runtime.lastError) {
                                        chrome.storage.local.clear();
                                    }
                                })
                                chrome.contextMenus.update('contextMenuBadge', {
                                    'checked': false
                                })
                            } // maybe have highlight and sorting as else clause since, in theory, annos should already be highlighted??
                        })
                        
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
                        anno.getAnnotationsPageLoad({url: tabs[0].url});
                    }
                    else {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            msg: 'REMOVE_HIGHLIGHTS'
                        })
                        anno.unsubscribeAnnotations();
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
        }
    },
    'HANDLE_TAB_REMOVED': (tab) => {
        anno.unsubscribeAnnotations();
        chrome.storage.local.get(['sidebarStatus'], sidebarStatus => {
            sidebarStatus = sidebarStatus.sidebarStatus;
            const newSidebarStatus = sidebarStatus !== undefined && sidebarStatus.length ? sidebarStatus.filter(side => side.id !== tab) : [];
                chrome.storage.local.set({ sidebarStatus: newSidebarStatus }, function () {
                    if (chrome.runtime.lastError) {
                        chrome.storage.local.clear();
                    }
                })
            
        })
    },

    'HANDLE_WINDOW_REMOVED' : (windowId) => {
        anno.unsubscribeAnnotations();
        chrome.storage.local.get(['sidebarStatus'], sidebarStatus => {
            sidebarStatus = sidebarStatus.sidebarStatus;
            sidebarStatus = sidebarStatus !== undefined && sidebarStatus.length ? sidebarStatus.filter(s => s.windowId !== windowId) : [];
            chrome.storage.local.set({ sidebarStatus }, function () {
                if (chrome.runtime.lastError) {
                    chrome.storage.local.clear();
                }
            })
        })
        
    },
    'HANDLE_CONTEXT_MENU_CLICK': (info) => {
        const { checked } = info;
        chrome.storage.local.set({
            'annotateOnly': checked
        });
        // close sidebar and begin quick operating mode
        if(checked) {
            toggleSidebar(false);
            chrome.storage.local.set({ sidebarStatus: [] });
            chrome.tabs.query({ active: true, currentWindow: true}, tabs => {
                const tabInfo = anno.tabAnnotationCollect.filter(obj => obj.tabUrl === getPathFromUrl(tabs[0].url));
                chrome.tabs.sendMessage(tabs[0].id, {
                    msg: 'HIGHLIGHT_ANNOTATIONS',
                    payload: tabInfo[0].annotations,
                    url: getPathFromUrl(tabs[0].url)
                })
            })
        }
        // when done with this mode, remove any highlights
        else {
            chrome.tabs.query({ active: true, currentWindow: true}, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    msg: 'REMOVE_HIGHLIGHTS'
                })
            })
            anno.unsubscribeAnnotations(); 
        }
    },
    'CREATE_CONTEXT_MENU':() => {
        const contextMenuOptions = {
            'type': 'checkbox',
            'checked': false,
            'title': 'Run In Annotate-Only Mode',
            'contexts': ['browser_action'],
            'id': "contextMenuBadge"
        }
        const id = chrome.contextMenus.create(contextMenuOptions, () => {
            if(authHelper.getUser() != null) {
                chrome.storage.local.set({
                    'annotateOnly': false
                })
            } else {
                chrome.contextMenus.update('contextMenuBadge', {
                    'enabled': false
                })
            }
            
        });
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

chrome.contextMenus.onClicked.addListener((info) => {
    commands['HANDLE_CONTEXT_MENU_CLICK'](info);
    return true;
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    console.log('changeInfo', changeInfo);
    commands['HANDLE_TAB_URL_UPDATE'](tabId, changeInfo, tab);
    return true;
});

chrome.tabs.onRemoved.addListener(function (tab) {
    commands['HANDLE_TAB_REMOVED'](tab);
    return true;
});

chrome.windows.onRemoved.addListener(function (tab) {
    commands['HANDLE_WINDOW_REMOVED'](tab);
    return true;
});

chrome.runtime.onInstalled.addListener(function() {
    commands['CREATE_CONTEXT_MENU']();
    return true;
  });

chrome.runtime.onSuspend.addListener(function () {
    console.log('legit... does this ever get called........');
    chrome.contextMenus.remove('contextMenuBadge');
    anno.unsubscribeAnnotations();
    // chrome.runtime.Port.disconnect();
})