//https://github.com/openannotation/xpath-range
import { getDocument } from './get-document'
import seek from './dom-seek'
import * as xpath from './simple-xpath-position/xpath'

const SHOW_TEXT = 4
let allPaths = {};
let USE_THREAD_TBODY = true;
let USE_TABLE_TEXT = true;
let debug = true;

/*
Better broken anchor solution
- issue with formatting with \n new line
- issue with new spans
*/


/**
 * Convert a `Range` to a pair of XPath expressions and offsets.
 *
 * If the optional parameter `root` is supplied, the computed XPath expressions
 * will be relative to it.
 *
 * @param {Range} range The Range to convert.
 * @param {Node} [root] The root context for the XPath expressions.
 * @returns {{start, startOffset, end, endOffset}}
 */

export function fromRange(range, root) {
  let startNode = range.startContainer
  let so = range.startOffset
  let ec = range.endContainer
  let eo = range.endOffset

  let start = xpath.fromNode(startNode, root)
  let end = xpath.fromNode(ec, root)

  return {
    start: start,
    end: end,
    startOffset: so,
    endOffset: eo,
  }
}


/**
 * Construct a `Range` from the given XPath expressions and offsets.
 *
 * If the optional parameter `root` is supplied, the XPath expressions are
 * evaluated as relative to it.
 *
 * @param {string} startPath An XPath expression for the start container.
 * @param {Number} startOffset The textual offset within the start container.
 * @param {string} endPath An XPath expression for the end container.
 * @param {Number} endOffset The textual offset within the end container.
 * @param {Node} [root] The root context for the XPath expressions.
 * @returns Range
 */
export function toRange(startPath, startOffset, endPath, endOffset, root) {
  let document = getDocument(root)

  let sc = xpath.toNode(startPath, root)
  if (sc === null) return notFound('start')

  let si = document.createNodeIterator(sc, SHOW_TEXT)
  // Issue with this 
  let so = startOffset - seek(si, startOffset)
  sc = si.referenceNode
  if (!si.pointerBeforeReferenceNode) {
    if (so > 0) return indexSize('start')
    so += sc.length
  }

  let ec = xpath.toNode(endPath, root)
  if (ec === null) return notFound('end')

  let ei = document.createNodeIterator(ec, SHOW_TEXT)
  let eo = endOffset - seek(ei, endOffset)

  ec = ei.referenceNode
  if (!ei.pointerBeforeReferenceNode) {
    if (eo > 0) return indexSize('end')
    eo += ec.length
  }

  let range = document.createRange()
  range.setStart(sc, so);
  range.setEnd(ec, eo);

  return range

  function notFound(which) {
    let error = `The ${which} node was not found.`,
      name = 'NotFoundError';
    console.error(name, error);
    return false
  }

  function indexSize(which) {
    let error = `There is no text at the requested ${which} offset.`,
      name = 'IndexSizeError';
    console.error(name, error);
    return false
  }
}


/**
 * Construct a `Range` from the given XPath expressions and offsets.
 *
 * If the optional parameter `root` is supplied, the XPath expressions are
 * evaluated as relative to it.
 *
 * @param {string} startPath An XPath expression for the start container.
 * @param {Number} startOffset The textual offset within the start container.
 * @param {string} endPath An XPath expression for the end container.
 * @param {Number} endOffset The textual offset within the end container.
 * @param {Node} [root] The root context for the XPath expressions.
 * @param {string} [matchContent] The match string.
 * @returns Range
 * 
 *  Scenarios
 *  - Content Not Found
 * 
 */


export function toRangeNew(startPath, startOffset, endPath, endOffset, root, matchContent) {

  let startNode, endNode;
  startNode = xpath.toNode(startPath, root);
  endNode = xpath.toNode(endPath, root);
  if (startNode !== null && endNode !== null) {
    console.log(startOffset, endOffset, matchContent);
    if (startPath === endPath && startOffset > endOffset) {
      endOffset = startOffset + matchContent.trim().length;
      console.log(startOffset, endOffset, matchContent);
    }
    let out;
    try {
      out = toRange(startPath, startOffset, endPath, endOffset, root);
      console.log(out);
    } catch (e) {
      out = toRangeMissing(startPath, startOffset, endPath, endOffset, root, matchContent);
      let sel = window.getSelection();
      sel.removeAllRanges();
    }
    return out;
  }
  return toRangeMissing(startPath, startOffset, endPath, endOffset, root, matchContent);

}
// 

//Find Node Containing Match String
// Get an ordered list of text nodes in parent
//Walk nodes, adding txt until find match
//...last match is end node
// Find end node offset
// Walk nodes again, this time removing content until no longer match 
// One before no longer match is startNode
// Find start node offset;
// return range;

