
import { xpathConversion, getNodesInRange } from './AnchorHelpers';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './anchor-box.css';
import '../../../../assets/img/SVGs/Default.svg';
import '../../../../assets/img/SVGs/Highlight.svg';
import '../../../../assets/img/SVGs/Todo.svg';
import '../../../../assets/img/SVGs/Question.svg';
import '../../../../assets/img/SVGs/Issue.svg';
import { BiComment, BiEraser, BiTask, BiGroup, BiChevronDown } from 'react-icons/bi';
import { AiOutlineQuestionCircle, AiOutlineExclamationCircle } from 'react-icons/ai';

import { ToastContainer, toast } from 'react-toastify';
import { FaHighlighter } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import { transmitMessage } from '../anchorEventTransmitter';
import { v4 as uuidv4 } from 'uuid';
import { StepContent } from '@material-ui/core';
/*
Bug with page overlay
*/

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
}

const CommonActionPopover = ({ selection, xpathToNode, offsets, removePopover }) => {
    const [selected, setSelected] = useState(null);
    const [lastUsedTags, setLastUsedTags] = useState([]);
    const [lastUsedGroup, setLastUsedGroup] = useState([]);
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [showTextEntry, setShowTextEntry] = useState(false);
    const [groupTextContent, setGroupTextContent] = useState("");
    const newAnnoId = uuidv4();
    const url = getPathFromUrl(window.location.href);

    useEffect(() => {
        setSelected(selection.toString());
        chrome.storage.local.get(['lastUsedTags'], ( { lastUsedTags } ) => {
            setLastUsedTags(lastUsedTags);
        })
        chrome.storage.local.get(['lastGroup'], ( { lastGroup } ) => {
            setLastUsedGroup(lastGroup);
        })
    }, []);

    const createAnnotationTagged = (event, type = "default", tag) => {
        event.stopPropagation();
        if (selected) {
            transmitMessage({
                msg: 'CREATE_ANNOTATION', sentFrom: "AnchorCreate",
                data: {
                    payload: {
                        anchor: selected,
                        xpath: xpathToNode,
                        offsets: offsets,
                        url: url,
                        newAnno: {
                            id: newAnnoId,
                            type: type,
                            content: '',
                            replies: [],
                            tags: [tag],
                            isPrivate: true,
                            groups: [],
                            childAnchor: [
                                {
                                    id: uuidv4(),
                                    anchor: selected,
                                    // hostname: url.hostname,
                                    parentId: newAnnoId,
                                    xpath: xpathToNode,
                                    offsets: offsets,
                                    url: url,
                                    tags: []
                                }
                            ]
                        }
                    }
                }
            });
            selection.removeAllRanges();
            removePopover();
        }

    }

    const createAnnotationInGroup = (event) => {
        event.stopPropagation();
        if (selected) {
            transmitMessage({
                msg: 'CREATE_ANNOTATION', sentFrom: "AnchorCreate",
                data: {
                    payload: {
                        anchor: selected,
                        xpath: xpathToNode,
                        offsets: offsets,
                        url: url,
                        newAnno: {
                            id: newAnnoId,
                            type: "default",
                            content: groupTextContent.length ? groupTextContent : '',
                            replies: [],
                            tags: [],
                            isPrivate: true,
                            groups: lastUsedGroup !== undefined && lastUsedGroup !== null && lastUsedGroup.length ? lastUsedGroup : [],
                            childAnchor: [
                                {
                                    id: uuidv4(),
                                    anchor: selected,
                                    // hostname: url.hostname,
                                    parentId: newAnnoId,
                                    xpath: xpathToNode,
                                    offsets: offsets,
                                    url: url,
                                    tags: []
                                }
                            ]
                        }
                    }
                }
            });
            selection.removeAllRanges();
            removePopover();
        }

    }

    return (
        <div className="CreatAnnotationRow">
            <div className="onHoverCreateAnnotation" 
                onMouseEnter={() => setShowTagMenu(true)}
                onMouseLeave={() => setShowTagMenu(false)}
            >
                <div className="buttonIconContainer">
                    <BiComment alt="default tagged annotation" className="svg-button" />
                </div>
                Use Tags
                {showTagMenu && lastUsedTags?.length ? 
                <div className="buttonColumn">
                    {lastUsedTags.map(tag => {
                        return (
                            <div className="onHoverCreateAnnotation" onClick={(e) => createAnnotationTagged(e, "default", tag)} >
                                {tag}
                            </div>
                        )
                    })}
                </div> : (null)}
            </div>
            <div className="onHoverCreateAnnotation" >
                <div className="groupButton" onClick={(e) => createAnnotationInGroup(e)}>
                    <div className="buttonIconContainer"  >
                        <BiGroup alt="group annotation" className="svg-button" />
                    </div>
                    Use Last Group
                </div>
                <div className="buttonColumn"
                onMouseEnter={() => setShowTextEntry(true)}
                onMouseLeave={() => setShowTextEntry(false)}>
                {showTextEntry ? (
                    <div>
                        <textarea type="text" id="groupContentWindow" onKeyDown={(e) => {
                            if(e.key === "Enter") {
                                createAnnotationInGroup(e)
                            }
                        }} onChange={_ => setGroupTextContent(document.getElementById('groupContentWindow').value)}/>
                    </div>
                ) : ("...")}
                </div>
            </div>
        </div>
    );


}

