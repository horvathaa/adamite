import { xpathConversion, flatten, getDescendants, getNodesInRange, filterArrayFromArray } from './AnchorHelpers';
import { highlightRange } from './AnchorHighlight';
import $ from 'jquery';


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

function removeSpans(collection) {
    while (collection[0] !== undefined) {
        var parent = collection[0].parentNode;
        $(collection[0]).contents().unwrap();
        parent.normalize();
    }
}

//Finds all adamite spans under an adamite span range
function findUniqueSpanIds(rangeNodes, id) {

    // var rangeNodes = getNodesInRange(range).filter(function (element) {
    //   return element.className === 'highlight-adamite-annotation' && element.attributes.getNamedItem("name").value === id;
    // });
    var innerSpanNodes = [];
    rangeNodes.forEach(e => innerSpanNodes.push(getDescendants(e)));
    innerSpanNodes = flatten(innerSpanNodes).filter(function (element) {
        return element.className === 'highlight-adamite-annotation' && element.attributes.getNamedItem("name").value !== id;
    });

    //filters down to just one Id
    return innerSpanNodes = innerSpanNodes.filter((span, index, self) => self.findIndex(t => t.attributes.getNamedItem("name").value === span.attributes.getNamedItem("name").value) === index)
}

//Calculate the offset of the new Xpath
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
            offset += startOffset
        }
        return offset;

    } else {
        return "N/A";
    }
}

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
    while (1) {
        console.log(endNode)
        if (endNode.nodeType == 3 || endNode.attributes.getNamedItem("name") === null || endNode.attributes.getNamedItem("name").value !== spanNodes[0].attributes.getNamedItem("name").value) {
            return endNode;
        }
        endNode = endNode.previousSibling
    }
}

//might be able to refactor this to be used for on annotion create update?
function findNewXpaths(node, endContainerParentNode, annotation) {
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
        console.log("spanNodes NED", spanNodes)
        console.log("FOUND NEW NED", xpathConversion(newEnd))
        endofoffset = getendOffset(spanNodes, spanNodes[0].previousSibling.length)
    }

    console.log("Calculated END OFFSET", endofoffset)

    removeSpans(spanNodes);

    if (newEnd !== null && newEnd.nextSibling !== null && !newEnd.isSameNode(newStart)) {
        newEnd = newEnd.nextSibling;
    }

    newEnd = newEnd === null ? null : xpathConversion(newEnd);
    newStart = newStart === null ? null : xpathConversion(newStart);

    var newPath = UpdateXpathObj(idToChange, newStart, startOffset, newEnd, endofoffset);
    console.log("cUSTOm Object", newPath);
    if (newStart !== null && newEnd !== null) {
        highlightRange(newPath);
    }
    else {
        console.log("ELSE END");
        oldXpathsToHighlight(idToChange, annotation, newStart, startOffset, newEnd, endofoffset)
    }

    return newPath;
}

//might be able to refactor this to be used for on annotion create update?
function findNewXpaths2(node, endContainerParentNode) {
    var spanNodes = node.spanApearance;
    var idToChange = spanNodes[0].attributes.getNamedItem("name").value;
    var newStart = null;
    var startOffset = null;
    var endofoffset = null;
    var newEnd = null;

    console.log("NEW@2", spanNodes)

    //if the start of the span range is not outside the deleted range and on the left
    if (node.start) {
        newStart = spanNodes[0].previousSibling
        startOffset = spanNodes[0].previousSibling.length
    }
    //if right most section is out of the inner span and not part of the parent span
    if (node.end || spanNodes[spanNodes.length - 1].parentNode.isSameNode(endContainerParentNode) /*add a check to see if it is in the parent*/) {
        newEnd = getEndNode(spanNodes);
        console.log("spanNodes NED", spanNodes)
        console.log("FOUND NEW NED", xpathConversion(newEnd))
        endofoffset = getendOffset(spanNodes, spanNodes[0].previousSibling.length)
    }

    console.log("Calculated END OFFSET", endofoffset)

    removeSpans(spanNodes);

    if (newEnd !== null && newEnd.nextSibling !== null && !newEnd.isSameNode(newStart)) {
        newEnd = newEnd.nextSibling;
    }

    newEnd = newEnd === null ? null : xpathConversion(newEnd);
    newStart = newStart === null ? null : xpathConversion(newStart);

    return UpdateXpathObj(idToChange, newStart, startOffset, newEnd, endofoffset);
}

