import React, { Component, useEffect, useContext, useState } from 'react';
import RichTextEditor from '../../../RichTextEditor/RichTextEditor';
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
import { formatTimestamp } from '../../../../utils';


const ReplyEditor = ({ reply = null, finishReply = () => { } }) => {
    const ctx = useContext(AnnotationContext);
    const id = ctx.anno.id;
    const replies = ctx.anno.replies;
    let showQuestionAnswerInterface = ctx.anno.type === 'question';
    const isNewReply = reply === null;
    const [newReply, setNewReply] = useState(cleanReplyModel(reply));

    useEffect(() => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.msg === 'TRANSMIT_REPLY_ANCHOR' && request.from === 'content') {
                const { xpath, url, anchor, offsets, hostname } = request.payload;
                setNewReply({
                    ...newReply,
                    xpath: xpath,
                    url: url,
                    anchor: anchor,
                    offsets: offsets,
                    hostname: hostname
                })

            }
        });
    });

    const replyChangeHandler = (value) => { setNewReply({ ...newReply, replyContent: value }); }
    const cancelReply = () => { setNewReply(reply); finishReply({ reply: reply }); }
    const tagsHandleChange = (newTag) => { setNewReply({ ...newReply, tags: newTag }) }

    const markAnswer = () => { setNewReply({ ...newReply, answer: !newReply.answer, question: false }) }
    const markQuestion = () => { setNewReply({ ...newReply, answer: false, question: !newReply.question }) }

    const requestNewAnchor = () => {

        let replyId;
        if (newReply.replyId === undefined) {
            if (replies === undefined) {
                replyId = 0;
            }
            else {
                replyId = replies.length;
            }
        } else {
            replyId = newReply.replyId;
        }
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                msg: 'ADD_REPLY_ANCHOR',
                payload: {
                    replyId,
                    id,
                    replies
                }
            });
        });
    }

    const submitReply = (e, adopted, answer) => {
        if (isNewReply) {
            // console.log('in here', ctx.anno.replies);
            let tempReplies = ctx.anno.replies;
            if (tempReplies !== undefined && ctx.anno.replies.length) {
                tempReplies.push(cleanReplyModel(newReply))
            } else {
                tempReplies = [cleanReplyModel(newReply)];
            }
            // const repliesToTransmit = replies;
            console.log('replies', tempReplies, newReply);
            setNewReply({
                url: ctx.currentUrl,
                author: ctx.currentUser,
                timestamp: new Date().getTime(),
                authorId: ctx.currentUser.uid
            })
            ctx.updateAnnotation({ ...ctx.anno, replies: tempReplies });


        } else {
            let replies = ctx.anno.replies.filter(r => r.replyId !== newReply.replyId);
            const repliesToTransmit = replies.concat(cleanReplyModel(newReply));
            ctx.updateAnnotation({ ...ctx.anno, replies: repliesToTransmit });

            // chrome.runtime.sendMessage({
            //     msg: 'ADD_NEW_REPLY',
            //     payload: {
            //         replyId: replies !== undefined ? replies.length : 0,
            //         id: id,
            //         reply: this.state.reply,
            //         replyTags: this.state.replyTags,
            //         answer: answer !== undefined ? answer : false,
            //         question: this.state.question,
            //         xpath: this.state.xpath !== undefined ? this.state.xpath : null,
            //         anchor: this.state.anchor,
            //         hostname: this.state.hostname,
            //         url: this.state.url,
            //         offsets: this.state.offsets !== undefined ? this.state.offsets : null,
            //         adopted: adopted !== undefined ? adopted : false
            //     }
            // }, (response) => {
            //     if (response.msg === 'DONE') {
            //         if (adopted) {
            //             const replyId = this.props.replies !== undefined ? this.props.replies.length : 0;
            //             chrome.runtime.sendMessage({
            //                 msg: 'REQUEST_ADOPTED_UPDATE',
            //                 from: 'content',
            //                 payload: {
            //                     annoId: this.props.id, replyId, adoptedState: adopted
            //                 }
            //             });
            //             // consider changing to callback to parent so we can also unpin annotation
            //             chrome.runtime.sendMessage({
            //                 msg: 'UPDATE_QUESTION',
            //                 from: 'content',
            //                 payload: {
            //                     id: this.props.id,
            //                     isClosed: true,
            //                     howClosed: "Answered"
            //                 }
            //             });
            //         }
            //         if (this.state.xpath !== undefined) {
            //             chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            //                 chrome.tabs.sendMessage(tabs[0].id, {
            //                     msg: 'ADD_REPLY_HIGHLIGHT',
            //                     payload: {
            //                         replyId: this.props.replies !== undefined ? this.props.replies.length : 0,
            //                         id: this.props.id,
            //                         xpath: this.state.xpath
            //                     }
            //                 });
            //             });
            //         }
            //     }
            // });
        }
        finishReply();
    }
    // const { edit } = this.props;
    const edit = true;
    // const { anchor } = this.state;
    let content = undefined;
    if (edit !== undefined && edit) {
        content = newReply.replyContent;
    }

    //  const { replyTags } = this.state;

    let submission = showQuestionAnswerInterface ? (
        <SplitButton
            key="typeOfReply"
            id="dropdown-split-variants-secondary"
            variant="secondary"
            title={"Post Answer"}
            onClick={_ => submitReply(true, true)}
        >
            {showQuestionAnswerInterface &&
                <BootstrapDropdown.Item
                    onClick={_ => {
                        let p = newReply;
                        p.setVars({ adopted: false, answer: false })
                        setNewReply(p);
                        submitReply(false, false)
                    }} eventKey="2">Reply</BootstrapDropdown.Item>}
        </SplitButton>) : (
        <Button
            key="replySubmit"
            id="dropdown-split-variants-secondary"
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
            {newReply.anchor !== "" ? (
                <div className="SelectedTextContainer">
                    {newReply.anchor}
                </div>
            ) : (null)}
            <div className="ReplyField">
                <RichTextEditor annotationContent={newReply.replyContent} annotationChangeHandler={replyChangeHandler} />
                <div className="Tag-Container">
                    <div className="row">
                        <div className="TextareaContainer">
                            <TagsInput value={newReply.tags ?? []} onChange={tagsHandleChange} onlyUnique={true} />
                        </div>
                    </div>
                </div>
                <div className="ReplyButtonRow">
                    <div className={classNames({ buttonCol: true })}>
                        <div className="buttonRow">
                            <img src={addAnchor} alt='add new anchor' onClick={requestNewAnchor} />
                        </div>
                        &nbsp; &nbsp;
                        <div className="cancelButtonContainer">
                            <button onClick={cancelReply} className="Cancel-Button">Cancel</button> &nbsp; &nbsp;
                        </div>
                        {submission}
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}


