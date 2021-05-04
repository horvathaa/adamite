// import React, { Component } from 'react';
// import classNames from 'classnames';
// import './Annotation.css';
// import CustomTag from '../CustomTag/CustomTag';
// import Issue from '../../../../../assets/img/SVGs/Issue.svg';
// import profile from '../../../../../assets/img/SVGs/Profile.svg';
// import reply from '../../../../../assets/img/SVGs/Reply.svg';
// import outlinepin from '../../../../../assets/img/SVGs/pin.svg';
// import fillpin from '../../../../../assets/img/SVGs/pin_2.svg';
// import newAnchor from '../../../../../assets/img/SVGs/NewAnchor2.svg';
// import edit from '../../../../../assets/img/SVGs/edit.svg';
// import trash from '../../../../../assets/img/SVGs/delet.svg';
// import expand from '../../../../../assets/img/SVGs/expand.svg'
// import CardWrapper from '../CardWrapper/CardWrapper'
// import AnchorList from '../AnnotationList/Annotation/AnchorList/AnchorList';
// import Anchor from '../AnnotationList/Annotation/AnchorList/Anchor';
// import Reply from '../AnnotationList/Annotation/Reply/Reply';
// import ReplyEditor from '../AnnotationList/Annotation/Reply/ReplyEditor';
// import view from '../../../../../assets/img/SVGs/view.svg';
// import viewPublic from '../../../../../assets/img/SVGs/view_public.svg';
// import Tooltip from '@material-ui/core/Tooltip';

// import AnnotationContext from "../AnnotationList/Annotation/AnnotationContext";
// import EditRowComponent from "../AnnotationList/Annotation/Components/EditRowComponent";
// import CollapsedDiv from '../AnnotationList/Annotation/Components/CollapsedDiv';
// import AnnotationTagsList from '../AnnotationList/Annotation/Components/AnnotationTagsList';
// import RepliesList from '../AnnotationList/Annotation/Components/RepliesList';


// const IssueAnnotation = () => {
//     const ctx = useContext(AnnotationContext);
//     // const collapsedArg = ctx.collapsed ? 'expand' : 'collapse';

//     const ShowRepliesComponent = () => {
//         if (ctx.anno.replies === undefined || ctx.showReplies || ctx.collapsed || ctx.anno.replies.length) return (null);
//         return (<div className="ShowHideReplies">
//             <div className="ExpandCollapse">
//                 <img src={expand} className="Icon" id="ShowReplies" alt="Show replies" onClick={ctx.handleShowReplies} />
//             </div>
//             {ctx.anno.replies.length} {ctx.replyCountString}
//         </div>);
//     }
//     const AnnotationBadgeContainer = () => {
//         return (<div className="annotationTypeBadgeContainer" onClick={() => ctx.setCollapsed(!ctx.collapsed)}>
//             <div className="annotationTypeBadge row2">
//                 <div className="annotationTypeBadge col2">
//                     <div className="badgeContainer">
//                         <img src={Issue} alt='default type badge' />
//                     </div>
//                 </div>
//             </div>
//         </div>);
//     }

//     return (
//         <li key={ctx.idx} id={ctx.id} className={classNames({ AnnotationItem: true })}>
//             <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} >
//                 <div className={classNames({ AnnotationContainerLeftPad: true })}></div>
//             </div>
//             <div id={ctx.id} className={classNames({ AnnotationContainer: true, ActiveAnnotationContainer: true, })} >
//                 <AnnotationBadgeContainer />  {/*donish*/}
//                 <EditRowComponent /> {/*donish*/}
//                 <AnchorList />
//                 <CardWrapper />
//                 <AnnotationTagsList /> {/*donish*/}
//                 {!ctx.editing && (
//                     <div>
//                         <button className="Issue-Button"
//                             onClick={_ => ctx.handleExpertReview()}>Flag for Expert Review?</button>
//                     </div>
//                 )}
//                 {ctx.replying && <ReplyEditor id={id} finishReply={() => ctx.setReplying(false)} />}
//                 {/* <RepliesList /> 
//                 <ShowRepliesComponent />  */}
//                 <CollapsedDiv /> {/*donish*/}
//             </div>
//             <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} >
//                 <div className={classNames({ AnnotationContainerRightPad: true })} ></div>
//             </div>
//             <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} ></div>
//         </li>
//     );
// }
// export default IssueAnnotation;



// // class IssueAnnotation extends Component {

// //     state = {
// //         replying: false,
// //         showReplies: false
// //     }

// //     handleNewAnchorRequest = () => {
// //         this.props.handleNewAnchor(this.props.id);
// //     }

// //     handleEditRequest = () => {
// //         this.props.handleEditClick(this.props.id);
// //     }

// //     handleDeleteRequest = () => {
// //         this.props.handleTrashClick(this.props.id);
// //     }

// //     handleReply = () => {
// //         this.setState({ replying: true });
// //     }

