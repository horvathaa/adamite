
//import './AnchorEngine/AnchorCreate';
import { updateXpaths, removeSpans } from './AnchorEngine/AnchorDestroy';
import { highlightRange } from './AnchorEngine/AnchorHighlight';
import { createAnnotation, removeAnnotationWidget } from './AnchorEngine/AnchorCreate';


// chrome.runtime.sendMessage(
//     {
//         msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
//         payload: {
//             url: window.location.href,
//         },
//     },
//     data => {
//         const { annotationsOnPage } = data;
//         if (annotationsOnPage.length) {
//             annotationsOnPage.reverse().forEach(anno => highlightRange(anno));
//         }
//     }
// );

document.addEventListener('mouseup', event => {
    createAnnotation(event);
});

document.addEventListener('mousedown', event => {
    removeAnnotationWidget(event);
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.msg === 'ANNOTATION_DELETED_ON_PAGE') {
        let collection = document.getElementsByName(request.id);
        updateXpaths(collection, request.id)
    }
    else if (request.msg === 'HIGHLIGHT_ANNOTATIONS') {
        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => highlightRange(anno));
        }
    }
    else if (request.msg === 'REFRESH_HIGHLIGHTS') {
        var span = document.getElementsByClassName("highlight-adamite-annotation");
        removeSpans(span);
        console.log("in here", request)
        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => highlightRange(anno));
        }
    }
    else if (request.msg === 'ANNOTATION_FOCUS_ONCLICK') {
        var findSpan = document.getElementsByName(request.id);
        if (findSpan.length === 0) {
            return;
        }
        findSpan[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    else if (request.msg === 'ANNOTATION_FOCUS') {
        var findSpan = document.getElementsByName(request.id);
        if (findSpan.length === 0) {
            return;
        }
        findSpan.forEach(e => e.style.backgroundColor = '#7cce7299');
    }
    else if (request.msg === 'ANNOTATION_DEFOCUS') {
        var findSpan = document.getElementsByName(request.id);
        if (findSpan.length === 0) {
            return;
        }
        findSpan.forEach(e => e.style.backgroundColor = null)
    }
    else if (request.msg === 'ANNOTATION_ADDED') {
        request.newAnno.content = request.newAnno.annotation;
        highlightRange(request.newAnno);
    }

    else if (request.msg === 'DELIVER_FILTERED_ANNOTATION_TAG' && request.from === 'background') {
        window.postMessage({ type: 'FROM_CONTENT', value: request.payload.response }, "*");
    }

});
