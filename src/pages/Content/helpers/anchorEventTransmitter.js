


function sendMsg(msg, data, responseCallback) {
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
}


let messagesOut = {
    'ANCHOR_BROKEN': (data, responseCallback) => sendMsg('ANCHOR_BROKEN', data, responseCallback),
    'ANCHOR_CLICKED': (data, responseCallback) => sendMsg('ANCHOR_CLICKED', data, responseCallback),
    //Create
    'CONTENT_SELECTED': (data, responseCallback) => sendMsg('CONTENT_SELECTED', data, responseCallback),
    'CONTENT_NOT_SELECTED': (data, responseCallback) => sendMsg('CONTENT_NOT_SELECTED', data, responseCallback),
    'REQUEST_SIDEBAR_STATUS': (data, responseCallback) => sendMsg('REQUEST_SIDEBAR_STATUS', data, responseCallback),
    'SAVE_HIGHLIGHT': (data, responseCallback) => sendMsg('SAVE_HIGHLIGHT', data, responseCallback),
    'TRANSMIT_REPLY_ANCHOR': (data, responseCallback) => sendMsg('TRANSMIT_REPLY_ANCHOR', data, responseCallback),
    'SAVE_NEW_ANCHOR': (data, responseCallback) => sendMsg('SAVE_NEW_ANCHOR', data, responseCallback),
    'UPDATE_XPATH_BY_IDS': (data, responseCallback) => sendMsg('UPDATE_XPATH_BY_IDS', data, responseCallback),
}


export function transmitMessage({ msg, data, sentFrom, responseCallback = null }) {
    console.log(msg);
    if (msg in messagesOut) {
        messagesOut[msg](data, responseCallback);
    } else {
        console.log("ERR");
    }
}