import { xpathConversion, flatten, getDescendants, getNodesInRange, filterArrayFromArray } from './AnchorHelpers';
import { highlightRange } from './AnchorHighlight';
import $ from 'jquery';

/**
 * Sends information to firebase for spans that need new xpath ranges
 * @param {Array} toUpdate 
 */
function sendUpdateXpaths(toUpdate) {
    chrome.runtime.sendMessage(
        {
            msg: 'UPDATE_XPATH_BY_IDS',
            payload: {
                toUpdate,
            },
        },
    );
}

/**
 * Removes span from HTML DOM
 * @param {Array} collection 
 */
function removeSpans(collection) {
    while (collection[0] !== undefined) {
        var parent = collection[0].parentNode;
        $(collection[0]).contents().unwrap();
        parent.normalize();
    }
}

/**
 * Finds all adamite spans under an adamite span range
 * @param {Array} rangeNodes 
 * @param {String} id String id of parent span
 * @return {Array} Array of start container for unique nodes under parent node
 */
function findUniqueSpanIds(rangeNodes, id) {
    var innerSpanNodes = [];
    rangeNodes.forEach(e => innerSpanNodes.push(getDescendants(e)));
    innerSpanNodes = flatten(innerSpanNodes).filter(function (element) {
        return element.className === 'highlight-adamite-annotation' && element.attributes.getNamedItem("name").value !== id;
    });

    //filters down to just one Id
    return innerSpanNodes = innerSpanNodes.filter((span, index, self) => self.findIndex(t => t.attributes.getNamedItem("name").value === span.attributes.getNamedItem("name").value) === index)
}

/**
 * Calculates the end offset of the new Xpath range of span
 * @param {Array} nodes range of nodes to iterate over to find end offset
 * @param {Number} startOffset New Range start offset
 * @return {Number} Returns the new end offset of failure condition
 */
function getendOffset(nodes, startOffset) {
    //if the start and end nodes share a parent then we need to get a better end offset
    var iterNode, i = nodes.length - 1, offset = 0;

    if (nodes[0].parentNode.isSameNode(nodes[nodes.length - 1].parentNode)) {
        iterNode = nodes[nodes.length - 1];
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].attributes.getNamedItem("name").value !== nodes[0].attributes.getNamedItem("name").value || !nodes[0].parentNode.isSameNode(nodes[i].parentNode)) {
                break;
            }
            offset += nodes[i].innerText.length;
        }
        i++;
        if (nodes[i].isSameNode(nodes[0])) {
            offset += startOffset !== undefined ? startOffset : 0;
        }
        return offset;
    } else {
        return null;
    }
}

/**
 * Object structure for range of the span that will be stored in firebase
 * @param {String} id 
 * @param {String} start start of range converted to an xpath string
 * @param {Number} startOffset start range offset
 * @param {String} end end of range converted to an xpath string
 * @param {Number} endOffset end range offset
 */
function UpdateXpathObj(id, start, startOffset, end, endOffset) {
    return {
        id: id,
        xpath: {
            start: start,
            startOffset: startOffset,
            end: end,
            endOffset: endOffset
        }
    };
}

/**
 * 
 * @param {Array} spanCollection collection of spans that are to be deleted 
 * @param {string} id identifier of said span collection
 */
export const updateXpaths = (spanCollection, id) => {
    console.log("this is the spanCollection", spanCollection)
    //Finds an annotation in the local storage by the annotation id
    chrome.storage.local.get(annotations => {
        updateXpathResponse(spanCollection, id, annotations.annotations);
    });
}

/** 
 * From nodes that are found to be affected by an update to an annotation:
 *  - Find all the spans that match the node
 *  - Decide if both the start and end node are going to be affected by the change
 * @param {Array} innerSpanNodes Array of unique nodes found to be in need of change
 * @param {Range} range range to find if start and end node intersect 
 * @return {Array} array of objects that need an update to their xpath information 
 */
function findNodesIntersectingRange(affectedNodes, range) {
    var nodesToUpdate = []
    for (var i = 0; i < affectedNodes.length; i++) {
        var spanApearance = document.getElementsByName(affectedNodes[i].attributes.getNamedItem("name").value);
        nodesToUpdate.push({
            spanApearance: spanApearance,
            start: range.intersectsNode(spanApearance[0]),
            end: range.intersectsNode(spanApearance[spanApearance.length - 1]),
            childOf: null,
            parentTo: null,
        });
    }
    return nodesToUpdate
}

