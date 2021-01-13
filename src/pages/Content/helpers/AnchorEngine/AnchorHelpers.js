import $ from 'jquery';
var xpathRange = require('xpath-range');



//Creates an Xpath from a node
export const xpathConversion = (element) => {
    if (element.tagName == 'HTML')
        return '/HTML[1]';
    if (element === document.body)
        return '/HTML[1]/BODY[1]';

    var ix = 0;
    var txt = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === element)
            return xpathConversion(element.parentNode) + '/' + (element.nodeType === 3 ? ('text()' + '[' + (txt + 1) + ']') : (element.tagName + '[' + (ix + 1) + ']'));
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
            ix++;
        else if (sibling.nodeType === 3) {
            txt++
        }
    }
}

export const xpathToNode = (path) => {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function getNextNode(node) {
    if (node.firstChild) {
        return node.firstChild;
    }
    while (node) {
        if (node.nextSibling)
            return node.nextSibling;
        node = node.parentNode;
    }
}

//get nodes under a range
export const getNodesInRange = (range) => {
    var start = range.startContainer;
    var end = range.endContainer;
    var commonAncestor = range.commonAncestorContainer;
    var nodes = [];
    var node;

    // walk parent nodes from start to common ancestor
    for (node = start.parentNode; node; node = node.parentNode) {
        nodes.push(node);
        if (node == commonAncestor)
            break;
    }
    nodes.reverse();

    // walk children and siblings from start until end is found
    for (node = start; node; node = getNextNode(node)) {
        nodes.push(node);
        if (node == end)
            break;
    }
    return nodes;
}

//flattens an array of array's
export const flatten = (arr) => {
    var el, flat, i, len;
    flat = [];
    for (i = 0, len = arr.length; i < len; i++) {
        el = arr[i];
        flat = flat.concat(el && $.isArray(el) ? flatten(el) : el);
    }
    return flat;
}

//From array of xpaths find a Common Ancestor
export const CommonAncestor = (array) => {
    var A = array.concat().sort(),
        a1 = A[0], a2 = A[A.length - 1], L = a1.length, i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
    return a1.substring(0, i);
}

//Gets Descendants of a node
export const getDescendants = (node, accum) => {
    var i;
    accum = accum || [];
    for (i = 0; i < node.childNodes.length; i++) {
        accum.push(node.childNodes[i])
        getDescendants(node.childNodes[i], accum);
    }
    return accum;
}

export const filterArrayFromArray = (arr, matchArr) => {
    var filtered = arr.filter(
        function (e) {
            return this.indexOf(e) < 0;
        },
        matchArr
    );
    return filtered;
}





export function getNodeSubstringPairs({ annotation, type, }) {
    if (annotation.xpath === undefined || annotation.xpath === null) return;
    let xp = (annotation.xpath instanceof Array) ? annotation.xpath[0] : annotation.xpath;
    let range, nodes, hasContent = false, fullContentString;
    // let findSpan = document.getElementsByName(domId);
    // if (findSpan && findSpan.length > 0) { return [];}
    try {
        range = xpathRange.toRange(xp.start, xp.startOffset, xp.end, xp.endOffset, document);
        nodes = getNodesInRange(range).filter(function (element) { return element.nodeType === 3 && element.data.trim() !== ""; });
        // console.log(range);console.log("SUCCESS") //console.log(fullContentString);console.log(range);console.log(xp);
    } catch (err) {
        // Error happens when reloaded changes xPath
        // console.log("ERROR"); console.log(annotation);
        // console.log(fullContentString); console.log(range); // console.log(xp); console.log('got error- ', err); todo see if text is in content
        return false;
    }

    if ("anchorContent" in annotation) {
        fullContentString = annotation.anchorContent;
        hasContent = true;
    } else if ("anchor" in annotation) {
        fullContentString = annotation.anchor;
        hasContent = true;
    }


    if ((xp.start === xp.end) && nodes.length === 1) {
        // If content string exists use that otherwise use indexes
        let substring = nodes[0].data.substring(xp.startOffset, xp.endOffset ? xp.endOffset : nodes[0].data.length);
        if (hasContent && substring !== fullContentString) substring = fullContentString;
        // Highlight
        return [{ node: nodes[0], substring: substring }];
    }

    else if (nodes.length > 1) {
        let nodePairs = [];
        let start = true;
        let substring = "";
        if (hasContent) {
            fullContentString = fullContentString.toString().trim().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
        }

        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType === 3) {
                if (xp.startOffset !== 0 && start) {
                    substring = nodes[i].data.substring(xp.startOffset, nodes[i].data.length);

                    if (hasContent && !startIndexMatchesContent(fullContentString, nodes[i].data, substring)) {
                        console.log("Start Error");
                        console.log(substring);
                        substring = getCorrectStartSubstring(fullContentString, nodes[i].data, substring);
                        console.log(substring);
                    }
                    start = false;
                }
                else if (xp.endOffset !== 0 && i == nodes.length - 1) {
                    substring = nodes[i].data.substring(0, xp.endOffset);
                    if (hasContent && !endIndexMatchesContent(fullContentString, nodes[i].data, substring)) {
                        console.log("End Error");
                        substring = getCorrectEndSubstring(fullContentString, nodes[i].data, substring);
                    }
                }
                else {
                    substring = nodes[i].data;// if (!remainingContent.includes(substring)) {   console.log("Middle substring error") }
                }
                nodePairs.push({ node: nodes[i], substring: substring });
            }
        }
        return nodePairs;
    }
}







