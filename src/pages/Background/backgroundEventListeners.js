import { transmitMessage } from "./backgroundTransmitter";
import * as anno from "./helpers/annotationHelpers";
import * as authHelper from "./helpers/authHelper";

import { toggleSidebar } from './helpers/sidebarHelper';

const isContent = (res) => res.from === 'content';
const isModal = (res) => res.from === 'modal';
let clicked = false;



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

    'GET_ANNOTATIONS_PAGE_LOAD': anno.getAnnotationsPageLoad,
    'GET_ANNOTATION_BY_ID': anno.getAnnotationById,
    'GET_PINNED_ANNOTATIONS': anno.getPinnedAnnotations,
    'SET_UP_PIN': anno.setPinnedAnnotationListeners,

    'SAVE_ANNOTATED_TEXT': anno.createAnnotation,
    'SAVE_HIGHLIGHT': anno.createAnnotationHighlight,
    'ADD_NEW_REPLY': anno.createAnnotationReply,

    'ANNOTATION_UPDATED': anno.updateAnnotation,
    'REQUEST_ADOPTED_UPDATE': anno.updateAnnotationAdopted,
    'REQUEST_PIN_UPDATE': anno.updateAnnotationPinned,
    'UPDATE_QUESTION': anno.updateAnnotationQuestion,
    'FINISH_TODO': anno.updateAnnotationTodoFinished,
    'UPDATE_XPATH_BY_IDS': anno.updateAnnotationXPath,
    'UPDATE_REPLIES': anno.updateAnnotationReplies,
    'UPDATE_READ_COUNT': anno.updateAnnotationReadCount,
    'UNARCHIVE': anno.updateAnnotationUnarchive,

    'ANNOTATION_DELETED': anno.unsubscribeAnnotations,
    'UNSUBSCRIBE': anno.unsubscribeAnnotations,

    'REQUEST_TAB_INFO': (request, sender, sendResponse) => {
        const cleanUrl = getPathFromUrl(sender.tab.url);
        const tabId = sender.tab.id;
        sendResponse({ url: cleanUrl, tabId });
    },

    'LOAD_EXTERNAL_ANCHOR': (request, sender, sendResponse) => {
        chrome.tabs.create({ url: request.payload });
    },


    // 'FILTER_BY_TAG': () => { },
    // 'SEARCH_BY_TAG': async () => { },

    // 'HIDE_GROUP': () => { },
    // "DELETE_GROUP": () => { },
    // 'ADD_NEW_GROUP': () => { },
    // 'SHOW_GROUP': () => { },
    // 'GET_GROUPS_PAGE_LOAD': () => { },
    // 'GET_GROUP_ANNOTATIONS': () => { },

    // LOCAL COMMANDS
    'UPDATE_ANNOTATIONS_ON_TAB_ACTIVATED': anno.updateAnnotationsOnTabActivated,
    'HANDLE_BROWSER_ACTION_CLICK': () => {
        console.log('HANDLE_BROWSER_ACTION_CLICK');
        clicked = !clicked;
        toggleSidebar(clicked);
        if (clicked) {
            //anno.
        }
        else {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    msg: 'REMOVE_HIGHLIGHTS'
                })
            })
        }
    },
    'HANDLE_TAB_URL_UPDATE': (tabId, changeInfo, tab) => {
        if (changeInfo.url) { anno.handleTabUpdate(changeInfo.url); }
    },

    //sidebarHelper
    // 'REQUEST_SIDEBAR_STATUS': () => { },
    // 'REQUEST_TOGGLE_SIDEBAR': () => { },
    // 'USER_CHANGE_SIDEBAR_LOCATION': () => { },
    // 'USER_CHANGE_SIDEBAR_SHOULD_SHRINK_BODY': () => { },

    // elasticSearchWrapper
    // 'SEARCH_ELASTIC': () => { },
    // 'GROUP_ELASTIC': () => { },
    // 'SCROLL_ELASTIC': () => { },
    // "SEARCH_ELASTIC_BY_ID": () => { },
    // "REFRESH_FOR_CONTENT_UPDATED": () => { },
    // 'REMOVE_PAGINATION_SEARCH_CACHE': () => { },

};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    if (request.msg in commands) {
        commands[request.msg](request, sender, sendResponse);
    } else console.log("Unknown Command", request.message);
});


chrome.tabs.onActivated.addListener(function (activeInfo) {
    commands['HANDLE_BROWSER_ACTION_CLICK'](activeInfo);
});

chrome.browserAction.onClicked.addListener(function () {
    commands['UPDATE_ANNOTATIONS_ON_TAB_ACTIVATED']();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    commands['HANDLE_TAB_URL_UPDATE'](tabId, changeInfo, tab);
});


/*
    toggleSidebar(clicked);
    if (clicked) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            if (containsObjectWithId(tabs[0].id, tabAnnotationCollect)) {
                const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === tabs[0].id);
                chrome.tabs.sendMessage(tabs[0].id, {
                    msg: 'HIGHLIGHT_ANNOTATIONS',
                    payload: tabInfo[0].annotations,
                    url: tabs[0].url
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
     if (containsObjectWithId(activeInfo.tabId, tabAnnotationCollect)) {
        const tabInfo = tabAnnotationCollect.filter(obj => obj.tabId === activeInfo.tabId);
        broadcastAnnotationsUpdatedTab('CONTENT_UPDATED', tabInfo[0].annotations);
    }
    else {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            publicListener = setUpGetAllAnnotationsByUrlListener(tab.url, annotations, false);
            privateListener = promiseToComeBack(tab.url, annotations, false);
        });
    }
*/