// //     finishReply = () => {
// //         this.setState({ replying: false });
// //     }

// //     handleShowReplies = () => {
// //         this.setState({ showReplies: !this.state.showReplies });
// //     }

// //     render() {
// //         const { idx, id, collapsed, author, pin, currentUser, authorId,
// //             childAnchor, currentUrl, url, anchor, updateAnchorTags, deleteAnchor, xpath, tags, annotationType,
// //             annotationContent, editing, replies, isPrivate, brokenAnchor, brokenChild, brokenReply } = this.props;
// //         const { replying, showReplies } = this.state;
// //         let replyCountString = "";
// //         if (replies !== undefined) {
// //             if (replies.length > 1) {
// //                 replyCountString = " replies";
// //             }
// //             else {
// //                 replyCountString = " reply";
// //             }
// //         }

// //         let collapsedDiv = collapsed ? (
// //             <div className="ExpandCollapse">
// //                 <img src={expand} alt="Expand" onClick={_ => this.props.handleExpandCollapse('expand')} className="Icon" />
// //             </div>
// //         ) : (
// //             <div className="ExpandCollapse">
// //                 <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.props.handleExpandCollapse('collapse')} className="Icon" />
// //             </div>
// //         )

// //         const collapsedArg = collapsed ? 'expand' : 'collapse';

// //         return (
// //             <li key={idx} id={id} className={classNames({ AnnotationItem: true })}>
// //                 <div
// //                     className={classNames({
// //                         AnnotationContainerPad: true,
// //                         AnnotationPadActive: true,
// //                     })} >
// //                     <div
// //                         className={classNames({ AnnotationContainerLeftPad: true })}
// //                     ></div>
// //                 </div>
// //                 <div id={id}
// //                     className={classNames({
// //                         AnnotationContainer: true,
// //                         ActiveAnnotationContainer: true,
// //                     })}
// //                 >
// //                     <div className="annotationTypeBadgeContainer" onClick={_ => this.props.handleExpandCollapse(collapsedArg)}>
// //                         <div className="annotationTypeBadge row2">
// //                             <div className="annotationTypeBadge col2">
// //                                 <div className="badgeContainer">
// //                                     <img src={Issue} alt='default type badge' />
// //                                 </div>
// //                             </div>
// //                         </div>
// //                     </div>
// //                     {!collapsed ? (
// //                         <React.Fragment>
// //                             <div className={" container " + classNames({
// //                                 Header: true,
// //                                 Truncated: collapsed,
// //                             })}>
// //                                 <div className="profileContainer">
// //                                     <img src={profile} alt="profile" className="profile" />
// //                                 </div>
// //                                 <div className="userProfileContainer">

// //                                     <div className="author">
// //                                         {author}
// //                                     </div>
// //                                     <div className="groupName">
// //                                         {this.props.getGroupName()}
// //                                     </div>
// //                                     <div className="timestamp">
// //                                         {this.props.formatTimestamp()}
// //                                     </div>
// //                                 </div>
// //                                 <div className="row">
// //                                     <div className="AnnotationIconContainer">
// //                                         <Tooltip title={"Reply to annotation"} aria-label="reply icon tooltip">
// //                                             <div className="TopIconContainer" onClick={this.handleReply}>
// //                                                 <img src={reply} alt="reply" className="profile" />
// //                                             </div>
// //                                         </Tooltip>
// //                                         <Tooltip title={"Pin or unpin annotation"} aria-label="pin icon tooltip">
// //                                             <div className="TopIconContainer" onClick={this.props.transmitPinToParent}>
// //                                                 {pin ? (
// //                                                     <img src={fillpin} id="pin" alt="pin" className="profile" />
// //                                                 ) : (
// //                                                     <img src={outlinepin} id="pin" alt="pin" className="profile" />
// //                                                 )}
// //                                             </div>
// //                                         </Tooltip>
// //                                         <Tooltip title={"Add new anchor to annotation"} aria-label="add new anchor tooltip">
// //                                             <div className="TopIconContainer" >
// //                                                 <img src={newAnchor} alt="add new anchor" id="newAnchor" className="profile" onClick={this.handleNewAnchorRequest} />
// //                                             </div>
// //                                         </Tooltip>
// //                                         {currentUser.uid === authorId ? (
// //                                             <React.Fragment>
// //                                                 <Tooltip title={"Edit annotation"} aria-label="edit tooltip">
// //                                                     <div className="TopIconContainer" >
// //                                                         <img src={edit} alt="edit annotation" className="profile" id="edit" onClick={this.handleEditRequest} />
// //                                                     </div>
// //                                                 </Tooltip>
// //                                                 <Tooltip title={"Delete annotation"} aria-label="delete annotation tooltip">
// //                                                     <div className="TopIconContainer" >
// //                                                         <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={this.handleDeleteRequest} />
// //                                                     </div>
// //                                                 </Tooltip>
// //                                             </React.Fragment>
// //                                         ) : (null)}
// //                                     </div>
// //                                 </div>
// //                             </div>
// //                         </React.Fragment>) : (null)}
// //                     {childAnchor === undefined || !childAnchor.length ? null : (
// //                         <AnchorList
// //                             parentId={id}
// //                             childAnchor={childAnchor}
// //                             currentUrl={currentUrl}
// //                             collapsed={collapsed}
// //                             brokenChild={brokenChild}
// //                             isCurrentUser={currentUser.uid === authorId}
// //                             updateAnchorTags={updateAnchorTags}
// //                             deleteAnchor={deleteAnchor}
// //                         />
// //                     )}

