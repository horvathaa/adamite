import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';
import xpath from 'xpath';
import { SIDEBAR_IFRAME_ID } from '../../../shared/constants';


function anchorClick(e) {
  const target = e.target.id;
  chrome.runtime.sendMessage({
    msg: 'ANCHOR_CLICKED',
    from: 'content',
    payload: {
      url: window.location.href,
      target: target,
    },
  });
}


const AnnotationAnchor = ({ div, id }) => {
  return (
    <div
      className="anchor-box"
      id={id}
      style={{
        top: div.top,
        left: div.left,
        width: div.width,
        height: div.height,
        zIndex: 100,
        position: 'absolute',
      }}
      onClick={e => anchorClick(e)}
    ></div>
  );
};

const alertBackgroundOfNewSelection = (selection, rect, offset) => {
  // supporting creation of annotations in sidebar
  chrome.runtime.sendMessage({
    msg: 'CONTENT_SELECTED',
    from: 'content',
    payload: {
      selection,
      rect,
      offset,
    },
  });
};

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

function getNodesInRange(range) {
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

/*
 * Finds highlighted text and creates highlight for annotation
 */
var matchText = function (nodes, range, callback, excludeElements) {

  excludeElements || (excludeElements = ['script', 'style', 'iframe', 'canvas']);

  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].isEqualNode(range.startContainer)) {
      var substring = nodes[i].data.substring(range.startOffset, range.endOffset < range.startOffset ? nodes[i].data.length : range.endOffset);
      splitReinsertText(nodes[i], substring, callback);
    }
    else if (nodes[i].isEqualNode(range.endContainer) && !range.startContainer.isEqualNode(range.endContainer)) {
      var substring = nodes[i].data.substring(0, range.endOffset);
      splitReinsertText(nodes[i], substring, callback);
    }
    else if (nodes[i].nodeType === 3) {
      if (nodes[i].data.trim() === "")
        continue;
      splitReinsertText(nodes[i], nodes[i].data, callback);
    }
  }
  return nodes;
}


document.addEventListener('mouseup', event => {
  var selection = window.getSelection();

  if (selection.type === 'Range') {
    const rect = selection.getRangeAt(0);

    //Text nodes that were highlighted by user
    var textNodes = getNodesInRange(rect).filter(function (element) {
      return element.nodeType === 3 && element.data.trim() !== "";
    });

    //TODO Custom Span colors
    matchText(textNodes, rect, function (node, match, offset) {
      var span = document.createElement("span");
      span.style.backgroundColor = "yellow";
      span.textContent = match;
      node.parentNode.insertBefore(span, node.nextSibling);
    });
    const offset = window.scrollY;
    alertBackgroundOfNewSelection(selection.toString(), rect, offset);
    // alertBackgroundOfNewSelection(selection.toString(), rect, offset);
  }

  if (selection.toString().trim().length === 0) {
    alertBackgroundOfNewSelection(null, null);
  }

});

function displayAnnotationAnchor(div, id) {
  const annotationAnchor = document.body.appendChild(
    document.createElement('div')
  );
  ReactDOM.render(<AnnotationAnchor div={div} id={id} />, annotationAnchor);
}

chrome.runtime.sendMessage(
  {
    msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
    payload: {
      url: window.location.href,
    },
  },
  data => {
    const { annotationsOnPage } = data;
    console.log(annotationsOnPage);
    if (annotationsOnPage.length) {
      annotationsOnPage.forEach(anno => {
        displayAnnotationAnchor(anno.div, anno.id);
      });
    }
  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'ANNOTATIONS_UPDATED' && request.from === 'background') {
    chrome.runtime.sendMessage(
      {
        msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
        payload: {
          url: window.location.href,
        },
      },
      data => {
        const { annotationsOnPage } = data;
        const mostRecentAnno = annotationsOnPage[0]; // annotationsOnPage already sorted by createdTimestamp (desc)
        displayAnnotationAnchor(mostRecentAnno.div, mostRecentAnno.id);
      }
    );
  }
});
