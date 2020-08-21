import React, { Component } from 'react';
import profile from '../../../../../../assets/img/SVGs/Profile.svg';
import CustomTag from '../../../CustomTag/CustomTag';
import { FcCheckmark } from 'react-icons/fc';
import '../Annotation.css';
import './Reply.css';
import ReplyEditor from './ReplyEditor';
import edit from '../../../../../../assets/img/SVGs/edit.svg';
import trash from '../../../../../../assets/img/SVGs/delet.svg';

class Reply extends Component {

    state = {
        editing: false
    }

    finishReply = () => {
        this.setState({ editing: false });
        this.props.finishReply();
    }

    deleteReply = () => {
        const repliesToTransmit = this.props.replies.filter(reply => reply.replyId !== this.props.replyId);
        chrome.runtime.sendMessage({
            msg: 'UPDATE_REPLIES',
            payload: {
                id: this.props.annoId,
                replies: repliesToTransmit
            }
        });
    }

    formatTimestamp = () => {
        let date = new Date(this.props.timeStamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = date.getFullYear();
        var month = months[date.getMonth()];
        var day = date.getDate();
        var hour = date.getHours();
        var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        // var sec = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        var time = hour + ':' + min + ' ' + day + ' ' + month + ' ' + year;
        return time;
    }

    render() {
        const { content, author, currentUser, authorId, idx, tags, answer, question, showQuestionAnswerInterface } = this.props;
        // const displayAuthor = author.substring(0, author.indexOf('@'));
        const reply = (<React.Fragment>
            {this.state.editing ?
                (<ReplyEditor
                    edit={true}
                    replyId={this.props.replyId}
                    replies={this.props.replies}
                    author={author}
                    authorId={currentUser.uid}
                    replyContent={content}
                    id={this.props.annoId}
                    idx={idx}
                    finishReply={this.finishReply}
                    answer={answer}
                    question={question}
                    tags={tags}
                    showQuestionAnswerInterface={showQuestionAnswerInterface}
                />) : (
                    <React.Fragment>
                        {idx !== 0 && <hr className="divider" />}
                        <li key={idx} className="ReplyContent">
                            <div className=" container Header">
                                <div className="profileContainer">
                                    <img src={profile} alt="profile" className="profile" />
                                </div>
                                <div className="userProfileContainer">
                                    <div className="author">
                                        {author}
                                    </div>
                                    <div className="timestamp">
                                        {this.formatTimestamp()}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="AnnotationIconContainer">
                                        {currentUser.uid === authorId ? (
                                            <React.Fragment>
                                                <div className="TopIconContainer" >
                                                    <img src={edit} alt="edit reply" className="profile" id="edit" onClick={_ => this.setState({ editing: true })} />
                                                </div>
                                                <div className="TopIconContainer" >
                                                    <img src={trash} alt="delete reply" className="profile" id="delete" onClick={this.deleteReply} />
                                                </div>
                                            </React.Fragment>
                                        ) : (null)}
                                    </div>
                                </div>
                            </div>
                            <div className="annotationContent">
                                <div className="QuestionAnswerMarker">
                                    {answer !== undefined && answer ? "A" : (null)}
                                    {question !== undefined && question ? "Q" : (null)}
                                </div>
                                <div className="contentBody">
                                    {content}
                                </div>

                            </div>
                            {tags.length ? (
                                <div className="TagRow">
                                    <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                                        {tags.map((tagContent, idx) => {
                                            return (
                                                <CustomTag idx={idx} content={tagContent} />
                                            )
                                        }
                                        )}
                                    </ul>
                                </div>
                            ) : (null)}
                        </li>
                    </React.Fragment>)
            }
        </React.Fragment>);
        return (
            reply
        );
    }
}

export default Reply;
