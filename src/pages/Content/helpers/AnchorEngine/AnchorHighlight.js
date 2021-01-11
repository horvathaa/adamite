import './anchor-box.css';
import { xpathConversion, xpathToNode, flatten, getDescendants, getNodesInRange, pullXpathfromLocal } from './AnchorHelpers';
// import $ from 'jquery';
var xpathRange = require('xpath-range');
let textPosition = require('dom-anchor-text-position');

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
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
    console.log(ids);
    // console.log("here is the ids", ids)
    //);
    const target = ids;
    // const target = e.target.attributes.getNamedItem("name").value;
    chrome.runtime.sendMessage({
        msg: 'ANCHOR_CLICKED',
        from: 'content',
        payload: {
            url: getPathFromUrl(window.location.href),
            target: target,
        },
    });
}
/*
* Finds Range and highlights each element
*/

export const tempHighlight = (anno) => {
    let newRange;
    // console.log('sending in this anno', anno);
    try {
        if (anno.xpath instanceof Array) {
            newRange = xpathRange.toRange(anno.xpath[0].start, anno.xpath[0].startOffset, anno.xpath[0].end, anno.xpath[0].endOffset, document);
        } else {
            newRange = xpathRange.toRange(anno.xpath.start, anno.xpath.startOffset, anno.xpath.end, anno.xpath.endOffset, document);
        }
    } catch (err) {
        // console.log('got error- ', err);
        return;
    }
    // console.log('anno', anno, 'range', newRange);
    highlight(newRange, anno.xpath.startOffset, anno.xpath.endOffset, function (node, match, offset) {

        var span = document.createElement("span");
        span.setAttribute("name", "annoPreview");


        span.textContent = match;
        // span.onclick = anchorClick;
        span.className = "highlight-adamite-annotation-preview";
        console.log('span', span);
        node.parentNode.insertBefore(span, node.nextSibling);
        node.parentNode.normalize()
    });
}
function highlight(range, startOffset, endOffset, callback) {
    console.log("highlight");
    var nodes = getNodesInRange(range).filter(function (element) {
        return element.nodeType === 3 && element.data.trim() !== "";
    });

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






export const highlightAnnotations = (annotations) => {
    annotations.forEach(annotation => {
        // console.log(annotation.type) will show annotation type
        if (annotation.xpath === undefined || annotation.xpath === null) return;
        let xp = (annotation.xpath instanceof Array) ? annotation.xpath[0] : annotation.xpath;
        let fullContentString = annotation.anchorContent;
        let range, nodes;
        if (!fullContentString && annotation.anchor) fullContentString = annotation.anchor;
        try {
            range = xpathRange.toRange(xp.start, xp.startOffset, xp.end, xp.endOffset, document);
            nodes = getNodesInRange(range).filter(function (element) { return element.nodeType === 3 && element.data.trim() !== ""; });
            // console.log(range);console.log("SUCCESS")
            //console.log(fullContentString);console.log(range);console.log(xp);
        } catch (err) {
            console.log("ERROR")
            // console.log(fullContentString); console.log(range);
            // console.log(xp); console.log('got error- ', err); todo see if text is in content
            return;
        }
        // If annotation spans a single xpath
        if ((xp.start === xp.end) && nodes.length === 1) {
            let substring = nodes[0].data.substring(xp.startOffset, xp.endOffset ? xp.endOffset : nodes[0].data.length);
            if (!substring === fullContentString && nodes[0].data.includes(fullContentString)) {
                substring = fullContentString;
            }
            // Highlight
            return splitReinsertText(nodes[0], substring, function (node, match, offset) {
                //console.log("highlight");
                var span = document.createElement("span");
                if (annotation.id !== undefined) {
                    span.setAttribute("name", annotation.id);
                }
                span.textContent = match;
                span.onclick = anchorClick;
                span.className = "highlight-adamite-annotation";
                node.parentNode.insertBefore(span, node.nextSibling);
                node.parentNode.normalize()
            });
        }
        if (nodes.length > 1) {
            let start = true;
            let substring = "";
            fullContentString = fullContentString.toString().trim().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
            let remainingContent = fullContentString;
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType === 3) {
                    if (xp.startOffset !== 0 && start) {
                        substring = nodes[i].data.substring(xp.startOffset, nodes[i].data.length);

                        // check if string is too long by shortening it
                        if (!remainingContent.includes(substring) && substring.length > 0) {
                            // console.log("Start Match Error - Too Long", substring);
                            while (!remainingContent.includes(substring) && substring.length > 0) {
                                substring = substring.substring(1);
                            }
                            // if (substring.length === 0){    console.log("NO MATCH", fullContentString)}

                        }
                        // check if string is too short by expanding it.
                        else if (remainingContent.substring(0, substring.length) !== substring) {
                            //console.log("Start Match Error - Too Short", substring);
                            while (remainingContent.substring(0, substring.length) !== substring && substring.length < nodes[i].data.length) {
                                substring = nodes[i].data.substring(nodes[i].data.length - (substring.length + 1));
                            }
                            // if (substring.length === nodes[i].data.length) {console.log("NO MATCHES FOUND", fullContentString)}

                        }
                        start = false;
                    }
                    else if (xp.endOffset !== 0 && i == nodes.length - 1) {
                        substring = nodes[i].data.substring(0, xp.endOffset);
                        // check if string is too long by shortening it
                        if (!remainingContent.includes(substring) && substring.length > 0) {
                            //console.log("End Match Error - Too Long", substring);
                            while (!remainingContent.includes(substring) && substring.length > 0) {
                                substring = substring.substring(0, substring.length - 1);
                            }
                            // if (substring.length === 0)    console.log("NO MATCH", fullContentString)
                        }
                        // check if string is too short by expanding it.
                        else if (substring.length < nodes[i].data.length && remainingContent.includes(nodes[i].data.substring(0, substring.length + 2))) {
                            //console.log("End Match Error - Too Short", substring);
                            while (substring.length < nodes[i].data.length && remainingContent.includes(substring)) {
                                substring = nodes[i].data.substring(0, substring.length + 1);
                            }
                            // if (substring.length === nodes[i].data.length) {    console.log("NO MATCHES FOUND", fullContentString)}
                        }
                    }
                    else {
                        substring = nodes[i].data;
                        // if (!remainingContent.includes(substring)) {   console.log("Middle substring error") }
                    }
                    splitReinsertText(nodes[i], substring, function (node, match, offset) {
                        //console.log("highlight");
                        var span = document.createElement("span");
                        if (annotation.id !== undefined) {
                            span.setAttribute("name", annotation.id);
                        }
                        span.textContent = match;
                        span.onclick = anchorClick;
                        span.className = "highlight-adamite-annotation";
                        node.parentNode.insertBefore(span, node.nextSibling);
                        node.parentNode.normalize()
                    });
                }
            }
        }


    });
}


