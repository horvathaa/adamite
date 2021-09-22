import React, { useEffect, useContext, useState } from 'react';
import RichTextEditor2 from '../../../RichTextEditor/RichTextEditor2';
import TagsInput from 'react-tagsinput';
import classNames from 'classnames';
import '../Annotation.css';
import './ReplyEditor.module.css';
import '../../../CardWrapper/CardWrapper.module.css';
import addAnchor from '../../../../../../assets/img/SVGs/NewAnchor2.svg';
import { SplitButton, Button, Dropdown as BootstrapDropdown } from 'react-bootstrap';
import AnnotationContext from "../AnnotationContext";
import { v4 as uuidv4 } from 'uuid';
import cleanReplyModel from './ReplyModel';
import Tooltip from '@material-ui/core/Tooltip';
import { formatTimestamp } from '../../../../utils';

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


const ReplyEditor = ({ reply = null, finishReply = () => { } }) => {
    const ctx = useContext(AnnotationContext);
    const id = ctx.anno.id;
    const replies = ctx.anno.replies;
    let showQuestionAnswerInterface = ctx.anno.type === 'question';
    const isNewReply = reply === null;
    const replyMetadata = {
        author: ctx.currentUser.email.substring(0, ctx.currentUser.email.indexOf('@')),
        url: [ctx.currentUrl], authorId: ctx.currentUser.uid, hostname: new URL(ctx.currentUrl).hostname,
        replyId: uuidv4(), timestamp: new Date().getTime()
    }
    const [newReply, setNewReply] = useState(cleanReplyModel(reply));

    useEffect(() => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.msg === 'TRANSMIT_REPLY_ANCHOR' && request.from === 'content') {
                const { xpath, url, anchor, offsets, hostname } = request.payload;
                setNewReply({
                    ...newReply,
                    anchor: {
                        xpath: xpath,
                        url: url,
                        anchor: anchor,
                        offsets: offsets,
                        hostname: hostname,
                        id: uuidv4()
                    }
                });
                const highlightInfo = {
                    xpath, offsets
                };
                chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        msg: 'TEMP_ANNOTATION_ADDED',
                        newAnno: highlightInfo
                    });
                });
            }
        });
    });

    const replyChangeHandler = (value, contentBlock) => { setNewReply({ ...newReply, replyContent: value, replyBlock: contentBlock }); }
    const cancelReply = () => { setNewReply(reply); finishReply({ reply: reply }); }
    const tagsHandleChange = (newTag) => { setNewReply({ ...newReply, tags: newTag }) }

    const markAnswer = () => { setNewReply({ ...newReply, answer: !newReply.answer, question: false }) }
    const markQuestion = () => { setNewReply({ ...newReply, answer: false, question: !newReply.question }) }

    
    
    
    const requestNewAnchor = () => {

        let replyId;
        if (replyMetadata.replyId === undefined) {
            if (replies === undefined) {
                replyId = 0;
            }
            else {
                replyId = replies.length;
            }
        } else {
            replyId = replyMetadata.replyId;
        }
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                msg: 'ADD_REPLY_ANCHOR',
                payload: {
                    newAnno: {
                        replyId,
                        id,
                        replies
                    }
                }
            });
        });
    }

    const submitReply = (answer = false) => {
        const answerBool = typeof answer === 'boolean' ? answer : false; // stupid fix sigh
        if (isNewReply) {
            let tempReplies = ctx.anno.replies;
            const reply = { ...newReply, ...replyMetadata, answer: answerBool };
            if (tempReplies !== undefined && ctx.anno.replies.length) {
                tempReplies.push(cleanReplyModel(reply))
            } else {
                tempReplies = [cleanReplyModel(reply)];
            }
            ctx.anno.type === 'question' && answer ? ctx.updateAnnotation({ ...ctx.anno, replies: tempReplies, isClosed: answerBool, howClosed: "Answered", pinned: false }) : ctx.updateAnnotation({ ...ctx.anno, replies: tempReplies });


        } else {
            let replies = ctx.anno.replies.filter(r => r.replyId !== newReply.replyId);
            const repliesToTransmit = replies.length ? replies.concat(cleanReplyModel(newReply)) : [cleanReplyModel(newReply)];
            ctx.anno.type === 'question' && answerBool ? ctx.updateAnnotation({ ...ctx.anno, replies: repliesToTransmit, isClosed: answerBool, howClosed: "Answered", pinned: false }) : ctx.updateAnnotation({ ...ctx.anno, replies: repliesToTransmit });
        }
        if (newReply.anchor !== null) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, { msg: 'REMOVE_TEMP_ANNOTATION', });
            });
            if (!ctx.anno.url.includes(newReply.anchor.url)) { ctx.updateAnnotation({ ...ctx.anno, url: ctx.anno.url.concat([newReply.anchor.url]) }) }
        }
        finishReply();
    }

    const defaultRenderTag = (props) => {
        let {tag, key, disabled, onRemove, classNameRemove, getTagDisplayValue, ...other} = props
        return (
          <span key={key} {...other}>
            {getTagDisplayValue(tag.length > 12 ? tag.slice(0,12) + "..." : tag)}
            {!disabled &&
              <a className={classNameRemove} onClick={(e) => onRemove(key)} />
            }
          </span>
        )
      }

    let submission = showQuestionAnswerInterface ? (
        <SplitButton
            key="typeOfReply"
            id="dropdown-split-variants-secondary"
            variant="secondary"
            title={"Post Answer"}
            onClick={_ => submitReply(true)}
        >
            <BootstrapDropdown.Item
                onClick={_ => submitReply(false)} eventKey="2">Reply</BootstrapDropdown.Item>
        </SplitButton>) : (
        <Button
            className= "TagButton"
            key="replySubmit"
            // id="dropdown-split-variants-secondary"
            variant="secondary"
            title={"Post Reply"}
            onClick={submitReply}
        >Post Reply </Button>
    )

    return (
        <React.Fragment>
            <div className="ReplyHeader">
                <hr className="divider" id="editor" />
            </div>
            {newReply.anchor !== null ? (
                <div className="SelectedTextContainer">
                    {newReply.anchor.anchor}
                </div>
            ) : (null)}
            <div className="ReplyField">
                {/* change to RTE2 */}
                <RichTextEditor2
                   
                        // annotationContent = {newReply.replyBlock ? newReply.replyBlock : newReply.replyContent}
                        initialContent={
                            isJson(newReply.replyContent) ? 
                                JSON.parse(newReply.replyContent).children : 
                                [ {
                                        type:'paragraph',
                                        children: [{
                                            text: newReply.replyContent
                                        }]
                                    }
                                ]
                        }
                        initialLanguage={
                            isJson(newReply.replyContent) ? 
                                JSON.parse(newReply.replyContent).language :
                                'js'
                        } 
                    
                    
                    annotationChangeHandler={replyChangeHandler}
                 />
                <div className="Tag-Container">
                    <div className="row">
                        <div className="TextareaContainer">
                            <TagsInput value={newReply.tags ?? []} onChange={tagsHandleChange} renderTag={defaultRenderTag} onlyUnique={true} />
                        </div>
                    </div>
                </div>
                <div className="ReplyButtonRow">
                    <div className={classNames({ buttonCol: true })}>
                        <div className="buttonRow btn btn-cancel TagButton">
                        <Tooltip title={"Add new anchor to annotation"} aria-label="add new anchor tooltip">
                                <img src={addAnchor} alt='add new anchor' onClick={requestNewAnchor} className="ReplyAnchor"/>
                        </Tooltip>          
                        </div>
                        &nbsp; &nbsp;
                        <div className="cancelButtonContainer">
                            <button onClick={cancelReply} className="btn Cancel-Button TagButton">Cancel</button> &nbsp; &nbsp;
                        </div>
                        {submission}
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}


export default ReplyEditor;