/**
 * Creates a Range between Nodes
 * @param {Node} start 
 * @param {Number} startOffset 
 * @param {Node} end 
 * @param {Number} endOffset 
 * @return Range
 */
function createRange(start, startOffset, end, endOffset) {
    let range = document.createRange();
    range.setStart(start, startOffset);
    range.setEnd(end, endOffset);
    return range;
}

/**
 * Finds nodes that will be needed to be updated on span deletion 
 * @param {String} id 
 * @param {range} intersectRange range of span to be deleted
 * @param {range} inParentRange range of parent of span
 * @return array of nodes to update
 */
function findNodesToChange(id, intersectRange, inParentRange) {
    //Get nodes that cross or are in the parent of the span to be deleted
    var InnerRangeNodes = getNodesInRange(intersectRange).filter(function (element) {
        return element.className === 'highlight-adamite-annotation' && element.attributes.getNamedItem("name").value === id;
    });

    var OuterrangeNodes = getNodesInRange(inParentRange);

    //Filter nodes to only one node per id
    var innerSpanNodes = findUniqueSpanIds(InnerRangeNodes, id);
    var outerEndSpanNodes = findUniqueSpanIds(OuterrangeNodes, id);

    console.log("findUniqueSpanIds", innerSpanNodes);

    //Filter out nodes that are already found in the inner span of nodes to delete
    outerEndSpanNodes = filterArrayFromArray(outerEndSpanNodes, innerSpanNodes)

    //nothing to change
    if (innerSpanNodes.length === 0 && outerEndSpanNodes.length === 0) {
        return null;
    }

    var nodesToUpdate = []
    nodesToUpdate.push(findNodesIntersectingRange(innerSpanNodes, intersectRange));
    nodesToUpdate.push(
        findNodesIntersectingRange(outerEndSpanNodes, inParentRange).filter(function (element) {
            return element.start !== false && element.end !== false;
        })
    );
    return flatten(nodesToUpdate);
}

/**
 * Finds new end node after span Deletion (probably can infinite loop lol)
 * @param {Array} spanNodes 
 * @return new end node for annotation
 */
function getEndNode(spanNodes) {
    var endNode = spanNodes[spanNodes.length - 1].previousSibling
    console.log("spanNodesLength", spanNodes.length)
    if (spanNodes.length === 1) {
        return spanNodes[spanNodes.length - 1].previousSibling;
    }
    // var endNode = spanNodes[spanNodes.length - 1].previousSibling
    while (1) {
        if (endNode.nodeType == 3 || endNode.attributes.getNamedItem("name") === null || endNode.attributes.getNamedItem("name").value !== spanNodes[0].attributes.getNamedItem("name").value) {
            return endNode;
        }
        endNode = endNode.previousSibling
    }
}

/**
 * Creates new xpath range with offsets after span deletion, might be able to refactor this to be used for on annotion create update?
 * @param {Object} node Range information containing start and end of range
 * @param {DOMElement} endContainerParentNode DOM element that is parent to node
 */
function findNewXpaths(node, endContainerParentNode) {
    var spanNodes = node.spanApearance;
    var idToChange = spanNodes[0].attributes.getNamedItem("name").value;
    var newStart = null;
    var startOffset = null;
    var endofoffset = null;
    var newEnd = null;

    //if the start of the span range is not outside the deleted range and on the left
    if (node.start) {
        newStart = spanNodes[0].previousSibling
        startOffset = spanNodes[0].previousSibling.length
    }
    //if right most section is out of the inner span and not part of the parent span
    if (node.end || spanNodes[spanNodes.length - 1].parentNode.isSameNode(endContainerParentNode) /*add a check to see if it is in the parent*/) {
        newEnd = getEndNode(spanNodes);
        endofoffset = getendOffset(spanNodes, spanNodes[0].previousSibling.length)
    }

    removeSpans(spanNodes);

    if (newStart.nodeType !== 3) {
        newStart = newStart.nextSibling;
        startOffset = 0;
    }
    if (newEnd !== null && newEnd.nextSibling !== null && !newEnd.isSameNode(newStart)) {
        newEnd = newEnd.nextSibling;
    }

    newEnd = newEnd === null ? null : xpathConversion(newEnd);
    newStart = newStart === null ? null : xpathConversion(newStart);

    return UpdateXpathObj(idToChange, newStart, startOffset, newEnd, endofoffset);
}

