import $ from 'jquery';
import { transmitMessage } from "../anchorEventTransmitter";



export function addHighlightToSubstring({ node, substring, spanId, isPreview = false }) {
    let _spanId = isPreview ? "annoPreview" : spanId;
    let _className = isPreview ? "highlight-adamite-annotation-preview" : "highlight-adamite-annotation";
    splitReinsertText(node, substring, function (node, match, offset) {
        _addHighlightSpan({ match: match, node: node, spanId: _spanId, className: _className });

    });
}
function _addHighlightSpan({ match, node, spanId, className }) {
    var span = document.createElement("span");
    span.setAttribute("name", spanId);
    span.textContent = match;
    span.onclick = anchorClick;
    span.className = className;
    node.parentNode.insertBefore(span, node.nextSibling);
    node.parentNode.normalize();
    console.log("Done")
}

export const removeHighlightSpans = ({ isPreview = false }) => {
    let className = isPreview ? ".highlight-adamite-annotation-preview" : ".highlight-adamite-annotation";
    const highlights = document.querySelectorAll(className);
    highlights.forEach(h => {
        let parent = h.parentNode;
        $(h).contents().unwrap();
        parent.normalize();
    });
}

//1. Better matching of strings when faced with formatting issues
//Splits text in node and calls callback action to preform on middle node
var splitReinsertText = function (node, substring, callback) {
    console.log("splitReinsertText");

    function formatText(string) {
        return string.replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
    }
    // Needed to format test strings to make sure matches are actually found
    let substringText1 = formatText(substring.toString());
    let formatted = formatText(node.data.toString());

    function findTrueOffset(offset) {
        if (offset === 0 || (formatted.length === node.data.length && formatted === node.data)) {
            return offset;
        }
        let original = offset;
        while (node.data.length > offset
            && formatText(node.data.substring(0, offset)) != formatText(formatted.substring(0, original))) {
            offset += 1;
        }
        return offset;
    }

    function handleReplace(match, offset, string) {
        // Does offset change? check and set
        let trueOffset = findTrueOffset(offset);
        let newTextNode = node.splitText(trueOffset);
        // should check to make sure match is same as substring
        newTextNode.data = newTextNode.data.substr(substring.length);
        callback(node, match, offset);
        return newTextNode;
    }
    formatted.replace(substringText1, handleReplace);

}

export function anchorClick(e) {
    // console.log("in Anchor click", e)
    // console.log("spanz", document.getElementsByName(e.target.attributes.getNamedItem("name").value));
    //console.log(target);
    var ids = [e.target.attributes.getNamedItem("name").value];

    var spans = document.getElementsByName(ids[0])


    for (var i = 0; i < spans.length; i++) {
        //children
        var arr = [].slice.call(spans[i].children);
        var arr = arr.filter((function (element) {
            return element.className === 'highlight-adamite-annotation';
        }));
        arr.forEach(element => {
            ids.push(element.attributes.getNamedItem("name").value)
        });
        //parents
        var parentNode = spans[i].parentNode
        while (parentNode.className === 'highlight-adamite-annotation') {
            ids.push(parentNode.attributes.getNamedItem("name").value)
            parentNode = parentNode.parentNode;
        }
    }
    // ids = ids.filter(function (item, pos) {
    //     return ids.indexOf(item) == pos;
    // });

    var ids = [...new Set(ids)]
    // console.log(ids);
    // console.log("here is the ids", ids)
    //);
    const target = ids;
    // const target = e.target.attributes.getNamedItem("name").value;
    transmitMessage({
        msg: 'ANCHOR_CLICKED', sentFrom: "AnchorDomChanges", data: {
            payload: {
                url: getPathFromUrl(window.location.href),
                target: target,
            }
        }
    });
}





/**
 * Removes span from HTML DOM
 * @param {Array} collection 
 */
export const removeSpans = (collection) => {
    while (collection[0] !== undefined) {
        var parent = collection[0].parentNode;
        $(collection[0]).contents().unwrap();
        parent.normalize();
    }
}


function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
}

    // if (formatted.length !== node.data.length || formatted !== node.data) {
    //       // Something to align Texts to find actual offset if lengths are different
    //       //TODO, need to figure out if change affects substring and if so set an offset
    //     console.log("Need format check");
    //     //console.log(formatted.length, formatted);
    //     //console.log(node.data.length, node.data);

    // }
