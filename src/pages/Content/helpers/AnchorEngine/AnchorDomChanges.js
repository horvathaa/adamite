import $ from 'jquery';
import { transmitMessage } from "../anchorEventTransmitter";



export function addHighlightToSubstring({ node, substring, spanId, isPreview = false }) {
    splitReinsertText(node, substring, function (node, match, offset) {
        if (isPreview)
            addPreviewHighlightSpan({ match, node })
        else
            addHighlightSpan({ match: match, node: node, spanId: spanId })
    });
}


export function addPreviewHighlightSpan({ match, node }) {
    _addHighlightSpan({ match: match, node: node, spanId: "annoPreview", className: "highlight-adamite-annotation-preview" })
}

export function addHighlightSpan({ match, node, spanId }) {
    _addHighlightSpan({ match: match, node: node, spanId: spanId, className: "highlight-adamite-annotation" })
}

function _addHighlightSpan({ match, node, spanId, className }) {
    var span = document.createElement("span");
    span.setAttribute("name", spanId);
    span.textContent = match;
    span.onclick = anchorClick;
    span.className = className;
    node.parentNode.insertBefore(span, node.nextSibling);
    node.parentNode.normalize()
}

export const removeHighlightSpans = () => {
    const highlights = document.querySelectorAll(".highlight-adamite-annotation");
    highlights.forEach(h => {
        let parent = h.parentNode;
        $(h).contents().unwrap();
        parent.normalize();
    });
}

export const removeTempHighlight = () => {
    const temp = document.querySelectorAll(".highlight-adamite-annotation-preview");
    temp.forEach(h => {
        let parent = h.parentNode;
        $(h).contents().unwrap();
        parent.normalize();
    });
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