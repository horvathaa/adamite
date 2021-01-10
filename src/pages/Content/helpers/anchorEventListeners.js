
//import './AnchorEngine/AnchorCreate';
import { updateXpaths, removeSpans, removeHighlights, removeTempHighlight } from './AnchorEngine/AnchorDestroy';
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
    else if (request.msg === 'ADD_REPLY_HIGHLIGHT') {
        // console.log('doin it');
        const { xpath, id } = request.payload;
        highlightReplyRange(xpath, id);
    }
    else if (request.msg === 'HIGHLIGHT_ANNOTATIONS') {
        const annotationsOnPage = request.payload;
        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => {
                if (anno.xpath !== undefined && anno.xpath !== null) {
                    highlightRange(anno, anno.id)
                    let findSpan = document.getElementsByName(anno.id);
                    if (findSpan.length === 0) {
                        chrome.runtime.sendMessage({
                            msg: "ANCHOR_BROKEN",
                            from: 'content',
                            payload: {
                                'id': anno.id
                            }
                        });
                    }
                }
                if (anno.replies !== undefined && anno.replies !== null && anno.replies.length) {
                    anno.replies.forEach(reply => {
                        if (reply.xpath !== undefined && reply.xpath !== null) {
                            highlightRange(reply, anno.id, reply.replyId);
                            let findSpan = document.getElementsByName(anno.id + '-' + reply.replyId);
                            if (findSpan.length === 0) {
                                chrome.runtime.sendMessage({
                                    msg: "ANCHOR_BROKEN",
                                    from: 'content',
                                    payload: {
                                        'id': anno.id,
                                        'replyId': reply.replyId
                                    }
                                });
                            }
                        }
                    })
                }
                if (anno.childAnchor !== undefined && anno.childAnchor !== null && anno.childAnchor.length) {
                    anno.childAnchor.forEach(child => {
                        if (child.xpath !== undefined && child.xpath !== null) {
                            highlightRange(child, anno.id, child.id);
                            let findSpan = document.getElementsByName(anno.id + '-' + child.id);
                            if (findSpan.length === 0) {
                                chrome.runtime.sendMessage({
                                    msg: "ANCHOR_BROKEN",
                                    from: 'content',
                                    payload: {
                                        'id': anno.id,
                                        'childId': child.id
                                    }
                                });
                            }
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
    else if (request.msg === 'REMOVE_HIGHLIGHTS') {
        removeHighlights();
    }
});
