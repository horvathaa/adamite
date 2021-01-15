



function sendMsg(msg, data, responseCallback, currentTab) {
    try {
        if (!currentTab) {
            if (responseCallback !== undefined && responseCallback !== null)
                chrome.runtime.sendMessage({ msg: msg, from: 'background', ...data }, responseCallback);
            else
                chrome.runtime.sendMessage({ msg: msg, from: 'background', ...data });

        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs !== undefined && tabs.length) {
                    chrome.tabs.sendMessage(
                        tabs[0].id, { msg: msg, tabId: tabs[0].id, from: 'background', ...data }
                    );
                }
                else {
                    // console.log('no active window');
                }
            });
        }
    } catch (e) { console.log("Chrome runtime Issue at SendMsg") }
}


let messagesOut = [
    //sidebarHelper
    'TOGGLE_SIDEBAR',
    'UPDATE_SIDEBAR_ON_LEFT_STATUS',
    'UPDATE_SHOULD_SHRINK_BODY_STATUS',
    // authHelper
    'USER_AUTH_STATUS_CHANGED',
    //background
    'CONTENT_UPDATED',
    'CONTENT_SELECTED',
    'CONTENT_NOT_SELECTED',
    'SHOW_GROUP',
    'HIDE_GROUP',
    "GROUPS_UPDATED",
    'GROUP_DELETE_SUCCESS',
    'GROUP_CREATE_SUCCESS',
    'CREATE_GROUP',
    'REMOVE_HIGHLIGHTS',
    'HIGHLIGHT_ANNOTATIONS',
    "CONTENT_UPDATED",
    "PINNED_CHANGED"
]


export function transmitMessage({ msg, data, sentFrom, responseCallback = null, currentTab = false }) {
    //  console.log(msg);
    if (messagesOut.includes(msg)) sendMsg(msg, data, responseCallback, currentTab);
    else console.log("ERR");
}

export function transmitUpdateAnnotationMessage({ msg, newAnnotations }) {
    transmitMessage({ msg: msg, data: { "payload": newAnnotations } })
}

