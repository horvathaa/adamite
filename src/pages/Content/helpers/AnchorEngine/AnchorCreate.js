
import { xpathConversion, getNodesInRange } from './AnchorHelpers';

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

export const createAnnotation = () => {
    var selection = window.getSelection();

    if (selection.type === 'Range') {
        const rect = selection.getRangeAt(0);

        console.log("this is our selection 1 ", selection)
        console.log("this is our selection 2 ", rect)

        //Text nodes that were highlighted by user
        var textNodes = getNodesInRange(rect).filter(function (element) {
            return element.nodeType === 3 && element.data.trim() !== "";
        });

        const offsets = {
            startOffset: rect.startOffset,
            endOffset: rect.endOffset,
        };

        //var xpathToNode = [];
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
        console.log("CREATED ANNOTATION", xpathToNode)
        alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode);
    }

}
