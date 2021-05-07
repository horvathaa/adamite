import { transmitMessage } from '../anchorEventTransmitter';
import './anchor-box.css';
import { addHighlightToSubstring } from './AnchorDomChanges';
import { xpathConversion, getNodesInRange } from './AnchorHelpers';
import * as xpathRange from "./packages/xpath-range";



export const highlightAnnotationDeep = (anno) => {
    //console.log("highlight deep");
    // if (!document.getElementsByName(anno.id.toString()).length > 0)
    //     highlightAnnotation(anno, anno.id.toString(), "root") 
    // console.log(anno);
    if (anno.childAnchor !== undefined && anno.childAnchor.length) {
        anno.childAnchor.forEach(child => {
            if (child.xpath !== undefined && child.xpath !== null) {
                let domId = anno.id.toString() + "-" + child.id.toString();
                if (!document.getElementsByName(domId).length > 0) highlightAnnotation(child, domId, "child")
            }
        });
    }
    if (anno.replies !== undefined && anno.replies !== null && anno.replies.length) {
        anno.replies.forEach(reply => {
            if (reply.anchor !== undefined) {
                let domId = anno.id.toString() + "-" + reply.replyId.toString();
                highlightAnnotation(reply.anchor, domId, "reply")
            }
        })
    }
}
export const checkForBrokenAnnotationDeep = (anno, ids) => {
    //will show annotation type
    // if (!(ids.includes(anno.id.toString()))) {
    //     transmitMessage({ msg: "ANCHOR_BROKEN", data: { payload: { "id": anno.id } }, sentFrom: "AnchorHighlight" })
    // }

    if (anno.childAnchor !== undefined && anno.childAnchor.length) {
        anno.childAnchor.forEach(child => {
            if (child.xpath !== undefined && child.xpath !== null) {
                let domId = anno.id.toString() + "-" + child.id.toString();
                if (!(ids.includes(domId.toString()))) {

                }
            }
        });
    }
    if (anno.replies !== undefined && anno.replies !== null && anno.replies.length) {
        anno.replies.forEach(reply => {
            if (reply.xpath !== undefined && reply.xpath !== null) {
                let domId = anno.id.toString() + "-" + reply.replyId.toString();
                if (!highlightAnnotation(reply, domId, "reply")) {
                    // console.log("highlightAnnotation Reply ERROR"); console.log(anno);
                    //checkIfBrokenAnchor(domId, { "id": anno.id, "replyId": reply.replyId });
                }
            }
        })
    }
}





export const highlightAnnotation = (annotation, domId, type) => {
    //will show annotation type
    let nodePairs = getNodeSubstringPairs({ annotation: annotation, type: type });
    if (!nodePairs || nodePairs.length == 0) {
        //console.log("no matches");
        return false;
    }
    //console.log("NODE PAIRS");
    nodePairs.forEach((pair) => {
        addHighlightToSubstring({
            node: pair.node,
            substring: pair.substring,
            startOffset: pair.startOffset,
            endOffset: pair.endOffset,
            spanId: domId,
            isPreview: false
        });
    });
    return true;
}

/*
* Finds Range and highlights each element
*/
export const tempHighlight = (annotation) => {
    // console.log(annotation);
    let nodePairs = getNodeSubstringPairs({ annotation: annotation, type: "temp" });
    if (!nodePairs || nodePairs.length == 0) {
        // console.log("no matches");
        return false;
    }
    nodePairs.forEach((pair) => {
        addHighlightToSubstring({
            node: pair.node,
            substring: pair.substring,
            startOffset: pair.startOffset,
            endOffset: pair.endOffset,
            isPreview: true
        });
    });
    return true;
}




