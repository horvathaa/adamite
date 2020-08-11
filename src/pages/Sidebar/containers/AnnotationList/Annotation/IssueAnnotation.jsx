import React, { Component } from 'react';
import classNames from 'classnames';
import './Annotation.css';
import CustomTag from '../../CustomTag/CustomTag';
import Issue from '../../../../../assets/img/SVGs/Issue.svg';
import profile from '../../../../../assets/img/SVGs/Profile.svg';
import reply from '../../../../../assets/img/SVGs/Reply.svg';
import outlinepin from '../../../../../assets/img/SVGs/pin.svg';
import fillpin from '../../../../../assets/img/SVGs/pin_2.svg';
import newAnchor from '../../../../../assets/img/SVGs/Add_anchor.svg';
import edit from '../../../../../assets/img/SVGs/edit.svg';
import trash from '../../../../../assets/img/SVGs/delet.svg';
import expand from '../../../../../assets/img/SVGs/expand.svg'
import CardWrapper from '../../CardWrapper/CardWrapper'
import AnchorList from './AnchorList/AnchorList';
import Anchor from './AnchorList/Anchor';
import Reply from './Reply/Reply';
import ReplyEditor from './Reply/ReplyEditor';

class IssueAnnotation extends Component {


    state = {
        replying: false,
        showReplies: false
    }

    handleNewAnchorRequest = () => {
        this.props.handleNewAnchor(this.props.id);
    }

    handleEditRequest = () => {
        this.props.handleEditClick(this.props.id);
    }

    handleDeleteRequest = () => {
        this.props.handleTrashClick(this.props.id);
    }

    handleReply = () => {
        this.setState({ replying: true });
    }

    finishReply = () => {
        this.setState({ replying: false });
    }

    handleShowReplies = () => {
        this.setState({ showReplies: !this.state.showReplies });
    }

