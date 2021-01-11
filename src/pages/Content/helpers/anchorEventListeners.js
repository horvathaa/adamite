
//import './AnchorEngine/AnchorCreate';
import { updateXpaths, removeSpans, removeHighlights, removeTempHighlight } from './AnchorEngine/AnchorDestroy';
import { tempHighlight, highlightRange, highlightReplyRange, anchorClick, highlightAnnotation } from './AnchorEngine/AnchorHighlight';
import { createAnnotation, removeAnnotationWidget } from './AnchorEngine/AnchorCreate';
import { getAllPaths } from "./AnchorEngine/domhelper"
import { getNodesInRange } from "./AnchorEngine/AnchorHelpers"

var xpathRange = require('xpath-range');


let allPaths = null;
let debug = false;

document.addEventListener('mouseup', event => {
    createAnnotation(event);
});

document.addEventListener('mousedown', event => {
    removeAnnotationWidget(event);
});



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.msg === 'ANNOTATION_DELETED_ON_PAGE') {
        let collection = document.getElementsByName(request.id);
        updateXpaths(collection, request.id)
    }
    else if (request.msg === 'ADD_REPLY_HIGHLIGHT') {
        console.log('doin it');
        const { xpath, id } = request.payload;
        highlightReplyRange(xpath, id);
    }
    else if (request.msg === 'REFRESH_HIGHLIGHTS') {
        function brokenAnchorMessage(payload) {
            chrome.runtime.sendMessage({
                msg: "ANCHOR_BROKEN",
                from: 'content',
                payload: { ...payload }
            });
        }
        const annotationsOnPage = request.payload;

        if (annotationsOnPage.length) {
            annotationsOnPage.reverse().forEach(anno => {

                highlightAnnotation(anno, anno.id.toString(), "root");
                let findSpan = document.getElementsByName(anno.id);
                if (findSpan.length === 0) {
                    chrome.runtime.sendMessage({
                        msg: "ANCHOR_BROKEN",
                        from: 'content',
                        payload: {
                            "id": anno.id
                        }
                    });
                }

                if (anno.childAnchor !== undefined && anno.childAnchor.length) {
                    anno.childAnchor.forEach(child => {
                        if (child.xpath !== undefined && child.xpath !== null) {
                            let domId = anno.id.toString() + "-" + child.id.toString();
                            highlightAnnotation(child, domId, "child")
                            let findSpan = document.getElementsByName(domId);
                            if (findSpan.length === 0) {
                                chrome.runtime.sendMessage({
                                    msg: "ANCHOR_BROKEN",
                                    from: 'content',
                                    payload: {
                                        "id": anno.id,
                                        "childId": child.id
                                    }
                                });
                            }
                        }
                    });
                }
                if (anno.replies !== undefined && anno.replies !== null && anno.replies.length) {
                    anno.replies.forEach(reply => {
                        if (reply.xpath !== undefined && reply.xpath !== null) {
                            let domId = anno.id.toString() + "-" + reply.replyId.toString();
                            highlightAnnotation(reply, domId, "reply")
                            let findSpan = document.getElementsByName(domId);
                            if (findSpan.length === 0) {
                                chrome.runtime.sendMessage({
                                    msg: "ANCHOR_BROKEN",
                                    from: 'content',
                                    payload: {
                                        "id": anno.id,
                                        "replyId": reply.replyId
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
        console.log(request);
        let findSpan;
        if (request.replyId !== undefined) {
            findSpan = document.getElementsByName(request.id + "-" + request.replyId.toString());
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
        console.log(request);
        let findSpan;
        if (request.replyId !== undefined) {
            findSpan = document.getElementsByName(request.id + "-" + request.replyId.toString());
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
        console.log(request);
        let findSpan;
        if (request.replyId !== undefined) {
            findSpan = document.getElementsByName(request.id + "-" + request.replyId.toString());
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

/*
If X-Path is the same for beginning and end


if Not



*/

function highlightSingle(info, content, xp, callback) {

    console.log("highlight");
    let node = info.node;
    if (node.nodeType !== 3) return;
    let substring = content;
    splitReinsertText(node, substring, callback);
}

//Splits text in node and calls callback action to preform on middle node
var splitReinsertText = function (node, substring, callback) {
    node.data.replace(substring, function (all) {
        var args = [].slice.call(arguments),
            offset = args[args.length - 2],
            newTextNode = node.splitText(offset);
        newTextNode.data = newTextNode.data.substr(all.length);

        callback.apply(window, [node].concat(args));
        return newTextNode;

    });
}
function parentPath(path) {
    return path.substr(0, path.lastIndexOf("/"));
};


