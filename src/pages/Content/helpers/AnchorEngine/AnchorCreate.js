
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