const Popover = ({ selection, xpathToNode, offsets, rectPopover, removePopover }) => {
    const [selected, setSelected] = useState(null);
    const [showQuestionMenu, setShowQuestionMenu] = useState(false);

    useEffect(() => {
        setSelected(selection.toString());
    }, []);

    const buttonClickedHandler = (event, type, content) => {
        event.stopPropagation();
        if (selected) {
            alertBackgroundOfNewSelection(selected, offsets, xpathToNode, type, content, rectPopover);
            selection.removeAllRanges();
            removePopover();
        }
    };


    return (
        <div className="CreatAnnotationRow">
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "default")} >
                <div className="buttonIconContainer">
                    <BiComment alt="default annotation" className="svg-button" />
                </div>
                Normal
            </div>
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "highlight")} >
                <div className="buttonIconContainer">
                    <FaHighlighter className="svg-button" />
                </div>
                Highlight
            </div>
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "to-do")} >
                <div className="buttonIconContainer">
                    <BiTask alt="to-do annnotation" className="svg-button" />
                </div>
                <div onClick={(e) => buttonClickedHandler(e, "to-do")}>
                    To-do
                </div>
            </div>
            <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "question")}
                onMouseEnter={() => setShowQuestionMenu(true)}
                onMouseLeave={() => setShowQuestionMenu(false)}>
                <div className="buttonIconContainer">
                    <AiOutlineQuestionCircle alt="question annnotation" className="svg-button" />
                </div>
                Question
                {showQuestionMenu && (
                    <div className="buttonColumn">
                        <div className="onHoverCreateAnnotation" onClick={(e) => buttonClickedHandler(e, "question", "What is this?")} >
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
                    <AiOutlineExclamationCircle alt="issue annnotation" className="svg-button" />
                </div>
                Issue
            </div>
        </div>
    );
};


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
    // console.log("Display pop over")
    chrome.storage.local.get(['annotateOnly'], ({ annotateOnly }) => {
        if(annotateOnly) {
            ReactDOM.render(
                <CommonActionPopover removePopover={removePopover} {...props} />,
                popOverAnchor
            );
        }
        else {
            ReactDOM.render(
                <Popover removePopover={removePopover} {...props} />,
                popOverAnchor
            );
        }
    })
    

    // adjusting position of popover box after mounting
    popOverAnchor.style.top = `${rect.bottom + 5 + window.scrollY}px`;
    let leftPosition = Math.floor(
        rect.left + rect.width - popOverAnchor.clientWidth
    );
    leftPosition = leftPosition >= 10 ? leftPosition : 10;
    popOverAnchor.style.left = `${leftPosition}px`;
}



