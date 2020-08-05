import React, { Component } from 'react';
import RichTextEditor from '../../../RichTextEditor/RichTextEditor';
import TagsInput from 'react-tagsinput';
import classNames from 'classnames';
import '../Annotation.css';
import './ReplyEditor.css';

class ReplyEditor extends Component {

    constructor(props) {
        super(props);
        this.replyChangeHandler = this.replyChangeHandler.bind(this);
    }

    state = {
        reply: "",
        replyTags: [],
        answer: false,
        question: false
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

    // when submitting reply on annotation that is not on current page, uses cache so reply isn't represented
    // probably not good solution
    submitReply = () => {
        chrome.runtime.sendMessage({
            msg: 'ADD_NEW_REPLY',
            payload: {
                id: this.props.id,
                reply: this.state.reply,
                replyTags: this.state.replyTags,
                answer: this.state.answer,
                question: this.state.question
            }
        });
        this.props.finishReply();
    }

    render() {
        const { showQuestionAnswerInterface } = this.props;
        const { replyTags } = this.state;
        return (
            <React.Fragment>
                <div className="ReplyHeader">
                    <hr className="divider" id="editor" />
                </div>
                <div className="ReplyField">
                    <RichTextEditor annotationContent={undefined} annotationChangeHandler={this.replyChangeHandler} />
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