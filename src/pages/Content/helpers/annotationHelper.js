
import './anchor-box.css';

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

function removeQuotes(text) {
  //text.replace(/[-[\]{}()*+’?.,\\^$|#]/g, '\\$&');
  return replaceQuotes(text.replace(/[-[\]{}()*+’?.,\\^$|#]/g, '\\$&'));
}
function escapeRegExp(text) {
  //text.replace(/[-[\]{}()*+’?.,\\^$|#]/g, '\\$&');
  return replaceQuotes(text.replace(/[-[\]{}()*+’?.,\\^$|#]/g, '\\$&'));
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

// function wordmatch(element, word) {
//   if (element === null) {
//     return;
//   }
//   do {
//     if (element.nodeType !== 3) {
//       element = element.nextSibling;
//     }
//     else if (element.data.trim() === word.trim()) {
//       return element;
//     }
//     else {
//       element = element.nextSibling;
//     }
//   } while (element !== null)
//   return null;
// }


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


// function findFirstDiffPos(a, b) {
//   var longerLength = Math.max(a.length, b.length);
//   for (var i = 0; i < longerLength; i++) {
//     if (a[i] !== b[i]) return i;
//   }

//   return -1;
// }

function replaceQuotes(string) {
  string = string.replace(/'/g, "&apos;")
  return string.replace(/"/g, "&quot;")
}

function xpathRepair(xpath, content, endPaths) {

  /*
  * 1. contains a span? if not and we didn't find it, then it doesn't exist
  * 2. Find last instance of span and remove. If it does exist then replace with span * and check again. if nothing then remove span and try path
  * 3. If not replace xpath with step2 xpath and repeat step 2
  * */
  var path;
  //console.log(endPaths);
  if (xpathToNodez(xpath + "/text()[contains(.,'" + replaceQuotes(content) + "')]") !== null) {
    return xpath;
  }
  else if (xpathToNodez(xpath + "//*/text()[contains(.," + '"' + escapeRegExp(content.trim()) + '"' + ")]") !== null) {
    for (var i = 0; i < endPaths.length; i++) {
      if ((path = xpathToNodez(xpath + "/" + endPaths[i] + "/text()[contains(.,'" + replaceQuotes(content) + "')]")) !== null) {
        return endPaths[i];
      }
    }
    return xpath;
  }

  var xpathreplace = xpath.replace(/(SPAN)(\[.*?\])?(?!.*\1)\/?/, '');
  var endofxpath = xpath.replace(/.*(SPAN)(\[.*?\])?(?!.*\1)\/?/, '');

  if (endofxpath[endofxpath.length - 1] === "/") {
    endofxpath = endofxpath.substring(0, endofxpath.length - 1);
  }
  if (xpathreplace[xpathreplace.length - 1] === "/") {
    xpathreplace = xpathreplace.substring(0, xpathreplace.length - 1);
  }

  endPaths.push(endofxpath);

  if (xpath === xpathreplace) {
    if (xpathToNodez(xpath + "/text()[contains(.,'" + replaceQuotes(content) + "')]") !== null) {
      return xpath;
    } else if ((xpath + "//*/text()[contains(.," + '"' + escapeRegExp(content.trim()) + '"' + ")]") !== null) {
      for (var i = 0; i < endPaths.length; i++) {
        if ((path = xpathToNodez(xpath + "/" + endPaths[i] + "/text()[contains(.,'" + replaceQuotes(content) + "')]")) !== null) {
          return endPaths[i];
        }
      }
      return xpath;
    }
  }
  return xpathRepair(xpathreplace, content, endPaths);
}

function findChildXpath(xpathInfo, queue) {

  var word = xpathInfo.text;
  word = escapeRegExp(word);
  var curr;

  while (curr = queue.pop()) {
    if (!curr.textContent.match(word)) continue;
    for (var i = 0; i < curr.childNodes.length; ++i) {
      switch (curr.childNodes[i].nodeType) {
        case Node.TEXT_NODE: // 3
          if (curr.childNodes[i].textContent.match(word)) {
            return curr.childNodes[i];
          }
          break;
        case Node.ELEMENT_NODE: // 1
          queue.push(curr.childNodes[i]);
          break;
      }
    }
  }
}


// function findXpath(xpathInfo, offsets, id, content) {
//   let cleanXpath = xpathInfo.xpath.substring(0, xpathInfo.xpath.length - 7);
//   let tempXpath = { relativePath: "", fullPath: "" };
//   var word = xpathInfo.text;
//   word = escapeRegExp(word);
//   var queue = [document.body];
//   var curr;
//   var listofxpaths = [];
//   while (curr = queue.pop()) {
//     if (!curr.textContent.match(word)) continue;
//     for (var i = 0; i < curr.childNodes.length; ++i) {
//       switch (curr.childNodes[i].nodeType) {
//         case Node.TEXT_NODE: // 3
//           if (curr.childNodes[i].textContent.match(word)) {
//             let xpath = XpathConversion(curr);

//             //let index = findFirstDiffPos(xpath, tempXpath.relativePath === "" ? cleanXpath : tempXpath.relativePath);
//             let index = findFirstDiffPos(xpath, cleanXpath);


//             if (index < 0) {
//               let finalString = xpath;

//               xpathInfo.xpath = finalString;
//               matchText(xpathInfo, offsets, function (node, match, offset) {

//                 var span = document.createElement("span");
//                 span.setAttribute("id", id.toString());
//                 span.textContent = match;
//                 span.setAttribute('data-tooltip', content.length > 500 ? content.substring(0, 500) + "..." : content);
//                 span.setAttribute('data-tooltip-position', "bottom");
//                 span.className = "highlight-adamite-annotation";
//                 node.parentNode.insertBefore(span, node.nextSibling);
//                 document.getElementById(span.id).onclick = anchorClick;
//               });
//               return;
//             }
//             else {
//               tempXpath = { relativePath: cleanXpath.substring(0, index), fullPath: xpath };
//               if (listofxpaths.filter(function (xpaths) { return xpaths.fullPath === tempXpath.fullPath }).length === 0) {
//                 listofxpaths.push(tempXpath);
//               }
//             }
//           }
//           break;
//         case Node.ELEMENT_NODE: // 1
//           queue.push(curr.childNodes[i]);
//           break;
//       }
//     }
//   }
//   if (listofxpaths.length > 0) {
//     const longestGenre = Math.max(...listofxpaths.map(xpaths => xpaths.relativePath.length));
//     var tt = listofxpaths.filter(function (xpaths) { return xpaths.relativePath.length === longestGenre })

//     xpathInfo.xpath = tt[0].fullPath;
//     matchText(xpathInfo, offsets, function (node, match, offset) {
//       var span = document.createElement("span");
//       span.setAttribute("id", id.toString());
//       span.textContent = match;
//       span.setAttribute('data-tooltip', content.length > 500 ? content.substring(0, 500) + "..." : content);
//       span.setAttribute('data-tooltip-position', "bottom");
//       span.className = "highlight-adamite-annotation";
//       node.parentNode.insertBefore(span, node.nextSibling);
//       document.getElementById(span.id).onclick = anchorClick;
//     });
//   }
//   else {
//     console.log("we done goof");
//   }


// }

/*
* 1. find word, compare to stored xpath. 
* 2. Find the word in the list with the xpath closest to the one in storage. 
*/
function FindWords(anno) {

  var wordPath = [];
  anno.xpath.forEach(xpathInfo => {
    //console.log(xpathInfo.xpath.replace("/text()", ""))
    xpathInfo.xpath = xpathRepair(xpathInfo.xpath.replace("/text()", ""), xpathInfo.text, wordPath);
    //xpathInfo.xpath += "/text()";
    matchText(xpathInfo, xpathInfo.offsets, function (node, match, offset) {
      var span = document.createElement("span");
      span.setAttribute("name", anno.id.toString());
      span.textContent = match;
      // span.setAttribute('data-tooltip', anno.content > 500 ? anno.content.substring(0, 500) + "..." : anno.content);
      // span.setAttribute('data-tooltip-position', "bottom");
      span.className = "highlight-adamite-annotation";
      node.parentNode.insertBefore(span, node.nextSibling);
      // let collection = document.getElementsByClassName(span.id);
      // for (let i = 0; i < collection.length; i++) {
      //   collection[i].onclick = anchorClick;
      // }
    });


    // if (!xpathInfo.xpath.length) { return; }
    // //if (!xpathInfo.xpath.includes("/text()")) xpathInfo.xpath = xpathInfo.xpath.substring(0, xpathInfo.xpath.match(".*\/")[0].length - 1);
    // xpathInfo.xpath = findXpath69(xpathInfo.xpath, xpathInfo.text);
    // matchText(xpathInfo, xpathInfo.offsets, function (node, match, offset) {

    //   var span = document.createElement("span");
    //   span.setAttribute("id", anno.id.toString());
    //   span.textContent = match;
    //   span.setAttribute('data-tooltip', anno.content > 500 ? anno.content.substring(0, 500) + "..." : anno.content);
    //   span.setAttribute('data-tooltip-position', "bottom");
    //   span.className = "highlight-adamite-annotation";
    //   node.parentNode.insertBefore(span, node.nextSibling);
    //   document.getElementById(span.id).onclick = anchorClick;
    // });
    //findXpath(xpathInfo, anno.offsets, anno.id, anno.content);

  });
}


/*
 * Finds highlighted text and creates highlight for annotation
 */
var matchText = function (xpathInfo, offsets, callback, excludeElements) {

  var i = 0;
  excludeElements || (excludeElements = ['script', 'style', 'iframe', 'canvas']);

  var node;
  var regexdXpath = escapeRegExp(xpathInfo.text.trim())
  //closestXpath.substring(0, closestXpath.match(".*\/")[0].length - 1)

  //console.log(xpathInfo.xpath.substring(0, xpathInfo.xpath.match(".*\/")[0].length - 1) + "/*[contains(text()," + xpathInfo.text + ")]");
  // node = !xpathInfo.xpath.includes("/text()") ?
  //   xpathToNodez(xpathInfo.xpath + "/*[text()[contains(.,'" + '"' + regexdXpath + '"' + "')]]/text()") :
  //   xpathToNodez(xpathInfo.xpath + "[contains(.,'" + xpathInfo.text + "')]");
  // console.log("to nodes")
  // console.log(xpathInfo.xpath + "/text()[contains(.,'" + replaceQuotes(xpathInfo.text) + "')]")
  // console.log(xpathInfo.xpath + "/text()[contains(.,'" + replaceQuotes(xpathInfo.text) + "')]")
  // console.log(xpathInfo.xpath + "/*[text()[contains(.,'" + '"' + regexdXpath + '"' + "')]]/text()")
  // console.log(xpathToNodez(xpathInfo.xpath + "/text()[contains(.,'" + replaceQuotes(xpathInfo.text) + "')]"))
  // console.log(xpathToNodez(xpathInfo.xpath + "/text()[contains(.,'" + replaceQuotes(xpathInfo.text) + "')]"))
  // console.log(xpathToNodez(xpathInfo.xpath + "/*[text()[contains(.,'" + '"' + regexdXpath + '"' + "')]]/text()"))

  if ((node = xpathToNodez(xpathInfo.xpath + "/text()[contains(.,'" + replaceQuotes(xpathInfo.text) + "')]")) === null) {
    if ((node = xpathToNodez(xpathInfo.xpath + "/*[contains(.,'" + regexdXpath + "')]")) === null) {
      if ((node = xpathToNodez(xpathInfo.xpath + "/*[text()[contains(.,'" + '"' + regexdXpath + '"' + "')]]/text()")) === null) {
        return;
      }
    }
  }
  if (node.nodeType !== 3) {
    node = findChildXpath(xpathInfo, [node]);
  }
  var substring = node.data;


  if (xpathInfo.offsets.startOffset !== 0 && xpathInfo.offsets.endOffset !== 0) {
    substring = node.data.substring(xpathInfo.offsets.startOffset, xpathInfo.offsets.endOffset);
  }
  else if (xpathInfo.offsets.startOffset !== 0) {
    substring = node.data.substring(xpathInfo.offsets.startOffset, node.data.length);
  }
  else if (xpathInfo.offsets.endOffset !== 0) {
    substring = node.data.substring(0, offsets.endOffset);
  }
  splitReinsertText(node, substring, callback);
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
    }

  }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.msg === 'ANNOTATION_DELETED_ON_PAGE') {
    let collection = document.getElementsByName(request.id);
    while (collection[0] !== undefined) {
      $(collection[0]).contents().unwrap();
    }
  }
  else if (request.msg === 'ANNOTATION_ADDED') {


    request.newAnno.content = request.newAnno.annotation;
    FindWords(request.newAnno);
  }

  else if (request.msg === 'DELIVER_FILTERED_ANNOTATION_TAG' && request.from === 'background') {
    window.postMessage({ type: 'FROM_CONTENT', value: request.payload.response }, "*");
  }

});