function startIndexMatchesContent(annoContent, nodeContent, substring) {
    return (!annoContent) || (annoContent.includes(substring) && substring.length > 0 &&
        annoContent.substring(0, substring.length) === substring);
}

function getCorrectStartSubstring(annoContent, nodeContent, substring) {
    // check if string is too long by shortening it
    if (!annoContent.includes(substring) && substring.length > 0) {
        // console.log("Start Match Error - Too Long", substring);
        while (!annoContent.includes(substring) && substring.length > 0) {
            substring = substring.substring(1);
        }  // if (substring.length === 0){    console.log("NO MATCH", fullContentString)}
    }
    // check if string is too short by expanding it.
    else if (!annoContent.substring(0, substring.length) !== substring) {
        //console.log("Start Match Error - Too Short", substring);
        while (annoContent.substring(0, substring.length) !== substring && substring.length < nodeContent.length) {
            substring = nodeContent.substring(nodeContent.length - (substring.length + 1));
        }   // if (substring.length === nodes[i].data.length) {console.log("NO MATCHES FOUND", fullContentString)}
    }
    return substring;
}
function endIndexMatchesContent(annoContent, nodeContent, substring) {
    return (!annoContent) || (annoContent.includes(substring) && substring.length > 0) &&
        !(substring.length < nodeContent.length && annoContent.includes(nodeContent.substring(0, substring.length + 2)));
}

function getCorrectEndSubstring(annoContent, nodeContent, substring) {
    // check if string is too long by shortening it
    if (!annoContent.includes(substring) && substring.length > 0) {
        //console.log("End Match Error - Too Long", substring);
        while (!annoContent.includes(substring) && substring.length > 0) {
            substring = substring.substring(0, substring.length - 1);
        }// if (substring.length === 0)    console.log("NO MATCH", fullContentString)
    }
    // check if string is too short by expanding it.
    else if (substring.length < nodeContent.length && annoContent.includes(nodeContent.substring(0, substring.length + 2))) {
        //console.log("End Match Error - Too Short", substring);
        while (substring.length < nodeContent.length && annoContent.includes(substring)) {
            substring = nodeContent.substring(0, substring.length + 1);
        } // if (su
    }
    return substring;
}






let USE_THREAD_TBODY = true;

let USE_TABLE_TEXT = true;

let CONTEXT_LENGTH = 32;
let restricted = false;
let allPaths, oldRanges, rootNode;

let debug = false;


export const getAllPaths = () => {
    debug = false;
    console.log("getAllPaths");
    let pathStartNode = window.document.getElementsByTagName("body")[0];
    console.log(pathStartNode);
    let startTime = new Date().getTime();
    allPaths = {};
    // Creates a dict of all possible paths from body node
    collectPathsForNode(pathStartNode);
    let finishTime = new Date().getTime();
    console.log("Path traversal took " + (finishTime - startTime) + " ms.");
    // Restricted -> don't save dom documents, just the content
    if (debug) { console.log("allPaths"); console.log(allPaths); }

    return allPaths;
}

