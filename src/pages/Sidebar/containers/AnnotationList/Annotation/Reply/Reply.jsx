import React, { Component } from 'react';
import profile from '../../../../../../assets/img/SVGs/Profile.svg';
import CustomTag from '../../../CustomTag/CustomTag';
import Anchor from '../AnchorList/Anchor';
import { FaStar, FaRegStar } from 'react-icons/fa';
import '../Annotation.css';
import './Reply.css';
import ReplyEditor from './ReplyEditor';
import edit from '../../../../../../assets/img/SVGs/edit.svg';
import trash from '../../../../../../assets/img/SVGs/delet.svg';

class Reply extends Component {

    state = {
        editing: false,
        adopted: this.props.adopted !== undefined ? this.props.adopted : false
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

    transmitAdoptedToParent = () => {
        this.handleAdopted().then(adoptedState => {
            this.props.answerIsAdopted(this.props.replyId, adoptedState);
        })
    }

    handleAdopted = () => {
        return new Promise((resolve, reject) => {
            const { adopted } = this.state;
            this.setState({ adopted: !adopted });
            resolve(!adopted);
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
        const { content, author, currentUser, authorId, idx, tags, answer, question,
            showQuestionAnswerInterface, xpath, anchor, hostname, url, offsets } = this.props;
        const adoptedStar = this.state.adopted ?
            <FaStar className="profile" onClick={this.transmitAdoptedToParent} /> :
            <FaRegStar className="profile" onClick={this.transmitAdoptedToParent} />;
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
                    xpath={xpath}
                    anchor={anchor}
                    hostname={hostname}
                    url={url}
                    offsets={offsets}
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
                                        {adoptedStar}
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
                            {xpath !== null && xpath !== undefined ? (
                                <Anchor
                                    id={this.props.annoId}
                                    replyId={this.props.replyId}
                                    currentUrl={this.props.currentUrl}
                                    url={url}
                                    anchorContent={anchor}
                                    pageAnchor={xpath === null}
                                />) : (null)}
                            <div className="annotationContent">
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
