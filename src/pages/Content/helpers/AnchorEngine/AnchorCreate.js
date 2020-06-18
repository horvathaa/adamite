
import { xpathConversion, getNodesInRange } from './AnchorHelpers';

var queue = [];

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'ADD_NEW_ANCHOR') {
        queue.push(request.payload);
    }
});

export const createAnnotation = () => {
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

        var tempArry = []
        for (var i = 0; i < textNodes.length; i++) {
            tempArry.push(xpathConversion(textNodes[i].parentNode))
        }

        var xpathToNode = {
            start: xpathConversion(textNodes[0]),
            end: xpathConversion(textNodes[textNodes.length - 1]),
            startOffset: rect.startOffset,
            endOffset: rect.endOffset
        };

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
                    hostname: window.location.hostname
                }
            });
        }
        else {
            alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode);
        }
    }

}
