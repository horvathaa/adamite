
import { xpathConversion, getNodesInRange } from './AnchorHelpers';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';
import '../../../../assets/img/SVGs/Default.svg';
import '../../../../assets/img/SVGs/Highlight.svg';
import '../../../../assets/img/SVGs/Todo.svg';
import '../../../../assets/img/SVGs/Question.svg';
import '../../../../assets/img/SVGs/Issue.svg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { transmitMessage } from '../anchorEventTransmitter';
/*
Bug with page overlay
*/

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
}

const Popover = ({ selection, xpathToNode, offsets, removePopover }) => {
    const [selected, setSelected] = useState(null);
    const [showQuestionMenu, setShowQuestionMenu] = useState(false);

    useEffect(() => {
        setSelected(selection.toString());
    }, []);

    const buttonClickedHandler = (event, type, content) => {
        event.stopPropagation();
        if (selected) {
            alertBackgroundOfNewSelection(selected, offsets, xpathToNode, type, content);
            selection.removeAllRanges();
            removePopover();
        }
    };


    return (
        <div className="buttonRow">
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "default")} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Default.svg')} alt="default annotation" />
                </div>
                 Normal
            </div>
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "highlight")} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Highlight.svg')} alt="highlight" />
                </div>
                Highlight
            </div>
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "to-do")} >
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Todo.svg')} alt="to-do annnotation" />
                </div>
                <div onClick={(e) => buttonClickedHandler(e, "to-do")}>
                    To-do
                </div>
            </div>
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "question")}
                onMouseEnter={() => setShowQuestionMenu(true)}
                onMouseLeave={() => setShowQuestionMenu(false)}>
                <div className="buttonIconContainer">
                    <img src={chrome.extension.getURL('Question.svg')} alt="question annnotation" />
                </div>
                Question
                {showQuestionMenu && (
                    <div className="buttonColumn">
                        <div className="onHoverCreateQuestionAnnotation" onClick={(e) => buttonClickedHandler(e, "question", "What is this?")} >
                            What is this?
                    </div>
                        <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "question", "How do I use this?")} >
                            How do I use this?
                     </div>
                    </div>
                )}
            </div>
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "issue")} >
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
    console.log("Display pop over")
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



const alertBackgroundOfNewSelection = (selection, offsets, xpath, type, content) => {
    // supporting creation of annotations in sidebar
    const annoContent = content === undefined ? "" : content;
    // console.log('transmitting content selected', annoContent);
    //Here's where issue would be 
    if (type === 'highlight') {
        transmitMessage({
            msg: 'SAVE_HIGHLIGHT', sentFrom: "AnchorCreate",
            data: {
                payload: {
                    anchor: selection,
                    xpath: xpath,
                    offsets: offsets,
                    url: getPathFromUrl(window.location.href),

                }
            }
        });
    }
    else {
        transmitMessage({
            msg: 'CONTENT_SELECTED', sentFrom: "AnchorCreate",
            data: {
                payload: {
                    selection,
                    offsets,
                    xpath,
                    type,
                    annoContent
                },
            }
        });
    }

};




export function addNewAnchor({ request, type }) {
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
        let payload = {
            xpath: xpathToNode,
            url: getPathFromUrl(window.location.href),
            anchor: selection.toString(),
            offsets: offsets,
            hostname: window.location.hostname
        };

        if (type == "reply") {
            transmitMessage({ msg: 'TRANSMIT_REPLY_ANCHOR', data: { "payload": payload } });
        } else {
            payload['newAnno'] = request.payload;
            console.log(payload);
            transmitMessage({ msg: 'SAVE_NEW_ANCHOR', data: { "payload": payload } });
        }
        selection.removeRange(rect);
    }
    else {
        openSelectAnchorToast();
    }
}

