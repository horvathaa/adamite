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

var queue = [];

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

function sharedStart(array) {
    var A = array.concat().sort(),
        a1 = A[0], a2 = A[A.length - 1], L = a1.length, i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
    return a1.substring(0, i);
}

function GetTextPosition() {

}

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
            return XpathConversion(element.parentNode) + '/' +/* (element.nodeType === 3 ? ('text()' + '[' + (txt + 1) + ']') : (*/element.tagName + '[' + (ix + 1) + ']';
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
            ix++;
        // else if (sibling.nodeType === 3) {
        //     txt++
        // }
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
        var tempArry = []
        for (var i = 0; i < textNodes.length; i++) {
            tempArry.push(XpathConversion(textNodes[i].parentNode))
        }

        var master = sharedStart(tempArry);

        // for (var i = 0; i < textNodes.length; i++) {
        // xpathToNode.push(
        //   {
        //     xpath: XpathConversion(textNodes[i].parentNode) + "/text()",
        //     masterXpath: master,
        //     text: textNodes[i].data,
        //     offsets: {
        //       startOffset: i === 0 ? rect.startOffset : 0,
        //       endOffset: i === textNodes.length - 1 ? rect.endOffset : 0
        //     }
        //   }
        // );

        xpathToNode.push({
            start: XpathConversion(textNodes[0].parentNode),
            end: XpathConversion(textNodes[textNodes.length - 1].parentNode),
            startOffset: rect.startOffset,
            endOffset: rect.endOffset
        });

        if (queue.length) {
            let newAnno = queue.pop();
            chrome.runtime.sendMessage({
                msg: 'SAVE_NEW_ANCHOR',
                from: 'content',
                payload: {
                    newAnno: newAnno,
                    xpath: xpathToNode,
                    url: window.location.href,
                    anchor: selection.toString(),
                    offsets: offsets,
                }
            });
        }
        else {
            // console.log('do we do this every time???', xpathToNode);
            alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode);
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'ADD_NEW_ANCHOR') {
        queue.push(request.payload);
    }
})
