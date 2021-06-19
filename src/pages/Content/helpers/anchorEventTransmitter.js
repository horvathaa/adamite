


function sendMsg(msg, data, responseCallback) {
    try {
        if (responseCallback !== undefined && responseCallback !== null) {
            chrome.runtime.sendMessage({
                msg: msg,
                from: 'content',
                ...data
            }, responseCallback);
        }
        else {
            chrome.runtime.sendMessage({
                msg: msg,
                from: 'content',
                ...data
            });
        }
    } catch (e) {
        console.log("Chrome runtime Issue at SendMsg")
    }
}


let messagesOut = {
    'ANCHOR_BROKEN': (data, responseCallback) => sendMsg('ANCHOR_BROKEN', data, responseCallback),
    'ANCHOR_CLICKED': (data, responseCallback) => sendMsg('ANCHOR_CLICKED', data, responseCallback),
    'ANCHOR_HOVERED': (data, responseCallback) => sendMsg('ANCHOR_HOVERED', data, responseCallback),
    'ANCHOR_UNHOVERED': (data, responseCallback) => sendMsg('ANCHOR_UNHOVERED', data, responseCallback),
    //Create
    'CONTENT_SELECTED': (data, responseCallback) => sendMsg('CONTENT_SELECTED', data, responseCallback),
    'CONTENT_NOT_SELECTED': (data, responseCallback) => sendMsg('CONTENT_NOT_SELECTED', data, responseCallback),
    'REQUEST_SIDEBAR_STATUS': (data, responseCallback) => sendMsg('REQUEST_SIDEBAR_STATUS', data, responseCallback),
    'SAVE_HIGHLIGHT': (data, responseCallback) => sendMsg('SAVE_HIGHLIGHT', data, responseCallback),
    'CREATE_ANNOTATION': (data, responseCallback) => sendMsg('CREATE_ANNOTATION', data, responseCallback),
    'TRANSMIT_REPLY_ANCHOR': (data, responseCallback) => sendMsg('TRANSMIT_REPLY_ANCHOR', data, responseCallback),
    'SAVE_NEW_ANCHOR': (data, responseCallback) => sendMsg('SAVE_NEW_ANCHOR', data, responseCallback),
    'ANNOTATION_UPDATED': (data, responseCallback) => sendMsg('ANNOTATION_UPDATED', data, responseCallback),
    'UPDATE_XPATH_BY_IDS': (data, responseCallback) => sendMsg('UPDATE_XPATH_BY_IDS', data, responseCallback),
}


export function transmitMessage({ msg, data, sentFrom, responseCallback = null }) {

    if (msg in messagesOut) {
        // console.log(msg);
        messagesOut[msg](data, responseCallback);
    } else {
        // console.log("ERR");
    }
}