// //                     <React.Fragment>
// //                         <CardWrapper
// //                             tags={tags}
// //                             annotationType={annotationType}
// //                             annotationContent={annotationContent}
// //                             edit={editing}
// //                             pageAnnotation={anchor}
// //                             id={id}
// //                             cancelButtonHandler={this.props.cancelButtonHandler}
// //                             submitButtonHandler={this.props.submitButtonHandler}
// //                             elseContent={annotationContent}
// //                             collapsed={collapsed}
// //                             userGroups={this.props.userGroups} />
// //                     </React.Fragment>

// //                     {tags !== undefined && tags.length && !collapsed && !editing ? (
// //                         <div className={classNames({
// //                             TagRow: true
// //                         })}>
// //                             <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
// //                                 {tags.map((tagContent, idx) => {
// //                                     return (
// //                                         <CustomTag idx={idx} content={tagContent} deleteTag={this.deleteTag} editing={editing} />
// //                                     )
// //                                 }
// //                                 )}
// //                             </ul>

// //                         </div>
// //                     ) : (null)}
// //                     {!editing && (
// //                         <div>
// //                             <button className="Issue-Button"
// //                                 onClick={_ => this.props.handleExpertReview()}>Flag for Expert Review?</button>
// //                         </div>
// //                     )}
// //                     {replying &&
// //                         <ReplyEditor id={id} finishReply={this.finishReply} />
// //                     }
// //                     {replies !== undefined && showReplies && replies.length && !collapsed && !editing ? (
// //                         <div className="Replies">
// //                             <div className="SeparationRow">
// //                                 <div className="ShowHideReplies">
// //                                     <div className="ExpandCollapse">
// //                                         <img src={expand} className="Icon" alt="Show replies" onClick={this.handleShowReplies} />
// //                                     </div>
// //                                     {replies.length} {replyCountString}
// //                                 </div>
// //                                 <hr className="divider" />
// //                             </div>
// //                             <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
// //                                 {replies.map((reply, idx) => {
// //                                     return (
// //                                         <Reply
// //                                             key={idx}
// //                                             idx={idx}
// //                                             replyId={reply.replyId}
// //                                             annoId={id}
// //                                             replies={replies}
// //                                             content={reply.replyContent}
// //                                             author={reply.author}
// //                                             authorId={reply.authorId}
// //                                             timeStamp={reply.timestamp}
// //                                             tags={reply.tags}
// //                                             answer={reply.answer}
// //                                             question={reply.question}
// //                                             finishReply={this.finishReply}
// //                                             showQuestionAnswerInterface={false}
// //                                             currentUser={currentUser}
// //                                             xpath={reply.xpath}
// //                                             anchor={reply.anchor}
// //                                             hostname={reply.hostname}
// //                                             url={reply.url}
// //                                             offsets={reply.offsets}
// //                                             currentUrl={currentUrl}
// //                                             notifyParentOfAdopted={this.props.notifyParentOfAdopted}
// //                                             brokenAnchor={this.props.brokenReply.includes(reply.replyId)}
// //                                         />
// //                                     )
// //                                 }
// //                                 )}
// //                             </ul>
// //                         </div>
// //                     ) : (null)}
// //                     {replies !== undefined && !showReplies && replies.length ? (
// //                         <div className="ShowHideReplies">
// //                             <div className="ExpandCollapse">
// //                                 <img src={expand} className="Icon" id="ShowReplies" alt="Show replies" onClick={this.handleShowReplies} />
// //                             </div>
// //                             {replies.length} {replyCountString}
// //                         </div>
// //                     ) : (null)}
// //                     {!editing && !replying ? (collapsedDiv) : (null)}
// //                 </div>

// //                 <div
// //                     className={classNames({
// //                         AnnotationContainerPad: true,
// //                         AnnotationPadActive: true,
// //                     })}
// //                 >

// //                     <div
// //                         className={classNames({ AnnotationContainerRightPad: true })}
// //                     ></div>
// //                 </div>
// //                 <div
// //                     className={classNames({
// //                         AnnotationContainerPad: true,
// //                         AnnotationPadActive: true,
// //                     })}
// //                 ></div>
// //             </li>
// //         );
// //     }
// // }

// // export default IssueAnnotation;