const alertBackgroundOfNewSelection = (selection, offsets, xpath, type, content, rectPopover) => {
    // supporting creation of annotations in sidebar
    const annoContent = content === undefined ? "" : content;
    //Here's where issue would be 
    const newAnnoId = uuidv4();
    const url = getPathFromUrl(window.location.href);
    if (type === 'highlight') {
        transmitMessage({
            msg: 'CREATE_ANNOTATION', sentFrom: "AnchorCreate",
            data: {
                payload: {
                    anchor: selection,
                    xpath: xpath,
                    offsets: offsets,
                    url: url,
                    newAnno: {
                        id: newAnnoId,
                        type: 'highlight',
                        content: '',
                        replies: [],
                        tags: [],
                        isPrivate: true,
                        groups: [],
                        childAnchor: [
                            {
                                id: uuidv4(),
                                anchor: selection,
                                // hostname: url.hostname,
                                parentId: newAnnoId,
                                xpath: xpath,
                                offsets: offsets,
                                url: url,
                                tags: []
                            }
                        ]
                    }
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


export function addAutomatedAnchors({ request, pairs }) {
    const { newAnno, anchorText } = request.payload;
    const newAnchors = pairs.map(p => {
        return {
            parentId: newAnno.id,
            id: uuidv4(),
            xpath: p.xpath,
            url: getPathFromUrl(window.location.href),
            anchor: anchorText,
            offsets: {startOffset: p.xpath.startOffset, endOffset: p.xpath.endOffset},
            hostname: window.location.hostname,
            tags: []
        }
    })

    const newA = { ...newAnno, childAnchor: newAnno.childAnchor.concat(newAnchors) };
    transmitMessage({ msg: 'ANNOTATION_UPDATED', data: { "payload": { newAnno: newA, updateType: "NewAnchor" } } });

}




export function addNewAnchor({ request, type }) {
    // console.log("aff new Anchor")
    var selection = window.getSelection();
    const { newAnno, anchorCreator } = request.payload;
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

        // var tempArry = []
        // for (var i = 0; i < textNodes.length; i++) {
        //     tempArry.push(xpathConversion(textNodes[i].parentNode))
        // }

        var xpathToNode = {
            start: xpathConversion(textNodes[0]),
            end: xpathConversion(textNodes[textNodes.length - 1]),
            startOffset: rect.startOffset,
            endOffset: rect.endOffset
        };

        let anchor = {
            parentId: newAnno.id,
            id: uuidv4(),
            xpath: xpathToNode,
            url: getPathFromUrl(window.location.href),
            anchor: selection.toString(),
            offsets: offsets,
            hostname: window.location.hostname,
            tags: [],
            anchorCreator: anchorCreator
        };

        if (newAnno.url !== undefined) {
            newAnno.url = newAnno.url.includes(anchor.url) ? newAnno.url : newAnno.url.concat([anchor.url]);
        }


        if (type == "reply") {
            transmitMessage({ msg: 'TRANSMIT_REPLY_ANCHOR', data: { "payload": anchor } });

        } else {
            let childAnchor = [...newAnno.childAnchor, anchor];
            const newA = { ...newAnno, childAnchor: childAnchor };
            transmitMessage({ msg: 'ANNOTATION_UPDATED', data: { "payload": { newAnno: newA, updateType: "NewAnchor" } } });
        }
        selection.removeAllRanges();
        removePopover();
    }
    else {
        openSelectAnchorToast();
    }
}

function openSelectAnchorToast() {
    let positionString = "";
    chrome.storage.sync.get(['sidebarOnLeft'], result => {
        if (result.sidebarOnLeft) {
            positionString = "top-right";
        }
        else { positionString = "top-left"; }
        toast.warning('To add a new anchor, first select text on the page, then click the anchor plus button', {
            position: positionString,
            autoClose: 4000,
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
            autoClose={4000}
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
    // response is whether or not the sidebar is open
    // we only want to show the pop up if the sidebar is open
    if (response || response === 'annotateOnly') {
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

            // var tempArry = []
            // for (var i = 0; i < textNodes.length; i++) {
            //     tempArry.push(xpathConversion(textNodes[i].parentNode))
            // }

            var xpathToNode = {
                start: xpathConversion(textNodes[0]),
                end: xpathConversion(textNodes[textNodes.length - 1]),
                startOffset: rect.startOffset,
                endOffset: rect.endOffset
            };

            const rectPopover = rect.getBoundingClientRect();
            // console.log("Display Popover", rectPopover);
            displayPopoverBasedOnRectPosition(rectPopover, { selection, xpathToNode, offsets, rectPopover });

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