export const highlightRange = (anno, annoId, replyId) => {
    let spanId = (annoId !== undefined && replyId === undefined) ? annoId.toString() :
        (annoId !== undefined && replyId !== undefined) ? annoId.toString() + "-" + replyId.toString() :
            null;
    let type = (replyId !== undefined) ? "reply" : "annotation";
    let nodePairs = getNodeSubstringPairs({ annotation: anno, type: type });
    nodePairs.forEach((pair) => {
        addHighlightToSubstring({
            node: pair.node,
            substring: pair.substring,
            startOffset: pair.startOffset,
            endOffset: pair.endOffset,
            spanId: spanId,
        });
    });
}


/*
* Alternative way to use highlightRange
*/
//TODO
export const highlightReplyRange = (xpath, annoId, replyId) => {
    highlightRange(xpath, annoId, replyId);
}





// Scenario 1: Index off but text in same text node
// Scenario 2: Range doesn't include all text nodes
function getNodeSubstringPairs({ annotation, type, }) {
    if (annotation.xpath === undefined || annotation.xpath === null) return;
    let xp = (annotation.xpath instanceof Array) ? annotation.xpath[0] : annotation.xpath;
    let range, nodes, hasContent = false, fullContentString;

    //console.log("getNodePairs");
    if ("anchorContent" in annotation) {
        fullContentString = annotation.anchorContent;
        hasContent = true;
    } else if ("anchor" in annotation) {
        fullContentString = annotation.anchor;
        hasContent = true;
    }
    //xpathRange.toRange2(xp.start, xp.startOffset, xp.end, xp.endOffset, document, fullContentString);
    try { range = xpathRange.toRangeNew(xp.start, xp.startOffset, xp.end, xp.endOffset, document, fullContentString); }//, fullContentString
    catch (e) { }
    //console.log(fullContentString)
    // console.log(range);
    if (!range) { return false; }

    let endPath = xpathConversion(range.endContainer);
    let endOffset = range.endOffset;
    let startPath = xpathConversion(range.startContainer);
    let startOffset = range.startOffset;

    nodes = getNodesInRange(range).filter(function (element) { return element.nodeType === 3 && element.data.trim() !== ""; });
    //console.log(nodes);
    if ((startPath === endPath) && nodes.length === 1) {
        // If content string exists use that otherwise use indexes
        let substring = nodes[0].data.substring(startOffset, endOffset ? endOffset : nodes[0].data.length);
        if (hasContent && substring !== fullContentString) substring = fullContentString;
        // Highlight
        return [{ node: nodes[0], substring: substring, startOffset: startOffset, endOffset: endOffset ? endOffset : nodes[0].data.length }];
    }
    else if (nodes.length > 1) {
        let nodePairs = [];
        let start = true;
        let substring = "";
        for (let i = 0; i < nodes.length; i++) {
            let so, eo;
            if (nodes[i].nodeType === 3) {
                if (startOffset !== 0 && start) {
                    substring = nodes[i].data.substring(startOffset, nodes[i].data.length);
                    start = false;
                    so = startOffset; eo = nodes[i].data.length;
                }
                else if (endOffset !== 0 && i == nodes.length - 1) {
                    substring = nodes[i].data.substring(0, endOffset);
                    so = 0; eo = endOffset;
                }
                else {
                    substring = nodes[i].data;// if (!remainingContent.includes(substring)) {   console.log("Middle substring error") }
                    so = 0; eo = nodes[i].data.length;
                }
                nodePairs.push({ node: nodes[i], substring: substring, startOffset: so, endOffset: eo });
            }
        }
        return nodePairs;
    }
}





function formatText(string) {
    return string.trim().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
}

// function checkIfBrokenAnchor(spanId, errorPayload) {
//     console.log("Issue");
//     // TODO this doesn't work very well -- need to ficute out what the issue is
//     let findSpan = document.getElementsByName(spanId);
//     if (findSpan.length === 0) {
//         transmitMessage({ msg: "ANCHOR_BROKEN", data: { payload: errorPayload }, sentFrom: "AnchorHighlight" })
//         return true;
//     }
//     return false;
// }