function childHighlight(spanCollection) {
    var newPaths = [];
    //nodesToUpdate = nodesToUpdate.reverse();
    console.log("chjild hgh", spanCollection)
    var spanToDeleteRange = createRange(spanCollection.spanApearance[0], 0, spanCollection.spanApearance[spanCollection.spanApearance.length - 1], spanCollection.spanApearance[spanCollection.spanApearance.length - 1].childNodes.length);

    var endContainerParentNode = spanToDeleteRange.endContainer.parentNode;
    console.log(endContainerParentNode)
    var nepat = findNewXpaths2(spanCollection, endContainerParentNode);
    //console.log("CHILD NEW PATH", findNewXpaths2(spanCollection, endContainerParentNode))
    return nepat;

}

function updateXpathResponse(spanCollection, id, annotation) {
    console.log("Fuckin google annotations", annotation)
    var newPaths = [];

    console.log("SPAN COLLECTION", spanCollection)
    var spanToDeleteRange = createRange(spanCollection[0], 0, spanCollection[spanCollection.length - 1], spanCollection[spanCollection.length - 1].childNodes.length);

    var endContainerParentNode = spanToDeleteRange.endContainer.parentNode;
    var endRange = createRange(endContainerParentNode, 0, endContainerParentNode, endContainerParentNode.childNodes.length);

    //get unique nodes that need to be updated
    var nodesToUpdate = [];
    if ((nodesToUpdate = findNodesToChange(id, spanToDeleteRange, endRange)) === null) {
        removeSpans(spanCollection);
        return;
    }

    removeSpans(spanCollection);

    var newToUpdate = [];
    //span in span find?
    console.log("nodes to update", nodesToUpdate)
    var child = false;
    var newNodez = [];
    var supernewNodes = [];
    nodesToUpdate = nodesToUpdate.reverse();
    //nodesToUpdate.forEach(e => e.spanCollection.forEach(f => parentIsSpan(f)));
    for (var i = 0; i < nodesToUpdate.length; i++) {
        child = false;
        for (var x = 0; x < nodesToUpdate[i].spanApearance.length; x++) {
            if (nodesToUpdate[i].spanApearance[x].parentNode.className === 'highlight-adamite-annotation') {
                var parentN = nodesToUpdate[i].spanApearance[x].parentNode;
                console.log("IN HERE")
                supernewNodes.push(childHighlight(nodesToUpdate[i], annotation));
                child = true;
                break;
            }
        }
        if (child !== true) {
            newNodez.push(nodesToUpdate[i])
        }
    }
    console.log("supernewNodes", supernewNodes)
    console.log("new nodez", newNodez)

    //nodesToUpdate = nodesToUpdate.reverse();
    // //console.log("indernodes unique !", innerSpanNodes)
    console.log("nodes to update", newNodez)
    for (var i = 0; i < newNodez.length; i++) {
        newPaths.push(findNewXpaths(newNodez[i], endContainerParentNode, annotation));
    }
    for (var i = 0; i < supernewNodes.length; i++) {
        if (supernewNodes[i].start !== null && supernewNodes[i].end !== null) {
            highlightRange(supernewNodes[i]);
        }
        else {
            console.log("ELSE END");
            oldXpathsToHighlight(supernewNodes[i].id, annotation, supernewNodes[i].start, supernewNodes[i].startOffset, supernewNodes[i].end, supernewNodes[i].endOffset)
        }
    }
    // call update
    console.log("BEFORE PATH newPaths", newPaths)
    console.log("BEFORE PATH supernewNodes", supernewNodes)
    supernewNodes.forEach(e => newPaths.push(e))
    //newPaths = flatten(newPaths.push(supernewNodes));
    console.log(newPaths)
    if (newPaths.length !== 0)
        sendUpdateXpaths(newPaths.reverse());

    console.log("DONE!");
}

//span in span in span 


/**
 * Updates an old annotation from local storage with new xpath information and highlights range
 * @param {string} id 
 * @param {Array} annotation 
 * @param {Node} start 
 * @param {Number} startOffset 
 * @param {node} end 
 * @param {Number} endOffset 
 */
function oldXpathsToHighlight(id, annotation, start, startOffset, end, endOffset) {
    var updatedAnnotationById = annotation.filter(function (element) {
        return element.id === id;
    })[0];
    if (start !== null) {
        updatedAnnotationById.xpath.start = start
        updatedAnnotationById.xpath.startOffset = startOffset
    }
    console.log("this is end", end)
    if (end !== null) {
        updatedAnnotationById.xpath.end = end
        updatedAnnotationById.xpath.endOffset = endOffset
    }
    highlightRange(updatedAnnotationById);
}


