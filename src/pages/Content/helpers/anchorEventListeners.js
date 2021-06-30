
// Transmitting messages to background and other parts of extension
import { transmitMessage } from './anchorEventTransmitter';
// Creating Annotations and anchors
import { addNewAnchor, createAnnotationCallback, } from './AnchorEngine/AnchorCreate';
// Changes to DOM
import { removeHighlightSpans, getHighlightSpanIds } from './AnchorEngine/AnchorDomChanges';

import {
    tempHighlight,
    highlightReplyRange,
    highlightAnnotation,
    highlightAnnotationDeep,

} from './AnchorEngine/AnchorHighlight';

import { updateXpaths, } from './AnchorEngine/AnchorDestroy';
import { findAllMatchingPhrases } from './AnchorEngine/AnchorHelpers';

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

function removeDuplicates(idArray) {
    const flags = new Set();
    const annotations = idArray.filter(highlight => {
        if (flags.has(highlight.id)) {
            return false;
        }
        flags.add(highlight.id);
        return true;
    });
    return annotations;
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
        // console.log("add new");
        addNewAnchor({ request: request, type: "child" });
    },
    'ADD_REPLY_ANCHOR': (request, sender, sendResponse) => {
        addNewAnchor({ request: request, type: "reply" });
    },
    'ADD_REPLY_HIGHLIGHT': async (request, sender, sendResponse) => {
        // console.log(request);
        // const octokit = new Octokit({ auth: });
        // let l = await octokit.request('GET /orgs/{org}/repos', {
        //     org: 'collective-sanity'
        // });
        // console.log(l);
        const { xpath, id } = request.payload;
        highlightReplyRange(xpath, id);
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
            // annotationsOnPage.reverse().forEach(anno => {
            //     //console.log(anno.id);
            //     if (!(ids.includes(anno.id.toString()))) {
            //         transmitMessage({ msg: "ANCHOR_BROKEN", data: { payload: { "id": anno.id } }, sentFrom: "AnchorHighlight" })
            //     }
            // });
        }
        // Ensure that nothing is unintentionally selected 
        let sel = window.getSelection();
        sel.removeAllRanges();
        let kv = [];
        document.querySelectorAll('.highlight-adamite-annotation').forEach(s => {
            kv.push({ id: s.getAttribute('name'), y: getPosition(s).y, x: getPosition(s).x })
        })
        kv = removeDuplicates(kv);
        // let spanNames = Array.from(document.querySelectorAll('.highlight-adamite-annotation')).map(s => s.getAttribute('name'));
        sendResponse({ spanNames: kv })
    },
    'ANNOTATE_ALL_INSTANCES': (request, sender, sendResponse) => {
        console.log('in here', request);
        const { anchorText } = request.payload;
        const phraseXPathPairs = findAllMatchingPhrases(anchorText);
        
        // get phrase to annotate from request,
        // send to findAllMatchingPhrases which should traverse the dom to find the phrase and return the node and phrase pairs
        // convert to XPath
        // send back to annotation to append as multiple anchors?
    },
    'ANNOTATION_FOCUS_ONCLICK': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        if (findSpan.length === 0) { console.log('len is 0?'); return; }
        window.scroll({ top: getPosition(findSpan[0]).y - window.innerHeight / 2, left: getPosition(findSpan[0]).x, behavior: 'smooth' });
    },
    'ANNOTATION_FOCUS': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        findSpan.forEach(e => e.style.backgroundColor = 'rgb(45, 350, 180, 0.4)');
    },
    'ANNOTATION_DEFOCUS': (request, sender, sendResponse) => {
        let findSpan = getSpanFromRequest(request);
        findSpan.forEach(e => e.style.backgroundColor = null)
    },
    'ANNOTATION_ADDED': (request, sender, sendResponse) => {
        //request.newAnno.content = request.newAnno.annotation;
        highlightAnnotationDeep(request.newAnno, request.newAnno.id)
    },
    'TEMP_ANNOTATION_ADDED': (request, sender, sendResponse) => {
        //  console.log(request);
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

// if (!chrome.runtime.onMessage.hasListeners()) {
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg in messagesIn) {
        messagesIn[request.msg](request, sender, sendResponse);
    }
    return true;
});
// }