export default ReplyEditor;



                // this.setState({
                //     xpath,
                //     url,
                //     anchor,
                //     offsets,
                //     hostname
                // });
   // chrome.runtime.sendMessage({
            //     msg: 'UPDATE_REPLIES',
            //     payload: {
            //         id: ctx.anno.id,
            //         replies: repliesToTransmit
            //     }
            // });
  // const newReply = {
            //     replyId: this.props.replyId,
            //     author: this.props.author,
            //     authorId: this.props.authorId,
            //     replyContent: this.state.reply,
            //     tags: this.state.replyTags,
            //     answer: this.state.answer,
            //     question: this.state.question,
            //     timestamp: new Date().getTime(),
            //     xpath: this.state.xpath,
            //     anchor: this.state.anchor,
            //     hostname: this.state.hostname,
            //     url: this.state.url,
            //     offsets: this.state.offsets,
            //     adopted: this.state.adopted
            // };
// state = {
    //     reply: this.props.edit ? this.props.replyContent : "",
    //     replyTags: this.props.edit && this.props.tags !== undefined ? this.props.tags : [],
    //     answer: this.props.edit ? this.props.answer : false,
    //     question: this.props.edit ? this.props.question : false,
    //     xpath: this.props.xpath ? this.props.xpath : undefined,
    //     url: this.props.url ? this.props.url : "",
    //     anchor: this.props.anchor ? this.props.anchor : "",
    //     offsets: this.props.offsets ? this.props.offsets : undefined,
    //     hostname: this.props.hostname ? this.props.hostname : "",
    //     adopted: this.props.adopted ? this.props.adopted : false
    // }





