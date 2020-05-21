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

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
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
var matchText = function (xpathInfo, offsets, callback, excludeElements) {

  var i = 0;
  excludeElements || (excludeElements = ['script', 'style', 'iframe', 'canvas']);

  var node;
  // nodes = nodes.sort((x, y) => x.xpath.length - y.xpath.length).reverse();
  // console.log("nodes ", nodes);
  // for (i = 0; i < nodes.length; i++) {

  // if ((node = wordmatch(xpathToNodez(fullXpath), phrase)) === null) {

  // return;
  // }
  node = xpathToNodez(xpathInfo.xpath + "/text()");
  // console.log(nodes[i]);

  // if (node.data === undefined) {
  //   /* 
  //   * step back one xpath node and try to find text, if in text split and creat span
  //   * if not skip
  //   */
  // }

  console.log(node.data);
  console.log("whhyyyy substring!");
  console.log(xpathInfo);
  console.log("WHY!");

  var substring = node.data;


  if (xpathInfo.offsets.startOffset !== 0 && xpathInfo.offsets.endOffset !== 0) {
    substring = node.data.substring(xpathInfo.offsets.startOffset, xpathInfo.offsets.endOffset);

  }
  else if (xpathInfo.offsets.startOffset !== 0) {
    substring = node.data.substring(xpathInfo.offsets.startOffset, node.data.length - 1);
  }
  else if (xpathInfo.offsets.endOffset !== 0) {
    substring = node.data.substring(0, offsets.endOffset);
  }
  splitReinsertText(node, substring, callback);
  // }

  // return nodes;
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
    span.className = "highlight-adamite-annotation";
    node.parentNode.insertBefore(span, node.nextSibling);
    document.getElementById(span.id).onclick = anchorClick;
  });
}


function findFirstDiffPos(a, b) {
  var longerLength = Math.max(a.length, b.length);
  for (var i = 0; i < longerLength; i++) {
    if (a[i] !== b[i]) return i;
  }

  return -1;
}

function findXpath(xpathInfo, offsets, id, content) {
  let cleanXpath = xpathInfo.xpath.substring(0, xpathInfo.xpath.length - 7);
  let tempXpath = { relativePath: "", fullPath: "" };
  var word = xpathInfo.text;
  if (word.includes("+")) {
    word = escapeRegExp(word);
    console.log(word);
  }
  var queue = [document.body];
  var curr;
  while (curr = queue.pop()) {
    // console.log(curr.textContent);
    if (!curr.textContent.match(word)) continue;
    for (var i = 0; i < curr.childNodes.length; ++i) {
      switch (curr.childNodes[i].nodeType) {
        case Node.TEXT_NODE: // 3
          if (curr.childNodes[i].textContent.match(word)) {
            console.log("Found!");
            console.log(curr);
            // wordPath.push({ xpath: XpathConversion(curr) });
            let xpath = XpathConversion(curr);

            let index = findFirstDiffPos(xpath, tempXpath.relativePath === "" ? cleanXpath : tempXpath.relativePath);
            if (index < 0) {
              let finalString = tempXpath.fullPath === "" ? cleanXpath : tempXpath.fullPath;
              console.log(finalString);
              console.log('we dod it!');
              console.log(tempXpath);
              xpathInfo.xpath = finalString;
              matchText(xpathInfo, offsets, function (node, match, offset) {

                var span = document.createElement("span");
                span.setAttribute("id", id.toString());
                span.textContent = match;
                span.setAttribute('data-tooltip', content.length > 500 ? content.substring(0, 500) + "..." : content);
                span.setAttribute('data-tooltip-position', "bottom");
                span.className = "highlight-adamite-annotation";
                node.parentNode.insertBefore(span, node.nextSibling);
                document.getElementById(span.id).onclick = anchorClick;
              });
              return;
            }
            else {
              tempXpath = { relativePath: cleanXpath.substring(0, index), fullPath: xpath };
            }
          }
          break;
        case Node.ELEMENT_NODE: // 1
          queue.push(curr.childNodes[i]);
          break;
      }
    }
  }
  if (tempXpath.relativePath !== "") {
    console.log(tempXpath);
    console.log('this is the best we got lol');
    xpathInfo.xpath = tempXpath.fullPath;
    matchText(xpathInfo, offsets, function (node, match, offset) {
      var span = document.createElement("span");
      span.setAttribute("id", id.toString());
      span.textContent = match;
      span.setAttribute('data-tooltip', content.length > 500 ? content.substring(0, 500) + "..." : content);
      span.setAttribute('data-tooltip-position', "bottom");
      span.className = "highlight-adamite-annotation";
      node.parentNode.insertBefore(span, node.nextSibling);
      document.getElementById(span.id).onclick = anchorClick;
    });
  }
  else {
    console.log("we done goof");
  }


}

/*
* 1. find word, compare to stored xpath. 
* 2. Find the word in the list with the xpath closest to the one in storage. 
*/
function FindWords(anno) {

  var wordPath = [];

  anno.xpath.forEach(xpathInfo => {
    if (!xpathInfo.xpath.length) { return; }
    findXpath(xpathInfo, anno.offsets, anno.id, anno.content);

  });
  console.log('done with this annotation');

  // console.log("wordpath:", wordPath);
  // anno.xpath.forEach(xpath => {
  //   wordPath.includes(xpath)
  // })

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
      annotationsOnPage.forEach(anno => FindWords(anno));
      console.log('done with annotationsOnPage');
    }
    // if (annotationsOnPage.length) {
    //   annotationsOnPage.forEach(anno => {
    //     console.log("nno: ", anno)
    //     highlightpage(anno);
    //   });

    // }
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
        if (annotationsOnPage.length) {
          annotationsOnPage.forEach(anno => FindWords(anno));
          console.log('done with annotationsOnPage');
        }
        // annotationsOnPage.forEach(anno => {
        //   highlightpage(anno);
        // });
      }
    );
  }
  else if (request.msg === 'DELIVER_FILTERED_ANNOTATION_TAG' && request.from === 'background') {
    window.postMessage({ type: 'FROM_CONTENT', value: request.payload.response }, "*");
  }

});
