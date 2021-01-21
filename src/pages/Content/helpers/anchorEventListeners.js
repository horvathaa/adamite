
// Transmitting messages to background and other parts of extension
import { transmitMessage } from './anchorEventTransmitter';
// Creating Annotations and anchors
import { addNewAnchor, createAnnotationCallback, } from './AnchorEngine/AnchorCreate';
// Changes to DOM
import { removeHighlightSpans, removeTempHighlight } from './AnchorEngine/AnchorDomChanges';

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
    'HIGHLIGHT_ANNOTATIONS': (request, sender, sendResponse) => {
        removeHighlightSpans();
        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => {
                highlightAnnotationDeep(anno);
            });
        }
        let spanNames = Array.from(document.querySelectorAll('.highlight-adamite-annotation')).map(s => s.getAttribute('name'));
        sendResponse({ spanNames })
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
        removeHighlightSpans();
    }
    // ,
    // 'REQUEST_SPAN_LIST': (request, sender, sendResponse) => {
    //     console.log('got message req-span');
    //     let spans = document.querySelectorAll('.highlight-adamite-annotation');
    //     console.log('spans', spans);
    //     let spanNames = Array.from(spans).map(s => {
    //         console.log(s.getAttribute('name'));
    //         return s.getAttribute('name');
    //     });
    //     console.log('span names', spanNames, spans);
    //     sendResponse({ response: spanNames })
    // }
}


function getSpanFromRequest(request) {
    return (request.replyId !== undefined) ?
        document.getElementsByName(request.id + "-" + request.replyId.toString()) :
        document.getElementsByName(request.id.toString());

}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log(request);
    if (request.msg in messagesIn) {
        messagesIn[request.msg](request, sender, sendResponse);
    }
    return true;
});




