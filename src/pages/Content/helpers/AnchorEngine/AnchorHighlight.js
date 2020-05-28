import './anchor-box.css';
import { xpathConversion, xpathToNode, flatten, getDescendants, getNodesInRange, pullXpathfromLocal } from './AnchorHelpers';
import $ from 'jquery';
var xpathRange = require('xpath-range');

function anchorClick(e) {
    const target = e.target.attributes.getNamedItem("name").value;
    chrome.runtime.sendMessage({
        msg: 'ANCHOR_CLICKED',
        from: 'content',
        payload: {
            url: window.location.href,
            target: target,
        },
    });
}


/*
* Finds Range and highlights each element
*/
export const highlightRange = (anno) => {

    var wordPath = [];
    // console.log("ANNO ")
    // console.log(anno)
    let newRange = xpathRange.toRange(anno.xpath.start, anno.xpath.startOffset, anno.xpath.end, anno.xpath.endOffset, document);
    highlight(newRange, anno.xpath.startOffset, anno.xpath.endOffset, function (node, match, offset) {

        var span = document.createElement("span");
        span.setAttribute("name", anno.id.toString());
        span.textContent = match;
        span.className = "highlight-adamite-annotation";
        node.parentNode.insertBefore(span, node.nextSibling);
        node.parentNode.normalize()
    });
}

function highlight(range, startOffset, endOffset, callback) {

    var nodes = getNodesInRange(range).filter(function (element) {
        return element.nodeType === 3 && element.data.trim() !== "";
    });
    // console.log("NODES", nodes[0].data)

    let start = true;
    let substring = "";
    if (nodes.length === 1) {
        substring = nodes[0].data.substring(startOffset, endOffset ? endOffset : nodes[0].data.length);
        return splitReinsertText(nodes[0], substring, callback);
    }
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].nodeType === 3) {
            if (startOffset !== 0 && start) {

                substring = nodes[i].data.substring(startOffset, nodes[i].data.length);
                // console.log("string", substring.length)
                substring = startOffset;
                start = false;
            }
            else if (endOffset !== 0 && i == nodes.length - 1) {
                substring = nodes[i].data.substring(0, endOffset);
            }
            else {
                substring = nodes[i].data;
            }
            splitReinsertText(nodes[i], substring, callback);
        }
    }
}

//Splits text in node and calls callback action to preform on middle node
var splitReinsertText = function (node, substring, callback) {
    node.data.replace(substring, function (all) {
        var args = [].slice.call(arguments),
            offset = args[args.length - 2],
            newTextNode = node.splitText(offset);
        // console.log("args", args);
        // console.log("offsets", offset);
        // console.log("newtextnode", newTextNode)
        newTextNode.data = newTextNode.data.substr(all.length);

        callback.apply(window, [node].concat(args));
        return newTextNode;

    });
}