// class ReplyEditor extends Component {

//     constructor(props) {
//         super(props);
//         this.replyChangeHandler = this.replyChangeHandler.bind(this);
//     }

//     state = {
//         reply: this.props.edit ? this.props.replyContent : "",
//         replyTags: this.props.edit && this.props.tags !== undefined ? this.props.tags : [],
//         answer: this.props.edit ? this.props.answer : false,
//         question: this.props.edit ? this.props.question : false,
//         xpath: this.props.xpath ? this.props.xpath : undefined,
//         url: this.props.url ? this.props.url : "",
//         anchor: this.props.anchor ? this.props.anchor : "",
//         offsets: this.props.offsets ? this.props.offsets : undefined,
//         hostname: this.props.hostname ? this.props.hostname : "",
//         adopted: this.props.adopted ? this.props.adopted : false
//     }

//     componentDidMount() {
//         chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//             if (request.msg === 'TRANSMIT_REPLY_ANCHOR' && request.from === 'content') {
//                 const { xpath, url, anchor, offsets, hostname } = request.payload;
//                 this.setState({
//                     xpath,
//                     url,
//                     anchor,
//                     offsets,
//                     hostname
//                 });
//             }
//         });
//     }

//     replyChangeHandler = (value) => {
//         this.setState({ reply: value });
//     }

//     cancelReply = () => {
//         this.setState({ reply: "" });
//         this.props.finishReply();
//     }

//     tagsHandleChange = (newTag) => {
//         this.setState({ replyTags: newTag })
//     }

//     markAnswer = () => {
//         this.setState({ answer: !this.state.answer });
//         this.setState({ question: false });
//     }

//     markQuestion = () => {
//         this.setState({ question: !this.state.question });
//         this.setState({ answer: false });
//     }

