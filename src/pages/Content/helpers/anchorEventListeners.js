
// Transmitting messages to background and other parts of extension
import { transmitMessage } from './anchorEventTransmitter';
// Creating Annotations and anchors
import { addNewAnchor, createAnnotationCallback, } from './AnchorEngine/AnchorCreate';
// Changes to DOM
import { removeHighlights, removeTempHighlight } from './AnchorEngine/AnchorDomChanges';

import {
    tempHighlight,
    highlightReplyRange,
    highlightAnnotation,
    highlightAnnotationDeep
} from './AnchorEngine/AnchorHighlight';

import { updateXpaths, } from './AnchorEngine/AnchorDestroy';


document.addEventListener('mouseup', event => {
    transmitMessage({
        msg: 'REQUEST_SIDEBAR_STATUS',
        responseCallback: (response) => createAnnotationCallback(response, event),
        sentFrom: "anchorEventListener"
    });
    //createAnnotation(event);
});

document.addEventListener('mousedown', event => {
    transmitMessage({
        msg: 'CONTENT_NOT_SELECTED',
        sentFrom: "anchorEventListener"
    });//removeAnnotationWidget(event);
});
let messagesIn = {
    'ANNOTATION_DELETED_ON_PAGE': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        updateXpaths(findSpan, request.id)
    },
    'ADD_NEW_ANCHOR': (request, sender, sendResponse) => {
        addNewAnchor({ request: request, type: "child" });
    },
    'ADD_REPLY_ANCHOR': (request, sender, sendResponse) => {
        addNewAnchor({ request: request, type: "reply" });
    },
    'ADD_REPLY_HIGHLIGHT': (request, sender, sendResponse) => {
        console.log(request);
        const { xpath, id } = request.payload;
        highlightReplyRange(xpath, id);
    },
    'HIGHLIGHT_ANNOTATIONS': async (request, sender, sendResponse) => {
        console.log('Highlight Annotations');
        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => {
                highlightAnnotationDeep(anno);
            });
        }
    },
    'ANNOTATION_FOCUS_ONCLICK': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        if (findSpan.length === 0) { console.log('len is 0?'); return; }
        findSpan[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    'ANNOTATION_FOCUS': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        findSpan.forEach(e => e.style.backgroundColor = '#7cce7299');
    },
    'ANNOTATION_DEFOCUS': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        findSpan.forEach(e => e.style.backgroundColor = null)
    },
    'ANNOTATION_ADDED': (request, sender, sendResponse) => {
        request.newAnno.content = request.newAnno.annotation;
        highlightAnnotation(request.newAnno, request.newAnno.id)
    },
    'TEMP_ANNOTATION_ADDED': (request, sender, sendResponse) => {
        console.log(request);
        tempHighlight(request.newAnno);
    },
    'REMOVE_TEMP_ANNOTATION': (request, sender, sendResponse) => {
        removeTempHighlight();
        sendResponse({ msg: 'REMOVED' });
    },
    'REMOVE_HIGHLIGHTS': (request, sender, sendResponse) => {
        removeHighlights();
    },
}
//

function getSpanFromRequest(request) {
    return (request.replyId !== undefined) ?
        document.getElementsByName(request.id + "-" + request.replyId.toString()) :
        document.getElementsByName(request.id.toString());

}
async function getCurrentUrl() {
    // var getting = windows.getCurrent({ populate: true });
    // getting.then(logTabs, onError);
    await chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var tab = tabs[0];
        return tab.url;
    })
}

function logTabs(windowInfo) {
    for (let tabInfo of windowInfo.tabs) {
        console.log(tabInfo.url);
    }
}

function onError(error) {
    console.log(`Error: ${error}`);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request);
    if (request.msg in messagesIn) {
        messagesIn[request.msg](request, sender, sendResponse);
    }
});




