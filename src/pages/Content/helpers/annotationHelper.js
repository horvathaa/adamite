
import './anchor-box.css';
import $ from 'jquery';

var xpathRange = require('xpath-range');

function anchorClick(e) {
  const target = e.target.attributes.getNamedItem("name").value;
  chrome.runtime.sendMessage({
    msg: 'ANCHOR_CLICKED',
    from: 'content',
    payload: {
      url: window.location.href,
      target: target,
    },
  });
}




function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+’?.,\\^$|#]/g, '\\$&');
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

//TODO REWRITE TO MATCH TRY RANGE!
function xpathRepair(xpath, content, endPaths) {

  /*
  * 1. contains a span? if not and we didn't find it, then it doesn't exist
  * 2. Find last instance of span and remove. If it does exist then replace with span * and check again. if nothing then remove span and try path
  * 3. If not replace xpath with step2 xpath and repeat step 2
  * */
  var path;
  if (xpath === "") {
    return xpath;
  }
  // console.log('top of xpath - first check', xpath + "/text()[contains(.," + QuoteRepair(content) + ")]");
  if (xpathToNodez(xpath + "/text()[contains(.," + QuoteRepair(content) + ")]") !== null) {
    return xpath;
  }
  else if (xpathToNodez(xpath + "/*[contains(.," + QuoteRepair(content) + ")]") !== null) {
    for (var i = 0; i < endPaths.length; i++) {
      if ((path = xpathToNodez(xpath + "/" + endPaths[i] + "/text()[contains(.," + QuoteRepair(content) + ")]")) !== null) {
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


  if (!endPaths.length) {
    endPaths.push(endofxpath);
  }

  if (xpath === xpathreplace) {
    if (xpathToNodez(xpath + "/text()[contains(.," + QuoteRepair(content) + ")]") !== null) {
      return xpath;
    } else if (xpathToNodez(xpath + "/*[contains(.," + QuoteRepair(content) + ")]") !== null) {
      for (var i = 0; i < endPaths.length; i++) {
        if ((path = xpathToNodez(xpath + "/" + endPaths[i] + "/text()[contains(.," + QuoteRepair(content) + ")]")) !== null) {
          return endPaths[i];
        }
      }
      return xpath;
    }
    xpathreplace = xpathreplace.match(/.*(\/)(?!.*\1)\/?/, "");
    xpathreplace = xpathreplace[0].substring(0, xpathreplace[0].length - 1);
    return xpathRepair(xpathreplace, content, endPaths);
  }
  return xpathRepair(xpathreplace, content, endPaths);
}

function findChildXpath(xpathInfo, queue) {

  var word = xpathInfo.text;
  word = escapeRegExp(word);
  var curr;
  queue = [document.body];

  while (curr = queue.pop()) {
    if (!curr.textContent.match(word)) continue;
    for (var i = 0; i < curr.childNodes.length; ++i) {
      switch (curr.childNodes[i].nodeType) {
        case Node.TEXT_NODE: // 3
          if (curr.childNodes[i].textContent.match(word)) {
            // console.log('returned this node', curr.childNodes[i]);
            // console.log('matched on this word', word);
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

function CreateStringBody(xpathInfo) {

  var word = xpathInfo.text;
  word = escapeRegExp(word);
  var curr;
  var queue = [document.body];
  Selection.toString()
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

function NodesUnderNode(node) {
  var all = [];
  for (node = node.firstChild; node; node = node.nextSibling) {
    if (node.nodeType == 3) all.push(node);
    else all = all.concat(textsNodesUnderNode(node));
  }
  return all;
}

function textsNodesUnderNode(node) {
  var all = [];
  for (node = node.firstChild; node; node = node.nextSibling) {
    if (node.nodeType == 3) all.push(node);
    else all = all.concat(textsNodesUnderNode(node));
  }
  return all;
}

function getNodesInRange2(range) {
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
  if (start.isSameNode(end) && start.nodeType === Node.TEXT_NODE) {
    return [start];
  }
  else if (start.isSameNode(end)) {
    return textsNodesUnderNode(start);
  }
  for (node = start; node; node = getNextNode(node)) {
    if (node.nodeType === 3 && node.data.trim() !== "")
      nodes.push(node);
    if (node == end)
      break;
  }

  return nodes;
}


function highlight(range, startOffset, endOffset, callback) {

  // let nodes = getNodesInRange2(range);

  //Text nodes that were highlighted by user
  var nodes = getNodesInRange2(range).filter(function (element) {
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

/*
* 1. find word, compare to stored xpath. 
* 2. Find the word in the list with the xpath closest to the one in storage. 
*/
function FindWords(anno) {

  var wordPath = [];
  console.log("RANGE ")
  console.log(anno)
  let newRange = xpathRange.toRange(anno.xpath.start, anno.xpath.startOffset, anno.xpath.end, anno.xpath.endOffset, document);
  highlight(newRange, anno.xpath.startOffset, anno.xpath.endOffset, function (node, match, offset) {
    var span = document.createElement("span");
    span.setAttribute("name", anno.id.toString());
    span.textContent = match;
    span.className = "highlight-adamite-annotation";
    node.parentNode.insertBefore(span, node.nextSibling);
  });
}

function cleanStringForXpath(str) {
  var parts = str.match(/[^'"]+|['"]/g);
  parts = parts.map(function (part) {
    if (part === "'") {
      return '"\'"'; // output "'"
    }

    if (part === '"') {
      return "'\"'"; // output '"'
    }
    return "'" + part + "'";
  });
  return "concat(" + parts.join(",") + ")";
}

/*
 * Reconstruct string as a xpathconcat 
 * if string has  both an apostrophe and double quotes
 */
function reconstructStringForBothQuotes(string) {
  var wordString = string.split(/'/g).filter(function (el) { return el.length != 0 }).join("").split(/"/g).filter(function (el) { return el.length != 0 });
  var replacementWord = "";
  for (var i = 0; i < string.length; i++) {
    if (string[i] === "'") {
      replacementWord += "\"\'\", ";

    }
    else if (string[i] === '"') {
      replacementWord += '\'\"\', ';
    }
    else {
      replacementWord += string[i]
    }
  }
  string = replacementWord;

  for (var i = 0; i < wordString.length; i++) {
    string = string.replace(wordString[i], "'" + wordString[i] + "', ")
    wordString[i] = "'" + wordString[i] + "', ";
  }
  return "concat(" + string.replace(/\,([^\,]*)$/g, "") + ")";
}

/*
 * Browsers currently use Xpath 1.0 which does no allow for escapes on quotes
 * Rebuild contains query to fix for this. 
 * Change when browers someday go to 2.0
 */
function QuoteRepair(string) {
  var apostrophe = string.match(/'/g);
  var doubleQuote = string.match(/"/g);
  if (apostrophe !== null && doubleQuote !== null) {
    return reconstructStringForBothQuotes(string);
  }
  else if (apostrophe !== null) {
    return "\"" + string + "\"";
  }
  else {
    return "\'" + string + "\'";
  }
}

/*
 * Finds highlighted text and creates highlight for annotation
 */
// var matchText = function (xpathInfo, offsets, callback, excludeElements) {

//   var i = 0;
//   excludeElements || (excludeElements = ['script', 'style', 'iframe', 'canvas']);

//   var node;
//   var regexdXpath = escapeRegExp(xpathInfo.text.trim())
//   console.log('in match text with this xpathinfo', xpathInfo);
//   if ((node = xpathToNodez(xpathInfo.xpath + "/text()[contains(.," + QuoteRepair(xpathInfo.text) + ")]")) === null) {
//     if ((node = xpathToNodez(xpathInfo.xpath + "/*[contains(.," + QuoteRepair(xpathInfo.text) + ")]")) === null) {
//       if ((node = xpathToNodez(xpathInfo.xpath + "/*[text()[contains(.," + QuoteRepair(xpathInfo.text) + ")]]/text()")) === null) {
//         return;
//       }
//     }
//   }
//   if (node.nodeType !== 3) {
//     console.log('in if tyoe thing');
//     node = findChildXpath(xpathInfo, [node]);
//     console.log('here\'s node', node);
//   }
//   var substring = node.data;


//   if (xpathInfo.offsets.startOffset !== 0 && xpathInfo.offsets.endOffset !== 0) {
//     substring = node.data.substring(xpathInfo.offsets.startOffset, xpathInfo.offsets.endOffset);
//   }
//   else if (xpathInfo.offsets.startOffset !== 0) {
//     substring = node.data.substring(xpathInfo.offsets.startOffset, node.data.length);
//   }
//   else if (xpathInfo.offsets.endOffset !== 0) {
//     substring = node.data.substring(0, offsets.endOffset);
//   }
//   splitReinsertText(node, substring, callback);
// }

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
      annotationsOnPage.reverse().forEach(anno => FindWords(anno));
    }
  }
);


function XpathConversion(element) {
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
      return XpathConversion(element.parentNode) + '/' + (element.nodeType === 3 ? ('text()' + '[' + (txt + 1) + ']') : (element.tagName + '[' + (ix + 1) + ']'));
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
      ix++;
    else if (sibling.nodeType === 3) {
      txt++
    }
  }
}

function flatten(arr) {
  var el, flat, i, len;
  flat = [];
  for (i = 0, len = arr.length; i < len; i++) {
    el = arr[i];
    flat = flat.concat(el && $.isArray(el) ? flatten(el) : el);
  }
  return flat;
}

function findAllNodesUnderRange(node) {
  var nodes;
  console.log(node)
  if (node && node.className !== 'highlight-adamite-annotation') {
    console.log("HERE")
    nodes = [];
    //if (node.nodeType !== Node.COMMENT_NODE) {
    node = node.lastChild;
    while (node) {
      nodes.push(findAllNodesUnderRange(node));
      node = node.previousSibling;
    }
    //}
    return nodes.reverse();
  } else {
    return node;
  }
}

function getDescendants(node, accum) {
  var i;
  accum = accum || [];
  for (i = 0; i < node.childNodes.length; i++) {
    accum.push(node.childNodes[i])
    getDescendants(node.childNodes[i], accum);
  }
  return accum;
}

function sendUpdateXpaths(toUpdate) {
  chrome.runtime.sendMessage(
    {
      msg: 'UPDATE_XPATH_BY_IDS',
      payload: {
        toUpdate,
      },
    },
    data => {
      console.log("DATA", data)
      const { annotationsOnPage } = data;
      if (annotationsOnPage.length) {
        annotationsOnPage.reverse().forEach(anno => FindWords(anno));
      }
    }
  );
}

function removeSpans(collection) {
  while (collection[0] !== undefined) {
    var parent = collection[0].parentNode;
    $(collection[0]).contents().unwrap();
    parent.normalize();
  }
}

//Finds all adamite spans under an adamite span range
function findUniqueSpanIds(rangeNodes, id) {

  // var rangeNodes = getNodesInRange(range).filter(function (element) {
  //   return element.className === 'highlight-adamite-annotation' && element.attributes.getNamedItem("name").value === id;
  // });
  var innerSpanNodes = [];
  rangeNodes.forEach(e => innerSpanNodes.push(getDescendants(e)));
  innerSpanNodes = flatten(innerSpanNodes).filter(function (element) {
    return element.className === 'highlight-adamite-annotation' && element.attributes.getNamedItem("name").value !== id;
  });

  //filters down to just one Id
  return innerSpanNodes = innerSpanNodes.filter((span, index, self) => self.findIndex(t => t.attributes.getNamedItem("name").value === span.attributes.getNamedItem("name").value) === index)
}

//Calculate the offset of the new Xpath
function getendOffset(nodes, startOffset) {
  //if the start and end nodes share a parent then we need to get a better end offset
  var iterNode, i = nodes.length - 1, offset = 0;

  if (nodes[0].parentNode.isSameNode(nodes[nodes.length - 1].parentNode)) {
    iterNode = nodes[nodes.length - 1];
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].attributes.getNamedItem("name").value !== nodes[0].attributes.getNamedItem("name").value || !nodes[0].parentNode.isSameNode(nodes[i].parentNode)) {
        break;
      }
      offset += nodes[i].innerText.length;
    }
    i++;
    if (nodes[i].isSameNode(nodes[0])) {
      offset += startOffset
    }
    return offset;

  } else {
    return "N/A";
  }

}

function UpdateXpathObj(id, start, startOffset, end, endOffset) {
  this.id = id;
  this.xpath = {};
  this.xpath["start"] = start;
  this.xpath["startOffset"] = startOffset;
  this.xpath["end"] = end;
  this.xpath["endOffset"] = endOffset;
}

function filterArrayFromArray(arr, matchArr) {
  var filtered = arr.filter(
    function (e) {
      return this.indexOf(e) < 0;
    },
    matchArr
  );
  return filtered;
}


function findNewXpath() {

}


/*
 * TODO: IF UPDATED XPATH IS ON A DIFFERENT PARENT
 * IF THERE IS AN ELEMENT IN THE PARENT THAT WLL BE CHANGED BECAUSE OF THE DELETION 
 * BUT IS NOT UNDER THE ELEMENT TO BE DELETED SPAN
 */

function updateXpaths(spanCollection, id) {

  var newObject = [];


  let range = document.createRange();
  range.setStart(spanCollection[0], 0);
  range.setEnd(spanCollection[spanCollection.length - 1], spanCollection[spanCollection.length - 1].childNodes.length);

  var endRangeParent = range.endContainer.parentNode;

  let endRange = document.createRange();
  endRange.setStart(endRangeParent, 0);
  endRange.setEnd(endRangeParent, endRangeParent.childNodes.length);


  console.log("Span Collection", spanCollection)
  console.log("delete range", range)

  var InnerrangeNodes = getNodesInRange(range).filter(function (element) {
    return element.className === 'highlight-adamite-annotation' && element.attributes.getNamedItem("name").value === id;
  });
  var OuterrangeNodes = getNodesInRange(endRange);

  var innerSpanNodes = findUniqueSpanIds(InnerrangeNodes, id);
  var outerEndSpanNodes = findUniqueSpanIds(OuterrangeNodes, id);
  console.log("EndTange", endRange);
  console.log("OuterrangeNodes", OuterrangeNodes);
  console.log("Outer End Nodes", filterArrayFromArray(outerEndSpanNodes, innerSpanNodes));
  outerEndSpanNodes = filterArrayFromArray(outerEndSpanNodes, innerSpanNodes)

  if (innerSpanNodes.length === 0) {
    removeSpans(spanCollection);
    return;
  }
  var nodesToUpdate = []
  for (var i = 0; i < innerSpanNodes.length; i++) {
    var spanApearance = document.getElementsByName(innerSpanNodes[i].attributes.getNamedItem("name").value);
    nodesToUpdate.push({
      spanApearance: spanApearance,
      start: range.intersectsNode(spanApearance[0]),
      end: range.intersectsNode(spanApearance[spanApearance.length - 1]),
    });
  }

  var nodesToUpdateOuter = []
  for (var i = 0; i < outerEndSpanNodes.length; i++) {
    var spanApearance = document.getElementsByName(outerEndSpanNodes[i].attributes.getNamedItem("name").value);
    nodesToUpdateOuter.push({
      spanApearance: spanApearance,
      start: range.intersectsNode(spanApearance[0]),
      end: range.intersectsNode(spanApearance[spanApearance.length - 1]),
    });
  }

  removeSpans(spanCollection);

  console.log("indernodes unique !", innerSpanNodes)
  console.log("RANGES BOOL", nodesToUpdate)

  //spans that were in the span that is to be deleted
  for (var i = 0; i < nodesToUpdate.length; i++) {

    console.log("is first in range", range)
    var node = nodesToUpdate[i];
    var spanNodes = node.spanApearance;
    var idToChange = spanNodes[0].attributes.getNamedItem("name").value;
    var newStart = null;
    var startOffset = null;
    var endofoffset = null;
    var newEnd = null;

    //if the start of the span range is outside the delted range and on the left
    //if (node.start) {
    console.log("start is true")
    newStart = spanNodes[0].previousSibling
    startOffset = spanNodes[0].previousSibling.length
    console.log("startOffsetr", spanNodes[0].previousSibling)
    //}
    //if right most section is out of the inner span and not part of the parent span
    if (node.end || spanNodes[spanNodes.length - 1].parentNode.isSameNode(endRangeParent) /*add a check to see if it is in the parent*/) {
      console.log("end is true", spanNodes)
      newEnd = spanNodes[spanNodes.length - 1].previousSibling
      while (1) { //endprev.attributes.getNamedItem("name").value === spanApearance[0].attributes.getNamedItem("name").value) {
        console.log(newEnd)
        if (newEnd.nodeType == 3 || newEnd.attributes.getNamedItem("name") === null || newEnd.attributes.getNamedItem("name").value !== spanNodes[0].attributes.getNamedItem("name").value) {
          break;
        }
        newEnd = newEnd.previousSibling
      }
      endofoffset = getendOffset(spanNodes, spanNodes[0].previousSibling.length)
    }
    console.log("Calculated END OFFSET", endofoffset)

    var parent = spanNodes[0].parentNode;
    $(spanNodes[0]).contents().unwrap();
    parent.normalize();
    console.log("parent1", parent)

    parent = spanNodes[spanNodes.length - 1].parentNode;
    $(spanNodes[spanNodes.length - 1]).contents().unwrap();
    parent.normalize();
    console.log("parent2", parent)
    //console.log("can you compare null?", !newEnd.isSameNode(newStart))
    console.log("start", newStart)
    console.log("start", startOffset)
    console.log("ENDPRVE", newEnd)
    console.log("Calculated END OFFSET", endofoffset)
    if (newEnd !== null && newEnd.nextSibling !== null && !newEnd.isSameNode(newStart)) {
      newEnd = newEnd.nextSibling;
    }

    newEnd = newEnd === null ? null : XpathConversion(newEnd);
    newStart = newStart === null ? null : XpathConversion(newStart);

    newObject.push(new UpdateXpathObj(idToChange, newStart, startOffset, newEnd, endofoffset));
    console.log("cUSTOm Object", newObject);
    if (newStart !== null && newEnd !== null) {
      var fakeAnno = {
        id: idToChange,
        xpath: {
          start: newStart,
          startOffset: startOffset,
          end: newEnd,
          endOffset: endofoffset
        }
      };
      console.log("fakeAnno,", fakeAnno)
      //TODO UPDATE TO HAVE THIS PULL FROM SENDUPDATE!
      FindWords(fakeAnno);
    }
  }
  //spans that were in the parent of the span deleted
  for (var i = 0; i < nodesToUpdateOuter.length; i++) {


    console.log("is first in range", range)
    var node = nodesToUpdateOuter[i];
    var spanNodes = node.spanApearance;
    var idToChange = spanNodes[0].attributes.getNamedItem("name").value;
    var newStart = null;
    var startOffset = null;
    var endofoffset = null;
    var newEnd = null;

    //if the start of the span range is outside the delted range and on the left

    console.log("start is true")
    newStart = spanNodes[0].previousSibling
    startOffset = spanNodes[0].previousSibling.length
    console.log("startOffsetr", spanNodes[0].previousSibling)

    //if right most section is out of the inner span and not part of the parent span
    if (node.end || spanNodes[spanNodes.length - 1].parentNode.isSameNode(endRangeParent) /*add a check to see if it is in the parent*/) {
      console.log("end is true", spanNodes)
      newEnd = spanNodes[spanNodes.length - 1].previousSibling
      while (1) { //endprev.attributes.getNamedItem("name").value === spanApearance[0].attributes.getNamedItem("name").value) {
        console.log(newEnd)
        if (newEnd.nodeType == 3 || newEnd.attributes.getNamedItem("name") === null || newEnd.attributes.getNamedItem("name").value !== spanNodes[0].attributes.getNamedItem("name").value) {
          break;
        }
        newEnd = newEnd.previousSibling
      }
      endofoffset = getendOffset(spanNodes, spanNodes[0].previousSibling.length)
    }
    console.log("Calculated END OFFSET", endofoffset)

    var parent = spanNodes[0].parentNode;
    $(spanNodes[0]).contents().unwrap();
    parent.normalize();
    console.log("parent1", parent)


    //if the span for this annotation is not over only one div
    if (spanNodes.length !== 0) {
      parent = spanNodes[spanNodes.length - 1].parentNode;
      $(spanNodes[spanNodes.length - 1]).contents().unwrap();
      parent.normalize();
      console.log("parent2", parent)
    }
    //start and end xpath should be the same since it is only one div
    else {
      newStart = newEnd
    }
    //console.log("can you compare null?", !newEnd.isSameNode(newStart))
    console.log("start", newStart)
    console.log("start", startOffset)
    console.log("ENDPRVE", newEnd)
    console.log("Calculated END OFFSET", endofoffset)
    if (newEnd !== null && newEnd.nextSibling !== null && !newEnd.isSameNode(newStart)) {
      newEnd = newEnd.nextSibling;
    }

    newEnd = newEnd === null ? null : XpathConversion(newEnd);
    newStart = newStart === null ? null : XpathConversion(newStart);

    newObject.push(new UpdateXpathObj(idToChange, newStart, startOffset, newEnd, endofoffset));
    console.log("cUSTOm Object", newObject);
    if (newStart !== null && newEnd !== null) {
      var fakeAnno = {
        id: idToChange,
        xpath: {
          start: newStart,
          startOffset: startOffset,
          end: newEnd,
          endOffset: endofoffset
        }
      };
      console.log("fakeAnno,", fakeAnno)
      //TODO UPDATE TO HAVE THIS PULL FROM SENDUPDATE!
      FindWords(fakeAnno);
    }
  }


  // call update

  // if (newObject.length !== 0)
  //   sendUpdateXpaths(newObject);

  console.log("DONE!");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.msg === 'ANNOTATION_DELETED_ON_PAGE') {
    let collection = document.getElementsByName(request.id);
    console.log("COLLECTION", collection)
    updateXpaths(collection, request.id)
    // while (collection[0] !== undefined) {
    //   var parent = collection[0].parentNode;
    //   $(collection[0]).contents().unwrap();
    //   parent.normalize();
    // }

  }
  else if (request.msg === 'ANNOTATION_ADDED') {
    request.newAnno.content = request.newAnno.annotation;
    FindWords(request.newAnno);
  }

  else if (request.msg === 'DELIVER_FILTERED_ANNOTATION_TAG' && request.from === 'background') {
    window.postMessage({ type: 'FROM_CONTENT', value: request.payload.response }, "*");
  }

});