function collectPathsForNode(node) {
    if (debug) { console.log("collectPathsForNode"); console.log(node); }
    // gets text from node
    let nodeContent = getNodeContent(node, false);
    // if path has text, add it to allPaths dictionary
    if (nodeContent.length) {
        // gets formatted XPath string
        let path = getPathTo(node);
        allPaths[path] = {
            path: path, // xPath of item
            content: nodeContent, // text content
            length: nodeContent.length, // length of text
            node: node // node document
        };
    }
    // If node has children, recursively call function until all children are added to map
    if (node.hasChildNodes()) {
        let child, _i, _len, _ref;
        _ref = node.childNodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            if (debug) {
                console.log("node children")
                console.log(_ref);
            }
            collectPathsForNode(child);
        }
    }
    return null;
};



function getProperNodeName(node) {
    if (debug) {
        console.log("getProperNodeName");
        console.log(node);
    }
    var nodeName;
    nodeName = node.nodeName;
    switch (nodeName) {
        case "#text":
            return "text()";
        case "#comment":
            return "comment()";
        case "#cdata-section":
            return "cdata-section()";
        default:
            return nodeName;
    }
};


function getDefaultPath() {
    let pathStartNode = window.document.getElementsByTagName("body")[0];
    console.log("getDefaultPath");
    return getPathTo(pathStartNode);
};

function getPathTo(node) {
    rootNode = document;
    if (debug) console.log("getPathTo");
    var pos, tempitem2, xpath;
    xpath = '';
    while (node !== rootNode) {
        pos = 0;
        tempitem2 = node;
        while (tempitem2) {
            if (tempitem2.nodeName === node.nodeName) {
                pos++;
            }
            tempitem2 = tempitem2.previousSibling;
        }
        xpath = (getProperNodeName(node)) + (pos > 0 ? "[" + pos + ']' : "") + '/' + xpath;
        node = node.parentNode;
    }
    xpath = (rootNode.ownerDocument != null ? './' : '/') + xpath;
    xpath = xpath.replace(/\/$/, '');
    return xpath;
};


function getNodeContent(node, shouldRestoreSelection) {
    if (shouldRestoreSelection == null) { shouldRestoreSelection = true; }
    return getNodeSelectionText(node, shouldRestoreSelection);
};

function getNodeSelectionText(node, shouldRestoreSelection) {
    var sel, text;
    if (shouldRestoreSelection == null) { shouldRestoreSelection = true; }
    if (shouldRestoreSelection) { saveSelection(); }
    if (debug) console.log("Select Node");
    sel = selectNode(node);
    text = sel.toString().trim().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
    //if (shouldRestoreSelection) { restoreSelection();  }
    return text;
};

function selectNode(node) {

    var children, range, sel, sn, _ref;
    sel = window.getSelection();
    sel.removeAllRanges();
    range = window.document.createRange();
    if (USE_THREAD_TBODY && node.nodeType === Node.ELEMENT_NODE && ((_ref = node.tagName.toLowerCase()) === "thead" || _ref === "tbody") && node.hasChildNodes()) {
        children = node.childNodes;
        range.setStartBefore(children[0]);
        range.setEndAfter(children[children.length - 1]);
        sel.addRange(range);
    } else {
        if (USE_TABLE_TEXT && node.nodeType === Node.TEXT_NODE && node.parentNode.tagName.toLowerCase() === "table") {
        } else {
            range.setStartBefore(node);
            range.setEndAfter(node);
            sel.addRange(range);
        }
    }
    return sel;
};


function saveSelection(oldRanges) {
    var i, sel, _i, _ref, _ref1;
    // Gets selected text from dom
    sel = window.getSelection();
    for (i = _i = 0, _ref = sel.rangeCount; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        oldRanges = sel.getRangeAt(i);
    }
    switch (sel.rangeCount) {
        case 0:
            return (_ref1 = oldRanges) != null ? _ref1 : oldRanges = [];
        case 1:
            return oldRanges = [oldRanges];
    }
};

function restoreSelection(oldRanges) {
    window = window;
    var range, sel, _i, _len, _ref, _results;
    sel = window.getSelection();
    sel.removeAllRanges();
    _ref = oldRanges;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        range = _ref[_i];
        _results.push(sel.addRange(range));
    }
    return _results;
};


function stringStartsWith(string, prefix) {
    return prefix === string.substr(0, prefix.length);
};

function parentPath(path) {
    return path.substr(0, path.lastIndexOf("/"));
};



function lookUpNode(path) {
    var doc, node, results, _ref;
    doc = (_ref = document.ownerDocument) != null ? _ref : document;
    results = doc.evaluate(path, document, null, 0, null);
    return node = results.iterateNext();
};

function timestamp() {
    return new Date().getTime();
};