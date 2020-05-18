import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';
import xpath from 'xpath';
import { SIDEBAR_IFRAME_ID } from '../../../shared/constants';
import { node } from 'prop-types';
import { compose } from 'glamor';
import $ from 'jquery';


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


const alertBackgroundOfNewSelection = (selection, offsets, xpath) => {
  // supporting creation of annotations in sidebar
  chrome.runtime.sendMessage({
    msg: 'CONTENT_SELECTED',
    from: 'content',
    payload: {
      selection,
      offsets,
      xpath,
    },
  });
};

function highlightColorHover() {
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = '.annoHover:hover { color: red; }';
  document.getElementsByTagName('head')[0].appendChild(style);

  document.getElementById('someElementId').className = 'cssClass';
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

function xpathToNodez(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function wordmatch(element, word) {
  if (element === null) {
    return;
  }
  do {
    if (element.nodeType !== 3) {
      element = element.nextSibling;
    }
    else if (element.data.trim() === word.trim()) {
      return element;
    }
    else {
      element = element.nextSibling;
    }
  } while (element !== null)
  return null;
}

/*
 * Finds highlighted text and creates highlight for annotation
 */
var matchText = function (nodes, startOffset, endOffset, callback, excludeElements) {

  var i = 0;
  excludeElements || (excludeElements = ['script', 'style', 'iframe', 'canvas']);

  if (nodes.length === 0) {
    return;
  }
  var node;
  nodes = nodes.sort((x, y) => x.xpath.length - y.xpath.length).reverse();

  for (i = 0; i < nodes.length; i++) {

    if ((node = wordmatch(xpathToNodez(nodes[i].xpath), nodes[i].text)) === null) {
      continue;
    }

    var substring = node.data;

    if (nodes[i].offsets.startOffset !== 0 && nodes[i].offsets.endOffset !== 0) {
      substring = node.data.substring(nodes[i].offsets.startOffset, nodes[i].offsets.endOffset);

    }
    else if (nodes[i].offsets.startOffset !== 0) {
      substring = node.data.substring(nodes[i].offsets.startOffset, node.data.length - 1);
    }
    else if (nodes[i].offsets.endOffset !== 0) {
      substring = node.data.substring(0, endOffset);
    }
    splitReinsertText(node, substring, callback);
  }

  return nodes;
}

function XpathConversion(element) {
  if (element.tagName == 'HTML')
    return '/HTML[1]';
  if (element === document.body)
    return '/HTML[1]/BODY[1]';

  var ix = 0;
  var siblings = element.parentNode.childNodes;
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i];
    if (sibling === element)
      return XpathConversion(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
      ix++;
  }
}

document.addEventListener('mouseup', event => {
  var selection = window.getSelection();

  if (selection.type === 'Range') {
    const rect = selection.getRangeAt(0);

    //Text nodes that were highlighted by user
    var textNodes = getNodesInRange(rect).filter(function (element) {
      return element.nodeType === 3 && element.data.trim() !== "";
    });

    const offsets = {
      startOffset: rect.startOffset,
      endOffset: rect.endOffset,
    };

    var xpathToNode = [];

    for (var i = 0; i < textNodes.length; i++) {
      xpathToNode.push(
        {
          xpath: XpathConversion(textNodes[i].parentNode) + "/text()",
          text: textNodes[i].data,
          offsets: {
            startOffset: i === 0 ? rect.startOffset : 0,
            endOffset: i === textNodes.length - 1 ? rect.endOffset : 0
          }
        }
      );
    }
    alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode);
  }

});

function highlightpage(anno) {
  matchText(anno.xpath, anno.offsets.startOff, anno.offsets.endOffset, function (node, match, offset) {

    var span = document.createElement("span");
    span.setAttribute("id", anno.id.toString());
    span.textContent = match;
    span.setAttribute('data-tooltip', anno.content.length > 500 ? anno.content.substring(0, 500) + "..." : anno.content);
    span.setAttribute('data-tooltip-position', "bottom");
    span.className = "highlight tooltip";
    node.parentNode.insertBefore(span, node.nextSibling);
    document.getElementById(span.id).onclick = anchorClick;
  });
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
    if (annotationsOnPage.length) {
      console.log(annotationsOnPage);
      //window.onload = function () {
      annotationsOnPage.forEach(anno => {
        highlightpage(anno);
      });
      //}
    }
  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'ANNOTATION_DELETED_ON_PAGE') {
    let element = document.getElementById(request.id);
    $(element).contents().unwrap();
  }
  else if (request.msg === 'ANNOTATIONS_UPDATED' && request.from === 'background') {
    chrome.runtime.sendMessage(
      {
        msg: 'REQUEST_ANNOTATED_TEXT_ON_THIS_PAGE',
        payload: {
          url: window.location.href,
        },
      },
      data => {
        const { annotationsOnPage } = data;
        annotationsOnPage.forEach(anno => {
          highlightpage(anno);
        });

      }
    );
  }

});
