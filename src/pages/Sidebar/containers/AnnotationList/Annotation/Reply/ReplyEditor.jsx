import React, { Component } from 'react';
import RichTextEditor from '../../../RichTextEditor/RichTextEditor';
import TagsInput from 'react-tagsinput';
import classNames from 'classnames';
import '../Annotation.css';
import './ReplyEditor.css';
import addAnchor from '../../../../../../assets/img/SVGs/NewAnchor2.svg';

class ReplyEditor extends Component {

    constructor(props) {
        super(props);
        this.replyChangeHandler = this.replyChangeHandler.bind(this);
    }

    state = {
        reply: this.props.edit ? this.props.replyContent : "",
        replyTags: this.props.edit && this.props.tags !== undefined ? this.props.tags : [],
        answer: this.props.edit ? this.props.answer : false,
        question: this.props.edit ? this.props.question : false
    }

    replyChangeHandler = (value) => {
        this.setState({ reply: value });
    }

    cancelReply = () => {
        this.setState({ reply: "" });
        this.props.finishReply();
    }

    tagsHandleChange = (newTag) => {
        this.setState({ replyTags: newTag })
    }

    markAnswer = () => {
        this.setState({ answer: !this.state.answer });
        this.setState({ question: false });
    }

    markQuestion = () => {
        this.setState({ question: !this.state.question });
        this.setState({ answer: false });
    }

    requestNewAnchor = () => {
        alert('Select the text you want to anchor this answer to!');
        const { idx, id } = this.props;
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                msg: 'ADD_REPLY_ANCHOR',
                payload: {
                    replyIdx: idx,
                    id
                }
            });
        });
    }

    // when submitting reply on annotation that is not on current page, uses cache so reply isn't represented
    // probably not good solution
    submitReply = () => {
        if (this.props.edit) {
            const newReply = {
                replyId: this.props.replyId,
                author: this.props.author,
                authorId: this.props.authorId,
                replyContent: this.state.reply,
                tags: this.state.replyTags,
                answer: this.state.answer,
                question: this.state.question,
                timestamp: new Date().getTime()
            };
            let replies = this.props.replies.filter(reply => reply.replyId !== this.props.replyId);
            const repliesToTransmit = replies.concat(newReply);
            chrome.runtime.sendMessage({
                msg: 'UPDATE_REPLIES',
                payload: {
                    id: this.props.id,
                    replies: repliesToTransmit
                }
            });

        } else {
            chrome.runtime.sendMessage({
                msg: 'ADD_NEW_REPLY',
                payload: {
                    replyId: this.props.replies.length !== undefined ? this.props.replies.length : 0,
                    id: this.props.id,
                    reply: this.state.reply,
                    replyTags: this.state.replyTags,
                    answer: this.state.answer,
                    question: this.state.question
                }
            });
        }
        this.props.finishReply();
    }

    render() {
        const { showQuestionAnswerInterface, edit } = this.props;
        let content = undefined;
        if (edit !== undefined && edit) {
            content = this.props.replyContent;
        }
        const { replyTags } = this.state;
        return (
            <React.Fragment>
                <div className="ReplyHeader">
                    <hr className="divider" id="editor" />
                </div>
                <div className="ReplyField">
                    <RichTextEditor annotationContent={content} annotationChangeHandler={this.replyChangeHandler} />
                    <div className="Tag-Container">
                        <div className="row">
                            <div className="TextareaContainer">
                                <TagsInput value={replyTags} onChange={this.tagsHandleChange} onlyUnique={true} />
                            </div>
                        </div>
                    </div>
                    <div className="ReplyButtonRow">
                        <div className={classNames({ buttonCol: true, question: showQuestionAnswerInterface })}>
                            {showQuestionAnswerInterface && (
                                <div className="buttonRow">
                                    <div onClick={this.markQuestion} className={classNames({ MarkQuestionAnswer: true, question: this.state.question })}>Q</div>
                                    <div onClick={this.markAnswer} className={classNames({ MarkQuestionAnswer: true, answered: this.state.answer })} >A</div>
                                    <img src={addAnchor} alt='add new anchor' onClick={this.requestNewAnchor} />
                                </div>
                            )}
                            &nbsp; &nbsp;
                            <div className="cancelButtonContainer">
                                <button onClick={this.cancelReply} className="Cancel-Button">Cancel</button> &nbsp; &nbsp;
                            </div>
                            <div className="publishButtonContainer">
                                <button onClick={this.submitReply} className="Publish-Button">Submit</button>
                            </div>

                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default ReplyEditor;