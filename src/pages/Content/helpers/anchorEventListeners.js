
// Transmitting messages to background and other parts of extension
import { transmitMessage } from './anchorEventTransmitter';
// Creating Annotations and anchors
import { addNewAnchor, createAnnotationCallback, } from './AnchorEngine/AnchorCreate';
// Changes to DOM
import { removeHighlightSpans, getHighlightSpanIds } from './AnchorEngine/AnchorDomChanges';
//import { Octokit } from "@octokit/core";
import {
    tempHighlight,
    highlightReplyRange,
    highlightAnnotation,
    highlightAnnotationDeep,

} from './AnchorEngine/AnchorHighlight';

import { updateXpaths, } from './AnchorEngine/AnchorDestroy';

// from: https://stackoverflow.com/questions/11805955/how-to-get-the-distance-from-the-top-for-an-element
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while (element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
}

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
    'ADD_REPLY_HIGHLIGHT': async (request, sender, sendResponse) => {
        console.log(request);
        // const octokit = new Octokit({ auth: });
        // let l = await octokit.request('GET /orgs/{org}/repos', {
        //     org: 'collective-sanity'
        // });
        // console.log(l);
        const { xpath, id } = request.payload;
        highlightReplyRange(xpath, id);

        // await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
        //     owner: 'octocat',
        //     repo: 'hello-world',
        //     issue_number: 42,
        //     body: 'body'
        // })
    },
    'HIGHLIGHT_ANNOTATIONS': (request, sender, sendResponse) => {
        // removeHighlightSpans({ isPreview: false });
        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => {
                highlightAnnotationDeep(anno);
            });
            let ids = getHighlightSpanIds({ isPreview: false });
            //console.log(ids);
            annotationsOnPage.reverse().forEach(anno => {
                //console.log(anno.id);
                if (!(ids.includes(anno.id.toString()))) {
                    transmitMessage({ msg: "ANCHOR_BROKEN", data: { payload: { "id": anno.id } }, sentFrom: "AnchorHighlight" })
                }
            });
        }
        // Ensure that nothing is unintentionally selected 
        let sel = window.getSelection();
        sel.removeAllRanges();
        let spanNames = Array.from(document.querySelectorAll('.highlight-adamite-annotation')).map(s => s.getAttribute('name'));
        sendResponse({ spanNames })
    },
    'ANNOTATION_FOCUS_ONCLICK': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        if (findSpan.length === 0) { console.log('len is 0?'); return; }
        window.scroll({ top: getPosition(findSpan[0]).y - window.innerHeight / 2, left: getPosition(findSpan[0]).x, behavior: 'smooth' })
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
        removeHighlightSpans({ isPreview: true });
        sendResponse({ msg: 'REMOVED' });
    },
    'REMOVE_HIGHLIGHTS': (request, sender, sendResponse) => {
        removeHighlightSpans({ isPreview: false });
    },
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