export const highlightRange = (anno, annoId, replyId) => {

    // console.log("highlight Range");
    // if (anno.xpath.start === anno.xpath.end) {
    //     console.log("SAME");
    //     console.log(anno.anchorContent);
    // } else {
    //     console.log("Different");
    //     console.log(anno.anchorContent);
    // }
    // console.log(anno.xpath);
    // var wordPath = [];
    // let newRange;
    // try {
    //     if (anno.xpath instanceof Array) {
    //         newRange = xpathRange.toRange(anno.xpath[0].start, anno.xpath[0].startOffset, anno.xpath[0].end, anno.xpath[0].endOffset, document);
    //     } else {
    //         newRange = xpathRange.toRange(anno.xpath.start, anno.xpath.startOffset, anno.xpath.end, anno.xpath.endOffset, document);
    //     }
    // } catch (err) {
    //     console.log();
    //     return;
    // }


    // highlight(newRange, anno.xpath.startOffset, anno.xpath.endOffset, function (node, match, offset) {
    //     var span = document.createElement("span");
    //     if (annoId !== undefined && replyId === undefined) {
    //         span.setAttribute("name", annoId.toString());
    //     }
    //     else if (annoId !== undefined && replyId !== undefined) {
    //         span.setAttribute("name", annoId.toString() + "-" + replyId.toString());
    //     }
    //     span.textContent = match;
    //     span.onclick = anchorClick;
    //     span.className = "highlight-adamite-annotation";
    //     node.parentNode.insertBefore(span, node.nextSibling);
    //     node.parentNode.normalize()
    // });
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



// /*
// * Alternative way to use highlightRange
// */
// export const highlightReplyRange = (xpath, annoId, replyId) => {
//     // console.log('are we even IN HERE')
//     var wordPath = [];
//     // console.log("ANNO ")
//     // console.log(anno)
//     let newRange;
//     // console.log('sending in this anno', anno);
//     try {
//         newRange = xpathRange.toRange(xpath.start, xpath.startOffset, xpath.end, xpath.endOffset, document);
//     } catch (err) {
//         console.log('got error- ', err);

//         // return;
//     }
//     // console.log('anno', anno, 'range', newRange);
//     highlight(newRange, xpath.startOffset, xpath.endOffset, function (node, match, offset) {

//         var span = document.createElement("span");
//         if (annoId !== undefined && replyId !== undefined) {
//             span.setAttribute("name", annoId.toString() + "-" + replyId.toString());
//         }
//         // else {
//         //     span.setAttribute("name", anno.id.toString() + annoId.toString());
//         // }
//         span.textContent = match;
//         span.onclick = anchorClick;
//         span.className = "highlight-adamite-annotation";
//         node.parentNode.insertBefore(span, node.nextSibling);
//         node.parentNode.normalize()
//     });
// }




        // //
        // //If single path
        // if (annotation.xpath.start === annotation.xpath.end) {
        //     // console.log("SAME");
        //     let info = allPaths[xp.start];

        //     if (info == null) {
        //         // Reattach
        //     }

        //     highlightSingle(info, fullContentString, xp, function (node, match, offset) {
        //         //console.log("highlight");
        //         var span = document.createElement("span");
        //         if (annotation.id !== undefined) {
        //             span.setAttribute("name", annotation.id);
        //         }
        //         span.textContent = match;
        //         span.onclick = anchorClick;
        //         span.className = "highlight-adamite-annotation";
        //         node.parentNode.insertBefore(span, node.nextSibling);
        //         node.parentNode.normalize()
        //     });
        // }
        // else {
        //     //
        //     let startInfo = allPaths[xp.start];
        //     if (startInfo == null) {
        //         // Reattach
        //     }
        //     // Get full string and format it
        //     fullContentString = fullContentString.toString().trim().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");


        //     // Find Start Content
        //     let startOff = 0; //  should be xp.startOffset but need code to check if that's too large
        //     //console.log(startInfo.content);
        //     let sub = startInfo.content;
        //     // Fix offsets that include too much text
        //     while (!fullContentString.includes(sub) && sub.length > 0) {
        //         startOff += 1;
        //         sub = sub.substring(1);
        //     }
        //     // Need a case if 0 => xpath no longer accurate
        //     if (debug) {
        //         console.log(startOff, xp.startOffset);
        //         console.log(fullContentString);
        //         console.log(sub);
        //     }

        //     // Attached front highlight
        //     highlightSingle(startInfo, sub, xp, function (node, match, offset) {
        //         var span = document.createElement("span");
        //         if (annotation.id !== undefined) {
        //             span.setAttribute("name", annotation.id);
        //         }
        //         span.textContent = match;
        //         span.onclick = anchorClick;
        //         span.className = "highlight-adamite-annotation";
        //         node.parentNode.insertBefore(span, node.nextSibling);
        //         node.parentNode.normalize()
        //     });

        //     // Next get end highlight
        //     let endInfo = allPaths[xp.end];
        //     if (endInfo === null) {
        //         // Reattach End
        //     }
        //     let nextContent = endInfo.content; // gets all of end content
        //     // Gets end text
        //     while (!fullContentString.includes(nextContent) && nextContent.length > 0) {
        //         nextContent = nextContent.substring(0, nextContent.length - 1);
        //     }
        //     if (debug) {
        //         console.log(nextContent.length, xp.endOffset);
        //         console.log(fullContentString);
        //         console.log(nextContent);
        //     }


        //     // Highlights end text
        //     highlightSingle(endInfo, nextContent, xp, function (node, match, offset) {
        //         //console.log("highlight");
        //         var span = document.createElement("span");
        //         if (annotation.id !== undefined) {
        //             span.setAttribute("name", annotation.id);
        //         }
        //         span.textContent = match;
        //         span.onclick = anchorClick;
        //         span.className = "highlight-adamite-annotation";
        //         node.parentNode.insertBefore(span, node.nextSibling);
        //         node.parentNode.normalize()
        //     });

        //     // If content in center
        //     if (fullContentString.length > (nextContent.length + sub.length + 1)) {
        //         console.log("Middle Content");
        //         // get common ancestor
        //         let parent = startInfo;
        //         // let parentStart = parentPath(startInfo),
        //         //     parentEnd = parentPath(endInfo);
        //         while (!parent.content.includes(nextContent)) {
        //             parent = allPaths[parentPath(parent.path)];
        //         }
        //         // need to get children
        //         let i = 0;
        //         Object.keys(allPaths).forEach(function (key) {
        //             //c//onsole.log(key, dictionary[key]);
        //             if (key.includes(parent.path)
        //                 && fullContentString.includes(allPaths[key].content)
        //                 && key.includes("text()")) {

        //                 let middle = allPaths[key];
        //                 // Highlights end text
        //                 highlightSingle(middle, middle.content, xp, function (node, match, offset) {
        //                     //console.log("highlight");
        //                     var span = document.createElement("span");
        //                     // if (annoId !== undefined && replyId === null) {
        //                     //     span.setAttribute("name", annoId.toString());
        //                     // }
        //                     span.setAttribute("name", annotation.id.toString());
        //                     span.textContent = match;
        //                     span.onclick = anchorClick;
        //                     span.className = "highlight-adamite-annotation";
        //                     node.parentNode.insertBefore(span, node.nextSibling);
        //                     node.parentNode.normalize()
        //                 });

        //             }
        //         });
        //     }
        //     else {
        //         console.log("No Middle Content")
        //     }

       // }