//     requestNewAnchor = () => {
//         const { id, replies } = this.props;
//         let replyId;
//         if (this.props.replyId === undefined) {
//             if (replies === undefined) {
//                 replyId = 0;
//             }
//             else {
//                 replyId = replies.length;
//             }
//         } else {
//             replyId = this.props.replyId;
//         }
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             chrome.tabs.sendMessage(tabs[0].id, {
//                 msg: 'ADD_REPLY_ANCHOR',
//                 payload: {
//                     replyId,
//                     id,
//                     replies
//                 }
//             });
//         });
//     }

//     submitReply = (e, adopted, answer) => {
//         if (this.props.edit) {
//             const newReply = {
//                 replyId: this.props.replyId,
//                 author: this.props.author,
//                 authorId: this.props.authorId,
//                 replyContent: this.state.reply,
//                 tags: this.state.replyTags,
//                 answer: this.state.answer,
//                 question: this.state.question,
//                 timestamp: new Date().getTime(),
//                 xpath: this.state.xpath,
//                 anchor: this.state.anchor,
//                 hostname: this.state.hostname,
//                 url: this.state.url,
//                 offsets: this.state.offsets,
//                 adopted: this.state.adopted
//             };
//             let replies = this.props.replies.filter(reply => reply.replyId !== this.props.replyId);
//             const repliesToTransmit = replies.concat(newReply);
//             chrome.runtime.sendMessage({
//                 msg: 'UPDATE_REPLIES',
//                 payload: {
//                     id: this.props.id,
//                     replies: repliesToTransmit
//                 }
//             });

//         } else {
//             chrome.runtime.sendMessage({
//                 msg: 'ADD_NEW_REPLY',
//                 payload: {
//                     replyId: this.props.replies !== undefined ? this.props.replies.length : 0,
//                     id: this.props.id,
//                     reply: this.state.reply,
//                     replyTags: this.state.replyTags,
//                     answer: answer !== undefined ? answer : false,
//                     question: this.state.question,
//                     xpath: this.state.xpath !== undefined ? this.state.xpath : null,
//                     anchor: this.state.anchor,
//                     hostname: this.state.hostname,
//                     url: this.state.url,
//                     offsets: this.state.offsets !== undefined ? this.state.offsets : null,
//                     adopted: adopted !== undefined ? adopted : false
//                 }
//             }, (response) => {
//                 if (response.msg === 'DONE') {
//                     if (adopted) {
//                         const replyId = this.props.replies !== undefined ? this.props.replies.length : 0;
//                         chrome.runtime.sendMessage({
//                             msg: 'REQUEST_ADOPTED_UPDATE',
//                             from: 'content',
//                             payload: {
//                                 annoId: this.props.id, replyId, adoptedState: adopted
//                             }
//                         });
//                         // consider changing to callback to parent so we can also unpin annotation
//                         chrome.runtime.sendMessage({
//                             msg: 'UPDATE_QUESTION',
//                             from: 'content',
//                             payload: {
//                                 id: this.props.id,
//                                 isClosed: true,
//                                 howClosed: "Answered"
//                             }
//                         });
//                     }
//                     if (this.state.xpath !== undefined) {
//                         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//                             chrome.tabs.sendMessage(tabs[0].id, {
//                                 msg: 'ADD_REPLY_HIGHLIGHT',
//                                 payload: {
//                                     replyId: this.props.replies !== undefined ? this.props.replies.length : 0,
//                                     id: this.props.id,
//                                     xpath: this.state.xpath
//                                 }
//                             });
//                         });
//                     }
//                 }
//             });
//         }
//         this.props.finishReply();
//     }

//     render() {
//         const { edit } = this.props;
//         const { anchor } = this.state;
//         let content = undefined;
//         if (edit !== undefined && edit) {
//             content = this.props.replyContent;
//         }
//         const { replyTags } = this.state;

//         let submission = this.props.showQuestionAnswerInterface ? (
//             <SplitButton
//                 key="typeOfReply"
//                 id="dropdown-split-variants-secondary"
//                 variant="secondary"
//                 title={"Post Answer"}
//                 onClick={_ => this.submitReply(true, true)}
//             >
//                 {this.props.showQuestionAnswerInterface && <BootstrapDropdown.Item onClick={_ => { this.setState({ adopted: false, answer: false }); this.submitReply(false, false) }} eventKey="2">Reply</BootstrapDropdown.Item>}
//             </SplitButton>) : (
//             <Button
//                 key="replySubmit"
//                 id="dropdown-split-variants-secondary"
//                 variant="secondary"
//                 title={"Post Reply"}
//                 onClick={this.submitReply}
//             >Post Reply </Button>
//         )
//         return (
//             <React.Fragment>
//                 <div className="ReplyHeader">
//                     <hr className="divider" id="editor" />
//                 </div>
//                 {anchor !== "" ? (
//                     <div className="SelectedTextContainer">
//                         {anchor}
//                     </div>
//                 ) : (null)}
//                 <div className="ReplyField">
//                     <RichTextEditor annotationContent={content} annotationChangeHandler={this.replyChangeHandler} />
//                     <div className="Tag-Container">
//                         <div className="row">
//                             <div className="TextareaContainer">
//                                 <TagsInput value={replyTags} onChange={this.tagsHandleChange} onlyUnique={true} />
//                             </div>
//                         </div>
//                     </div>
//                     <div className="ReplyButtonRow">
//                         <div className={classNames({ buttonCol: true })}>
//                             <div className="buttonRow">
//                                 <img src={addAnchor} alt='add new anchor' onClick={this.requestNewAnchor} />
//                             </div>
//                             &nbsp; &nbsp;
//                             <div className="cancelButtonContainer">
//                                 <button onClick={this.cancelReply} className="Cancel-Button">Cancel</button> &nbsp; &nbsp;
//                             </div>
//                             {submission}
//                         </div>
//                     </div>
//                 </div>
//             </React.Fragment>
//         )
//     }
// }

// export default ReplyEditor;