    render() {
        const { idx, id, collapsed, author, pin, currentUser, authorId,
            childAnchor, currentUrl, url, anchor, xpath, tags, annotationType,
            annotationContent, editing, replies } = this.props;
        const { replying, showReplies } = this.state;
        let replyCountString = "";
        if (replies !== undefined) {
            if (replies.length > 1) {
                replyCountString = " replies";
            }
            else {
                replyCountString = " reply";
            }
        }

        return (
            <li key={idx} id={id} className={classNames({ AnnotationItem: true })}>
                <div
                    className={classNames({
                        AnnotationContainerPad: true,
                        AnnotationPadActive: true,
                    })}
                >
                    <div
                        className={classNames({ AnnotationContainerLeftPad: true })}
                    ></div>
                </div>
                <div id={id}
                    className={classNames({
                        AnnotationContainer: true,
                        ActiveAnnotationContainer: true,
                    })}
                >
                    {!collapsed ? (
                        <React.Fragment>
                            <div className="annotationTypeBadgeContainer">
                                <div className="annotationTypeBadge row2">
                                    <div className="annotationTypeBadge col2">
                                        <div className="badgeContainer">
                                            <img src={Issue} alt='default type badge' />
                                        </div>

                                    </div>
                                </div>
                            </div>
                            <div className={" container " + classNames({
                                Header: true,
                                Truncated: collapsed,
                            })}>
                                <div className="profileContainer">
                                    <img src={profile} alt="profile" className="profile" />
                                </div>
                                <div className="userProfileContainer">

                                    <div className="author">
                                        {author}
                                    </div>
                                    <div className="timestamp">
                                        {this.props.formatTimestamp()}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="AnnotationIconContainer">
                                        <div className="TopIconContainer" onClick={this.handleReply}>
                                            <img src={reply} alt="reply" className="profile" />
                                        </div>
                                        <div className="TopIconContainer" onClick={this.props.transmitPinToParent}>
                                            {pin ? (
                                                <img src={fillpin} id="pin" alt="pin" className="profile" />
                                            ) : (
                                                    <img src={outlinepin} id="pin" alt="pin" className="profile" />
                                                )}
                                        </div>
                                        <div className="TopIconContainer" >
                                            <img src={newAnchor} alt="add new anchor" id="newAnchor" className="profile" onClick={this.handleNewAnchorRequest} />
                                        </div>
                                        {currentUser.uid === authorId ? (
                                            <React.Fragment>
                                                <div className="TopIconContainer" >
                                                    <img src={edit} alt="edit annotation" className="profile" id="edit" onClick={this.handleEditRequest} />
                                                </div>
                                                <div className="TopIconContainer" >
                                                    <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={this.handleDeleteRequest} />
                                                </div>
                                            </React.Fragment>
                                        ) : (null)}
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>) : (null)}
                    {childAnchor === undefined || !childAnchor.length ? (
                        <Anchor
                            id={id}
                            currentUrl={currentUrl}
                            url={url}
                            collapsed={collapsed}
                            anchorContent={anchor}
                            pageAnchor={xpath === null} />
                    ) : (
                            <React.Fragment>
                                <Anchor
                                    id={id}
                                    currentUrl={currentUrl}
                                    url={url}
                                    collapsed={collapsed}
                                    anchorContent={anchor}
                                    pageAnchor={xpath === null} />
                                <AnchorList childAnchor={childAnchor} currentUrl={currentUrl} collapsed={collapsed} />
                            </React.Fragment>
                        )}

                    <React.Fragment>
                        <CardWrapper
                            tags={tags}
                            annotationType={annotationType}
                            annotationContent={annotationContent}
                            edit={editing}
                            pageAnnotation={anchor}
                            id={id}
                            cancelButtonHandler={this.props.cancelButtonHandler}
                            submitButtonHandler={this.props.submitButtonHandler}
                            elseContent={annotationContent}
                            collapsed={collapsed} />
                    </React.Fragment>

                    {tags.length && !collapsed && !editing ? (
                        <div className={classNames({
                            TagRow: true
                        })}>
                            <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                                {tags.map((tagContent, idx) => {
                                    return (
                                        <CustomTag idx={idx} content={tagContent} deleteTag={this.deleteTag} editing={editing} />
                                    )
                                }
                                )}
                            </ul>

                        </div>
                    ) : (null)}
                    {!editing && (
                        <div>
                            <button className="Issue-Button"
                                onClick={_ => this.props.handleExpertReview()}>Flag for Expert Review?</button>
                        </div>
                    )}
                    {replying &&
                        <ReplyEditor id={id} finishReply={this.finishReply} />
                    }
                    {replies !== undefined && showReplies && replies.length && !collapsed && !editing ? (
                        <div className="Replies">
                            <div className="SeparationRow">
                                <div className="ShowHideReplies">
                                    <div className="ExpandCollapse">
                                        <img src={expand} className="Icon" alt="Show replies" onClick={this.handleShowReplies} />
                                    </div>
                                    {replies.length} {replyCountString}
                                </div>
                                <hr className="divider" />
                            </div>
                            <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                                {replies.map((reply, idx) => {
                                    return (
                                        <Reply key={idx} idx={idx} content={reply.replyContent} author={reply.author} timeStamp={reply.timestamp} tags={reply.tags} />
                                    )
                                }
                                )}
                            </ul>
                        </div>
                    ) : (null)}
                    {replies !== undefined && !showReplies && replies.length ? (
                        <div className="ShowHideReplies">
                            <div className="ExpandCollapse">
                                <img src={expand} className="Icon" id="ShowReplies" alt="Show replies" onClick={this.handleShowReplies} />
                            </div>
                            {replies.length} {replyCountString}
                        </div>
                    ) : (null)}
                    {collapsed ? (
                        <div className="ExpandCollapse">
                            <img src={expand} alt="Expand" onClick={_ => this.props.handleExpandCollapse('expand')} className="Icon" />
                        </div>
                    ) : (
                            <React.Fragment>
                                <div className="ExpandCollapse">
                                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.props.handleExpandCollapse('collapse')} className="Icon" />
                                </div>
                            </React.Fragment>
                        )
                    }
                </div>

                <div
                    className={classNames({
                        AnnotationContainerPad: true,
                        AnnotationPadActive: true,
                    })}
                >

                    <div
                        className={classNames({ AnnotationContainerRightPad: true })}
                    ></div>
                </div>
                <div
                    className={classNames({
                        AnnotationContainerPad: true,
                        AnnotationPadActive: true,
                    })}
                ></div>
            </li>
        );
    }
}

export default IssueAnnotation;