/**
 * Gets children of Span under a Span
 * @param {Array} nodesToUpdate 
 * @return {Object} returns an object containing array of child spans and array of nodes directly under span to be deleted
 */
function findChildren(nodesToUpdate) {
    var newHighlightPaths = [];

    for (var i = nodesToUpdate.length - 1; i >= 0; i--) {
        for (var x = 0; x < nodesToUpdate[i].spanApearance.length; x++) {
            if (nodesToUpdate[i].spanApearance[x].parentNode.className === 'highlight-adamite-annotation') {
                var nodeRange = nodesToUpdate[i].spanApearance;
                var spanToDeleteRange = createRange(nodeRange[0], 0, nodeRange[nodeRange.length - 1], nodeRange[nodeRange.length - 1].childNodes.length);
                var endContainerParentNode = spanToDeleteRange.endContainer.parentNode;
                newHighlightPaths.push(findNewXpaths(nodesToUpdate[i], endContainerParentNode))
                nodesToUpdate.splice(i, 1);
                break;
            }
        }
    }

    return { nodesToUpdate: nodesToUpdate, childPaths: newHighlightPaths.reverse() }
}
/**
 * Finds all adamite spans that need new xpaths after a span deletion and sends updated info to Firebase
 * @param {*} spanCollection Collection of spans that are to be deleted
 * @param {*} id Id of spans to be deleted 
 * @param {*} annotation Local storage of all annotations old xpath information
 */
function updateXpathResponse(spanCollection, id, annotation) {
    var newPaths = [];
    var nodesToUpdate = [];
    var childPaths = [];

    var spanToDeleteRange = createRange(spanCollection[0], 0, spanCollection[spanCollection.length - 1], spanCollection[spanCollection.length - 1].childNodes.length);
    var endContainerParentNode = spanToDeleteRange.endContainer.parentNode;
    var endRange = createRange(endContainerParentNode, 0, endContainerParentNode, endContainerParentNode.childNodes.length);

    //get unique nodes that need to be updated

    nodesToUpdate = findNodesToChange(id, spanToDeleteRange, endRange)
    removeSpans(spanCollection);

    if (nodesToUpdate === null) {
        return;
    }

    var updatedPatObj = findChildren(nodesToUpdate);
    childPaths = updatedPatObj.childPaths;
    nodesToUpdate = updatedPatObj.nodesToUpdate;


    for (var i = 0; i < nodesToUpdate.length; i++) {
        newPaths.push(findNewXpaths(nodesToUpdate[i], endContainerParentNode));
        highlight(newPaths[newPaths.length - 1], annotation)
    }
    for (var i = 0; i < childPaths.length; i++) {
        highlight(childPaths[i], annotation);
    }
    childPaths.forEach(e => newPaths.push(e))

    // call update
    // console.log(newPaths)
    if (newPaths.length !== 0)
        sendUpdateXpaths(newPaths);

    console.log("DONE!");
}

//span in span in span 
function highlight(nodeRange, annotation) {
    if (nodeRange.start !== null && nodeRange.end !== null) {
        highlightRange(nodeRange);
    }
    else {
        console.log("ELSE END");
        oldXpathsToHighlight(nodeRange, annotation)
    }
}

/**
 * Updates an old annotation from local storage with new xpath information and highlights range
 * @param {string} nodeRange range as xpath information to be updated 
 * @param {Array} annotation local storage of old annotation spans 
 */
function oldXpathsToHighlight(nodeRange, annotation) {
    var updatedAnnotationById = annotation.filter(function (element) {
        return element.id === nodeRange.id;
    })[0];
    if (nodeRange.start !== null) {
        updatedAnnotationById.xpath.start = nodeRange.start
        updatedAnnotationById.xpath.startOffset = nodeRange.startOffset
    }
    console.log("this is end", nodeRange.end)
    if (nodeRange.end !== null) {
        updatedAnnotationById.xpath.end = nodeRange.end
        updatedAnnotationById.xpath.endOffset = nodeRange.endOffset
    }
    highlightRange(updatedAnnotationById);
}