function toRangeMissing(startPath, startOffset, endPath, endOffset, root, matchContent) {
  let startNode, startIterator, so, endNode, endIterator, eo, sharedParentPath;
  //Find Node Containing Match String
  console.log("toRangeMissing")
  let [parentPath, parentRange] = findParentWithMatch(startPath, root, formatText(matchContent));
  let nodes = getNodesInRange(parentRange)
  console.log(nodes);
  nodes = nodes.filter(function (element) {
    return element.nodeType === 3 && element.data.trim() !== "";
  });

  console.log(nodes);
  if (nodes.length === 0) return;
  if (nodes.length === 1) { console.log("TODO"); return; }

  let txt = "", nodeContent, formatted, done = false, j = 0;
  let nodeIndex = 0;
  while (nodeIndex < nodes.length && !done) {
    let node = nodes[nodeIndex];
    nodeContent = node.data;
    formatted = nodeContent.toString().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
    txt += nodeContent;
    if (txt.includes(matchContent)) {
      // last match is end node
      endNode = node;
      // let nodeLen = nodeContent.length;
      // let overallLen = txt.length;
      // let offsetLen = txt.indexOf(matchContent) + matchContent.length;
      let i = 0;
      while (i < nodeContent.length && matchContent.includes(nodeContent.substr(0, i))) {
        i++;
      }
      eo = i;
      done = true;
    };
    nodeIndex += 1;
  }
  done = false; let t2 = "";
  while (nodeIndex > 0 && !done) {
    let node = nodes[nodeIndex];
    nodeContent = node.data;
    formatted = nodeContent.toString().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
    t2 = nodeContent + t2;
    if (!t2.includes(matchContent)) {
      // last match is end node
      startNode = nodes[nodeIndex - 1];
      nodeContent = startNode.data;
      // let nodeLen = nodeContent.length;
      // let overallLen = txt.length;
      // let offsetLen = txt.indexOf(matchContent) + matchContent.length;
      let i = nodeContent.length - 2;
      while (i > 0 && matchContent.includes(nodeContent.substr(i))) {
        i--;
      }
      so = i;
      done = true;
    };
    nodeIndex -= 1;
  }

  let range = document.createRange()
  range.setStart(startNode, so)
  range.setEnd(endNode, eo)
  return range;
}


const findParentWithMatch = (startPath, root, matchString) => {
  console.log(matchString);
  let startTime = new Date().getTime();
  let startNode = xpath.toNode(startPath, root);
  let maxLoops = 4; let loops = 0;
  while ((startNode === undefined || startNode == null) && loops < maxLoops) {
    startPath = parentPath(startPath);
    startNode = xpath.toNode(startPath, root);
    loops += 1;
  }
  if (loops === maxLoops) { console.log("Couldn't find close XPath"); return; }

  let currentPath = startPath, currentNode = startNode;
  let nodeContent, outRange;
  if (currentPath in allPaths) {
    nodeContent = allPaths[currentPath].content;
  } else[nodeContent, outRange] = getNodeSelectionTextRange(currentNode, false, matchString);
  loops = 0;

  while (!nodeContent.includes(matchString) && loops < maxLoops) {
    //console.log(nodeContent);
    currentPath = parentPath(currentPath);
    if (currentPath in allPaths) {
      currentNode = allPaths[currentPath].node;
      nodeContent = allPaths[currentPath].content;
      outRange = allPaths[currentPath].range;
    } else {
      currentNode = xpath.toNode(currentPath, root);
      [nodeContent, outRange] = getNodeSelectionTextRange(currentNode, false, matchString);
      allPaths[currentPath] = {
        path: currentPath, // xPath of item
        content: nodeContent, // text content
        length: nodeContent.length, // length of text
        node: currentNode, // node document
        range: outRange
      };
    }
    //console.log(nodeContent);
    loops += 1;
  }
  if (loops === maxLoops) { console.log("Couldn't find string"); return; }
  console.log(`Found ${matchString} in ${nodeContent}`);
  console.log(`Parent Xpath ${currentPath}`);

  let finishTime = new Date().getTime();
  console.log("Path traversal took " + (finishTime - startTime) + " ms.");
  console.log(outRange);
  // Restricted -> don't save dom documents, just the content
  //if (debug) { console.log("allPaths"); console.log(allPaths); }
  return [currentPath, outRange];
}

//get nodes under a range
export const getNodesInRange = (range) => {
  var start = range.startContainer;
  var end = range.endContainer;
  var commonAncestor = range.commonAncestorContainer;
  var nodes = [];
  var node;

  // walk parent nodes from start to common ancestor
  if (start != commonAncestor) {
    for (node = start.parentNode; node; node = node.parentNode) {
      nodes.push(node);
      if (node == commonAncestor)
        break;
    }
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

//gets selection of node, returns it;
function getNodeSelectionTextRange(node, shouldRestoreSelection, match) {
  var sel, text;
  if (shouldRestoreSelection == null) { shouldRestoreSelection = true; }
  if (shouldRestoreSelection) { saveSelection(); }

  if (debug) console.log("Select Node");
  sel = selectNode2(node);
  text = sel.toString().trim().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");

  if (shouldRestoreSelection) { restoreSelection(); }
  console.log(text)
  return [text, sel.getRangeAt(0)];
};

//Gets node text selection
function selectNode2(node) {
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

function formatText(string) {
  return string.trim().replace(/\n/g, " ").replace(/[ ][ ]+/g, " ");
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

function saveSelection(oldRanges) {
  var i, sel, _i, _ref, _ref1;
  // Gets selected text from dom
  sel = window.getSelection();
  for (i = _i = 0, _ref = sel.rangeCount;
    0 <= _ref ? _i < _ref : _i > _ref;
    i = 0 <= _ref ? ++_i : --_i) {
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