function openSelectAnchorToast() {
    let positionString = "";
    chrome.storage.sync.get(['sidebarOnLeft'], result => {
        if (result.sidebarOnLeft === undefined || result.sidebarOnLeft) {
            positionString = "top-right";
        }
        else { positionString = "top-left"; }
        toast.warning('Select text on the page to add a new anchor', {
            position: positionString,
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
        let modal = document.createElement("div");
        modal.classList.add("success-notif-div");
        document.body.appendChild(modal);
        const toastModal = <ToastContainer
            position={positionString}
            autoClose={3000}
            hideProgressBar
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />;
        ReactDOM.render(toastModal, modal);
    })
}






export const createAnnotationCallback = (response, event) => {
    console.log("c");
    console.log(response);
    if (response.sidebarOpen) {
        var selection = window.getSelection();
        console.log(selection);
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

            const rectPopover = selection.getRangeAt(0).getBoundingClientRect();
            // console.log("Display Popover");
            displayPopoverBasedOnRectPosition(rectPopover, { selection, xpathToNode, offsets });

            return;
        }
        else {
            if (!popOverAnchor.contains(event.target)) {
                removePopover();
            }
        }
    }
    else {
        return;
    }
}





// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.msg === 'ADD_NEW_ANCHOR') {
//         var selection = window.getSelection();
//         if (selection.type === 'Range') {
//             const rect = selection.getRangeAt(0);

//             //Text nodes that were highlighted by user
//             var textNodes = getNodesInRange(rect).filter(function (element) {
//                 return element.nodeType === 3 && element.data.trim() !== "";
//             });

//             const offsets = {
//                 startOffset: rect.startOffset,
//                 endOffset: rect.endOffset,
//             };

//             var tempArry = []
//             for (var i = 0; i < textNodes.length; i++) {
//                 tempArry.push(xpathConversion(textNodes[i].parentNode))
//             }

//             var xpathToNode = {
//                 start: xpathConversion(textNodes[0]),
//                 end: xpathConversion(textNodes[textNodes.length - 1]),
//                 startOffset: rect.startOffset,
//                 endOffset: rect.endOffset
//             };
//             chrome.runtime.sendMessage({
//                 msg: 'SAVE_NEW_ANCHOR',
//                 from: 'content',
//                 payload: {
//                     newAnno: request.payload,
//                     xpath: xpathToNode,
//                     url: getPathFromUrl(window.location.href),
//                     anchor: selection.toString(),
//                     offsets: offsets,
//                     hostname: window.location.hostname
//                 }
//             });
//             selection.removeRange(rect);
//         }
//         else {
//             let positionString = "";
//             chrome.storage.sync.get(['sidebarOnLeft'], result => {
//                 if (result.sidebarOnLeft === undefined || result.sidebarOnLeft) {
//                     positionString = "top-right";
//                 }
//                 else {
//                     positionString = "top-left";
//                 }
//                 toast.warning('Select text on the page to add a new anchor', {
//                     position: positionString,
//                     autoClose: 3000,
//                     hideProgressBar: true,
//                     closeOnClick: true,
//                     pauseOnHover: true,
//                     draggable: true,
//                     progress: undefined,
//                 });
//                 let modal = document.createElement("div");
//                 modal.classList.add("success-notif-div");
//                 document.body.appendChild(modal);
//                 const toastModal = <ToastContainer
//                     position={positionString}
//                     autoClose={3000}
//                     hideProgressBar
//                     newestOnTop={false}
//                     closeOnClick
//                     rtl={false}
//                     pauseOnFocusLoss
//                     draggable
//                     pauseOnHover
//                 />;
//                 ReactDOM.render(toastModal, modal);
//             })

//             // })

//         }
//     }
//     else if (request.msg === 'ADD_REPLY_ANCHOR') {
//         var selection = window.getSelection();
//         if (selection.type === 'Range') {
//             const rect = selection.getRangeAt(0);

//             //Text nodes that were highlighted by user
//             var textNodes = getNodesInRange(rect).filter(function (element) {
//                 return element.nodeType === 3 && element.data.trim() !== "";
//             });

//             const offsets = {
//                 startOffset: rect.startOffset,
//                 endOffset: rect.endOffset,
//             };

//             var tempArry = []
//             for (var i = 0; i < textNodes.length; i++) {
//                 tempArry.push(xpathConversion(textNodes[i].parentNode))
//             }

//             var xpathToNode = {
//                 start: xpathConversion(textNodes[0]),
//                 end: xpathConversion(textNodes[textNodes.length - 1]),
//                 startOffset: rect.startOffset,
//                 endOffset: rect.endOffset
//             };

//             chrome.runtime.sendMessage({
//                 msg: 'TRANSMIT_REPLY_ANCHOR',
//                 from: 'content',
//                 payload: {
//                     xpath: xpathToNode,
//                     url: getPathFromUrl(window.location.href),
//                     anchor: selection.toString(),
//                     offsets: offsets,
//                     hostname: window.location.hostname
//                 }
//             });
//             selection.removeRange(rect);
//         }
//     }
// });

// export const removeAnnotationWidget = (event) => {
//     chrome.runtime.sendMessage({
//         msg: 'CONTENT_NOT_SELECTED',
//         from: 'content',
//     });
// }

// export const createAnnotation = (event) => {


//     chrome.runtime.sendMessage({
//         msg: 'REQUEST_SIDEBAR_STATUS',
//         from: 'content'
//     }, 
//     response => {
//         if (response.sidebarOpen) {
//             var selection = window.getSelection();

//             if (selection.type === 'Range') {
//                 const rect = selection.getRangeAt(0);

//                 //Text nodes that were highlighted by user
//                 var textNodes = getNodesInRange(rect).filter(function (element) {
//                     return element.nodeType === 3 && element.data.trim() !== "";
//                 });

//                 const offsets = {
//                     startOffset: rect.startOffset,
//                     endOffset: rect.endOffset,
//                 };

//                 var tempArry = []
//                 for (var i = 0; i < textNodes.length; i++) {
//                     tempArry.push(xpathConversion(textNodes[i].parentNode))
//                 }

//                 var xpathToNode = {
//                     start: xpathConversion(textNodes[0]),
//                     end: xpathConversion(textNodes[textNodes.length - 1]),
//                     startOffset: rect.startOffset,
//                     endOffset: rect.endOffset
//                 };

//                 const rectPopover = selection.getRangeAt(0).getBoundingClientRect();
//                 displayPopoverBasedOnRectPosition(rectPopover, { selection, xpathToNode, offsets });

//                 return;
//             }
//             else {
//                 if (!popOverAnchor.contains(event.target)) {
//                     removePopover();
//                 }
//             }
//         }
//         else {
//             return;
//         }
//     });
// }


// export function addReplyAnchor() {
//     var selection = window.getSelection();
//     if (selection.type === 'Range') {
//         const rect = selection.getRangeAt(0);

//         //Text nodes that were highlighted by user
//         var textNodes = getNodesInRange(rect).filter(function (element) {
//             return element.nodeType === 3 && element.data.trim() !== "";
//         });

//         const offsets = {
//             startOffset: rect.startOffset,
//             endOffset: rect.endOffset,
//         };

//         var tempArry = []
//         for (var i = 0; i < textNodes.length; i++) {
//             tempArry.push(xpathConversion(textNodes[i].parentNode))
//         }

//         var xpathToNode = {
//             start: xpathConversion(textNodes[0]),
//             end: xpathConversion(textNodes[textNodes.length - 1]),
//             startOffset: rect.startOffset,
//             endOffset: rect.endOffset
//         };

//         chrome.runtime.sendMessage({
//             msg: 'TRANSMIT_REPLY_ANCHOR',
//             from: 'content',
//             payload: {
//                 xpath: xpathToNode,
//                 url: getPathFromUrl(window.location.href),
//                 anchor: selection.toString(),
//                 offsets: offsets,
//                 hostname: window.location.hostname
//             }
//         });
//         selection.removeRange(rect);
//     }
// }


// const highlightButtonClickedHandler = (event) => {
//     event.stopPropagation();
//     if (selected) {
//         alertBackgroundOfNewSelection(selected, offsets, xpathToNode, "highlight");
//         selection.removeAllRanges();
//         removePopover();
//     }
// };



// const defaultButtonClickedHandler = (event) => {
//     event.stopPropagation();
//     if (selected) {
//         alertBackgroundOfNewSelection(selected, offsets, xpathToNode, "default");
//         selection.removeAllRanges()
//         removePopover();
//     }
// };

// const todoButtonClickedHandler = (event) => {
//     event.stopPropagation();
//     if (selected) {
//         alertBackgroundOfNewSelection(selected, offsets, xpathToNode, "to-do");
//         selection.removeAllRanges();
//         removePopover();
//     }
// };





// const questionButtonClickedHandler = (event) => {
//     event.stopPropagation();
//     if (selected) {
//         alertBackgroundOfNewSelection(selected, offsets, xpathToNode, "question");
//         selection.removeAllRanges();
//         removePopover();
//     }
// };

// const issueButtonClickedHandler = (event) => {
//     event.stopPropagation();
//     if (selected) {
//         alertBackgroundOfNewSelection(selected, offsets, xpathToNode, "issue");
//         selection.removeAllRanges();
//         removePopover();
//     }
// };


// const whatQuestionClickedHandler = (event) => {
//     event.stopPropagation();
//     const questionContent = "What is this?";
//     alertBackgroundOfNewSelection(selected, offsets, xpathToNode, "question", questionContent);
//     selection.removeAllRanges();
//     removePopover();
// };

// const howQuestionClickedHandler = (event) => {
//     event.stopPropagation();
//     const questionContent = "How do I use this?";
//     alertBackgroundOfNewSelection(selected, offsets, xpathToNode, "question", questionContent);
//     selection.removeAllRanges();
//     removePopover();
// };
