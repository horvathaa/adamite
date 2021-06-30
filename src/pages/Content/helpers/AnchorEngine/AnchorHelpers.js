import $ from 'jquery';
//import * as xpathRange from "./packages/xpath-range";
//var xpathRange = require('xpath-range');


export const findAllMatchingPhrases = (phrase) => {
    let words = [];

    let walkDOM = function (node, func) {
        func(node);
        node = node.firstChild;
        while(node) {
            walkDOM(node, func);
            node = node.nextSibling;
        }

    };

    walkDOM(document.body, function (node) {

        if (node.nodeName === '#text') {
            var text = node.textContent;

            text = text.replace(/[^A-Za-z]/g, ' ');

            text = text.split(' ');

            if (text.length) {

                for (var i = 0, length = text.length; i < length; i += 1) {
                    var matched = false,
                        word = text[i];

                    for (var j = 0, numberOfWords = words.length; j < numberOfWords; j += 1) {
                        if (words[j][0] === word) {
                            matched = true;
                            words[j][1] += 1;
                        }
                    }

                    if (!matched) {
                        words.push([word, 1]);
                    }

                }
            }
        }
    });

    var displayWordList = function (words) {
        for (var i = 0, length = words.length; i < length; i += 1) {
            console.log(words[i][0], words[i][1]);
        }
    };

    displayWordList(words);
    return words;
}


// Equivalent -> xpath.fromNode;
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

// Equivalent -> xpath.toNode;
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