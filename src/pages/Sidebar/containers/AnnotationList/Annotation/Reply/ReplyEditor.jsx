import React, { Component } from 'react';
import RichTextEditor from '../../../RichTextEditor/RichTextEditor';
import TagsInput from 'react-tagsinput';
import '../Annotation.css';
import './ReplyEditor.css';

class ReplyEditor extends Component {

    constructor(props) {
        super(props);
        this.replyChangeHandler = this.replyChangeHandler.bind(this);
    }

    state = {
        reply: "",
        replyTags: []
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

    submitReply = () => {
        chrome.runtime.sendMessage({
            msg: 'ADD_NEW_REPLY',
            payload: {
                id: this.props.id,
                reply: this.state.reply,
                replyTags: this.state.replyTags
            }
        });
        this.props.finishReply();
    }

    render() {
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
                        <div className="buttonCol">
                            <button onClick={this.cancelReply} className="Cancel-Button">Cancel</button> &nbsp; &nbsp;
                                <button onClick={this.submitReply} className="Publish-Button">Submit</button>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default ReplyEditor;