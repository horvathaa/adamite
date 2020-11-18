
//import './AnchorEngine/AnchorCreate';
import { updateXpaths, removeSpans, removeTempHighlight } from './AnchorEngine/AnchorDestroy';
import { tempHighlight, highlightRange, highlightReplyRange } from './AnchorEngine/AnchorHighlight';
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
        // console.log('in highlightr_annotations');
        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => {
                if (anno.xpath !== undefined && anno.xpath !== null) {
                    highlightRange(anno, anno.id)
                }
                if (anno.replies !== undefined && anno.replies.length) {
                    anno.replies.forEach(reply => {
                        if (reply.xpath !== undefined && reply.xpath !== null) {
                            highlightRange(reply, anno.id, reply.replyId);
                        }
                    })
                }
            });
        }
    }
    else if (request.msg === 'ADD_REPLY_HIGHLIGHT') {
        // console.log('doin it');
        const { xpath, id } = request.payload;
        highlightReplyRange(xpath, id);
    }
    else if (request.msg === 'REFRESH_HIGHLIGHTS') {
        // console.log('in refresh');
        var span = document.getElementsByClassName("highlight-adamite-annotation");

        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => {
                if (anno.xpath !== undefined && anno.xpath !== null) {
                    highlightRange(anno, anno.id)
                }
                if (anno.replies !== undefined && anno.replies.length) {
                    anno.replies.forEach(reply => {
                        if (reply.xpath !== undefined && reply.xpath !== null) {
                            highlightRange(reply, anno.id, reply.replyId);
                        }
                    })
                }
            });
        }
    }
    else if (request.msg === 'ANNOTATION_FOCUS_ONCLICK') {
        let findSpan;
        if (request.replyId !== undefined) {
            findSpan = document.getElementsByName(request.id + "-" + request.replyId);
        }
        else {
            findSpan = document.getElementsByName(request.id);
        }
        if (findSpan.length === 0) {
            console.log('len is 0?')
            return;
        }
        findSpan[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    else if (request.msg === 'ANNOTATION_FOCUS') {
        let findSpan;
        if (request.replyId !== undefined) {
            findSpan = document.getElementsByName(request.id + "-" + request.replyId);
        }
        else {
            findSpan = document.getElementsByName(request.id);
        }
        if (findSpan.length === 0) {
            return;
        }
        findSpan.forEach(e => e.style.backgroundColor = '#7cce7299');
    }
    else if (request.msg === 'ANNOTATION_DEFOCUS') {
        let findSpan;
        if (request.replyId !== undefined) {
            findSpan = document.getElementsByName(request.id + "-" + request.replyId);
        }
        else {
            findSpan = document.getElementsByName(request.id);
        }
        if (findSpan.length === 0) {
            return;
        }
        findSpan.forEach(e => e.style.backgroundColor = null)
    }
    else if (request.msg === 'ANNOTATION_ADDED') {
        request.newAnno.content = request.newAnno.annotation;
        highlightRange(request.newAnno);
    }
    else if (request.msg === 'TEMP_ANNOTATION_ADDED') {
        // request.newAnno.content = request.newAnno.annotation;
        tempHighlight(request.newAnno);
    }
    else if (request.msg === 'REMOVE_TEMP_ANNOTATION') {
        removeTempHighlight();
        sendResponse({ msg: 'REMOVED' });
    }
});
