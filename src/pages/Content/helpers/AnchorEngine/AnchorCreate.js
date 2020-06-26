
import { xpathConversion, getNodesInRange } from './AnchorHelpers';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';

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

    const defaultButtonClickedHandler = (event) => {
        event.stopPropagation();
        alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode, "default");
        removePopover();
    };

    const todoButtonClickedHandler = (event) => {
        event.stopPropagation();
        alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode, "to-do");
        removePopover();
    };

    const questionButtonClickedHandler = (event) => {
        event.stopPropagation();
        alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode, "question");
        removePopover();
    };

    const issueButtonClickedHandler = (event) => {
        event.stopPropagation();
        alertBackgroundOfNewSelection(selection.toString(), offsets, xpathToNode, "issue");
        removePopover();
    };

    return (
        <div className="buttonRow">
            <div className="onHoverCreateAnnotation" onClick={defaultButtonClickedHandler} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Default.svg')} alt="default annotation" />
                </div>
                 Default
            </div>
            <div className="onHoverCreateAnnotation" onClick={highlightButtonClickedHandler} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Highlight.svg')} alt="highlight" />
                </div>
                Highlight
            </div>
            <div className="onHoverCreateAnnotation" onClick={todoButtonClickedHandler} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Todo.svg')} alt="to-do annnotation" />
                </div>
                To-do
            </div>
            <div className="onHoverCreateAnnotation" onClick={questionButtonClickedHandler} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Question.svg')} alt="question annnotation" />
                </div>
                Question
            </div>
            <div className="onHoverCreateAnnotation" onClick={issueButtonClickedHandler} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Issue.svg')} alt="issue annnotation" />
                </div>
                Issue
            </div>
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

const alertBackgroundOfNewSelection = (selection, offsets, xpath, type) => {
    // supporting creation of annotations in sidebar
    chrome.runtime.sendMessage({
        msg: 'CONTENT_SELECTED',
        from: 'content',
        payload: {
            selection,
            offsets,
            xpath,
            type
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
