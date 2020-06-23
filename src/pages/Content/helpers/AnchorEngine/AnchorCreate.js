
import { xpathConversion, getNodesInRange } from './AnchorHelpers';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

var queue = [];

const Popover = ({ selection, xpathToNode, offsets, removePopover }) => {
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        setSelected(selection.toString());
    }, []);

    const highlightButtonClickedHandler = (event) => {
        event.stopPropagation();
        if (selected) {
            chrome.runtime.sendMessage({
                msg: 'SAVE_HIGHLIGHT',
                payload: {
                    anchor: selected,
                    xpath: xpathToNode,
                    offsets: offsets,
                    url: window.location.href,
                },
            });
            removePopover();
        }
    };

    return (
        <div
            style={{
                background: 'gray',
                color: 'white',
                fontSize: 12,
                fontFamily: 'Arial',
                padding: 5,
                borderRadius: 5,
                cursor: 'pointer',
            }}
            onClick={highlightButtonClickedHandler}
        >
            Highlight
        </div>
    );
};

//
//
//
//
/* Set up popover box anchor */
const popOverAnchor = document.body.appendChild(document.createElement('div'));
popOverAnchor.style.zIndex = '33333';
popOverAnchor.style.position = 'absolute';
popOverAnchor.setAttribute('id', 'popover-box');

const removePopover = () => {
    try {
        ReactDOM.unmountComponentAtNode(popOverAnchor);
    } catch (e) {
        // console.log(e);
    }
};

function displayPopoverBasedOnRectPosition(rect, props) {
    popOverAnchor.top = '0px';
    popOverAnchor.style.left = `0px`;

    ReactDOM.render(
        <Popover removePopover={removePopover} {...props} />,
        popOverAnchor
    );

    // adjusting position of popover box after mounting
    popOverAnchor.style.top = `${rect.bottom + 5 + window.scrollY}px`;
    let leftPosition = Math.floor(
        rect.left + rect.width - popOverAnchor.clientWidth
    );
    leftPosition = leftPosition >= 10 ? leftPosition : 10;
    popOverAnchor.style.left = `${leftPosition}px`;
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.msg === 'ADD_NEW_ANCHOR') {
        queue.push(request.payload);
    }
});

export const removeAnnotationWidget = (event) => {
    chrome.runtime.sendMessage({
        msg: 'CONTENT_NOT_SELECTED',
        from: 'content',
    });
}

export const createAnnotation = (event) => {
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
            const rectPopover = selection.getRangeAt(0).getBoundingClientRect();
            displayPopoverBasedOnRectPosition(rectPopover, { selection, xpathToNode, offsets });
        }
    }
    else {
        if (!popOverAnchor.contains(event.target)) {
            removePopover();
        }
    }

}
