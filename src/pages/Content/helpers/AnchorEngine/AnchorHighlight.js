import { transmitMessage } from '../anchorEventTransmitter';
import './anchor-box.css';
import { addHighlightToSubstring } from './AnchorDomChanges';
import { getNodeSubstringPairs } from './AnchorHelpers';



function checkIfBrokenAnchor(spanId, errorPayload) {
    console.log("Issue");
    // TODO this doesn't work very well -- need to ficute out what the issue is
    let findSpan = document.getElementsByName(spanId);
    if (findSpan.length === 0) {
        transmitMessage({ msg: "ANCHOR_BROKEN", data: { payload: errorPayload }, sentFrom: "AnchorHighlight" })
        return true;
    }
    return false;
}


export const highlightAnnotationDeep = (anno) => {
    //will show annotation type

    if (!highlightAnnotation(anno, anno.id.toString(), "root")) {
        checkIfBrokenAnchor(anno.id.toString(), { "id": anno.id });
    }

    if (anno.childAnchor !== undefined && anno.childAnchor.length) {
        anno.childAnchor.forEach(child => {
            if (child.xpath !== undefined && child.xpath !== null) {
                let domId = anno.id.toString() + "-" + child.id.toString();
                if (!highlightAnnotation(child, domId, "child")) {
                    checkIfBrokenAnchor(domId, { "id": anno.id, "childId": child.id });
                }
            }
        });
    }
    if (anno.replies !== undefined && anno.replies !== null && anno.replies.length) {
        anno.replies.forEach(reply => {
            if (reply.xpath !== undefined && reply.xpath !== null) {
                let domId = anno.id.toString() + "-" + reply.replyId.toString();
                if (!highlightAnnotation(reply, domId, "reply")) {
                    checkIfBrokenAnchor(domId, { "id": anno.id, "replyId": reply.replyId });
                }
            }
        })
    }
}






export const highlightAnnotation = (annotation, domId, type) => {
    //will show annotation type
    let nodePairs = getNodeSubstringPairs({ annotation: annotation, type: type });
    if (!nodePairs || nodePairs.length == 0) {
        console.log("no matches");
        return false;
    }
    nodePairs.forEach((pair) => {
        addHighlightToSubstring({ node: pair.node, substring: pair.substring, spanId: domId, isPreview: false });
    });
    return true;
}

/*
* Finds Range and highlights each element
*/
export const tempHighlight = (annotation) => {
    console.log(annotation);
    let nodePairs = getNodeSubstringPairs({ annotation: annotation, type: "temp" });
    if (!nodePairs || nodePairs.length == 0) {
        console.log("no matches");
        return false;
    }
    nodePairs.forEach((pair) => {
        addHighlightToSubstring({ node: pair.node, substring: pair.substring, isPreview: true });
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
        addHighlightToSubstring({ node: pair.node, substring: pair.substring, spanId: spanId });
    });
}


/*
* Alternative way to use highlightRange
*/
//TODO
export const highlightReplyRange = (xpath, annoId, replyId) => {
    highlightRange(xpath, annoId, replyId);
}




