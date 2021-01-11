
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