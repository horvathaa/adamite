// import React, { Component } from 'react';
// import classNames from 'classnames';
// import './Annotation.css';
// import CustomTag from '../CustomTag/CustomTag';
// import profile from '../../../../../assets/img/SVGs/Profile.svg';
// import Question from '../../../../../assets/img/SVGs/Question.svg';
// import openQuestion from '../../../../../assets/img/SVGs/Question_open.svg';
// import reply from '../../../../../assets/img/SVGs/Reply.svg';
// import outlinepin from '../../../../../assets/img/SVGs/pin.svg';
// import fillpin from '../../../../../assets/img/SVGs/pin_2.svg';
// import view from '../../../../../assets/img/SVGs/view.svg';
// import viewPublic from '../../../../../assets/img/SVGs/view_public.svg';
// import newAnchor from '../../../../../assets/img/SVGs/NewAnchor2.svg';
// import edit from '../../../../../assets/img/SVGs/edit.svg';
// import trash from '../../../../../assets/img/SVGs/delet.svg';
// import expand from '../../../../../assets/img/SVGs/expand.svg'
// import CardWrapper from '../CardWrapper/CardWrapper'
// import AnchorList from '../AnnotationList/Annotation/AnchorList/AnchorList';
// import Anchor from '../AnnotationList/Annotation/AnchorList/Anchor';
// import Reply from '../AnnotationList/Annotation/Reply/Reply';
// import ReplyEditor from '../AnnotationList/Annotation/Reply/ReplyEditor';
// import { SplitButton, Dropdown as BootstrapDropdown } from 'react-bootstrap';
// import Tooltip from '@material-ui/core/Tooltip';



// // const QuestionAnswerAnnotation = () => {
// //     const [replying, setReplying] = useState(false);
// //     const [showReplies, setShowReplies] = useState(false);
// //     return ( );
// //   }
// //   export default QuestionAnswerAnnotation;

// import AnnotationContext from "../AnnotationList/Annotation/AnnotationContext";
// import EditRowComponent from "../AnnotationList/Annotation/Components/EditRowComponent";
// import CollapsedDiv from '../AnnotationList/Annotation/Components/CollapsedDiv';
// import AnnotationTagsList from '../AnnotationList/Annotation/Components/AnnotationTagsList';
// import RepliesList from '../AnnotationList/Annotation/Components/RepliesList';

// /*
// Used context

// collapsed
// setCollapsed


// setReplying
// replying
// anno.replies
// replyCountString
// showReplies
// handleShowReplies

// */

// const QuestionAnswerAnnotation = () => {
//     const ctx = useContext(AnnotationContext);
//     // const collapsedArg = ctx.collapsed ? 'expand' : 'collapse';

//     const closeOut = (selection) => {
//         const closedQuestion = selection !== 'Open Question';
//         const closedToClosed = (
//             (selection === 'Answered' && ctx.anno.howClosed === 'No Longer Relevant') ||
//             (selection === 'No Longer Relevant' && ctx.anno.howClosed === 'Answered')
//         );
//         if (!closedToClosed) {
//             ctx.transmitPinToParent();
//         }
//         chrome.runtime.sendMessage({
//             msg: 'UPDATE_QUESTION',
//             from: 'content',
//             payload: {
//                 id: ctx.anno.id,
//                 isClosed: closedQuestion,
//                 howClosed: closedQuestion ? selection : "",
//             }
//         });
//     }

//     const answerIsAdopted = (replyId, adoptedState) => {
//         ctx.transmitPinToParent()
//         chrome.runtime.sendMessage({
//             msg: 'UPDATE_QUESTION',
//             from: 'content',
//             payload: {
//                 id: ctx.anno.id,
//                 isClosed: true,
//                 howClosed: "Answered"
//             }
//         });
//         ctx.notifyParentOfAdopted(ctx.anno.id, replyId, adoptedState);
//     }


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
//                         <img src={Question} alt='default type badge' />
//                     </div>
//                 </div>
//             </div>
//         </div>);
//     }

//     let closeOutText = "";
//     if (isClosed !== undefined) {
//         if (!isClosed) {
//             closeOutText = "Unanswered Question";
//         }
//         else {
//             closeOutText = howClosed;
//         }
//     } else {
//         closeOutText = "Unanswered Question";
//     }
//     let adoptedContent, showAdoptedAnchor;
//     if (adopted === 0 || adopted) {
//         replies.forEach(reply => {
//             if (reply.replyId === adopted) {
//                 adoptedContent = reply.replyContent;
//                 showAdoptedAnchor = reply.xpath !== null;
//             }
//         });
//     }

//     const closeoutOptions = closedStrings.filter(str => str !== closeOutText);


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
//                 {!ctx.collapsed &&
//                     <div className="openCloseQuestionRow">
//                         <SplitButton
//                             key="openCloseQuestion"
//                             id="openCloseQuestion"
//                             variant="secondary"
//                             size="sm"
//                             title={closeOutText}
//                             onSelect={eventKey => closeOut(eventKey)}
//                         >
//                             <BootstrapDropdown.Item className="dropdown-link" onSelect={eventKey => closeOut(eventKey)} eventKey={closeoutOptions[0]}>{closeoutOptions[0]}</BootstrapDropdown.Item>
//                             <BootstrapDropdown.Item className="dropdown-link" onSelect={eventKey => closeOut(eventKey)} eventKey={closeoutOptions[1]}>{closeoutOptions[1]}</BootstrapDropdown.Item>
//                         </SplitButton>
//                     </div>
//                 }
//                 <AnnotationTagsList /> {/*donish*/}
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
// export default QuestionAnswerAnnotation;



// // class QuestionAnswerAnnotation extends Component {

// //     state = {
// //         replying: false,
// //         showReplies: false,
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

// //     closeOut = (selection) => {
// //         const closedQuestion = selection !== 'Open Question';
// //         const closedToClosed = (
// //             (selection === 'Answered' && this.props.howClosed === 'No Longer Relevant') ||
// //             (selection === 'No Longer Relevant' && this.props.howClosed === 'Answered')
// //         );
// //         if (!closedToClosed) {
// //             this.props.transmitPinToParent();
// //         }
// //         chrome.runtime.sendMessage({
// //             msg: 'UPDATE_QUESTION',
// //             from: 'content',
// //             payload: {
// //                 id: this.props.id,
// //                 isClosed: closedQuestion,
// //                 howClosed: closedQuestion ? selection : "",
// //             }
// //         });
// //     }

// //     answerIsAdopted = (replyId, adoptedState) => {
// //         this.props.transmitPinToParent()
// //         chrome.runtime.sendMessage({
// //             msg: 'UPDATE_QUESTION',
// //             from: 'content',
// //             payload: {
// //                 id: this.props.id,
// //                 isClosed: true,
// //                 howClosed: "Answered"
// //             }
// //         });
// //         this.props.notifyParentOfAdopted(this.props.id, replyId, adoptedState);
// //     }




// //     render() {
// //         const { idx, id, collapsed, author, pin, currentUser, authorId,
// //             childAnchor, currentUrl, url, anchor, updateAnchorTags, deleteAnchor, xpath, tags, annotationType,
// //             annotationContent, editing, replies, isPrivate, isClosed, howClosed, adopted, brokenAnchor, brokenChild, brokenReply } = this.props;
// //         const { replying, showReplies } = this.state;
// //         const closedStrings = ['Unanswered Question', 'No Longer Relevant', 'Answered'];
// //         let replyCountString = "";
// //         if (replies !== undefined) {
// //             if (replies.length > 1) {
// //                 replyCountString = " replies";
// //             }
// //             else {
// //                 replyCountString = " reply";
// //             }
// //         }

// //         let closeOutText = "";
// //         if (isClosed !== undefined) {
// //             if (!isClosed) {
// //                 closeOutText = "Unanswered Question";
// //             }
// //             else {
// //                 closeOutText = howClosed;
// //             }
// //         } else {
// //             closeOutText = "Unanswered Question";
// //         }
// //         let adoptedContent, showAdoptedAnchor;
// //         if (adopted === 0 || adopted) {
// //             replies.forEach(reply => {
// //                 if (reply.replyId === adopted) {
// //                     adoptedContent = reply.replyContent;
// //                     showAdoptedAnchor = reply.xpath !== null;
// //                 }
// //             });
// //         }

// //         const closeoutOptions = closedStrings.filter(str => str !== closeOutText);

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
// //                     })}
// //                 >
// //                     <div
// //                         className={classNames({ AnnotationContainerLeftPad: true })}
// //                     ></div>
// //                 </div>

// //                 <div id={id}
// //                     className={classNames({
// //                         AnnotationContainer: true,
// //                         SelectedAnnotationContainer: this.state.selected,
// //                     })}
// //                 >
// //                     <div className="annotationTypeBadgeContainer" onClick={_ => this.props.handleExpandCollapse(collapsedArg)}>
// //                         <div className="annotationTypeBadge row2">
// //                             <div className="annotationTypeBadge col2">
// //                                 <div className="badgeContainer">
// //                                     {isClosed ? (
// //                                         <img src={Question} alt='closed question badge' />
// //                                     ) : (
// //                                         <img src={openQuestion} alt='open question type badge' />
// //                                     )
// //                                     }

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

// //                     {!collapsed &&
// //                         <div className="openCloseQuestionRow">
// //                             <SplitButton
// //                                 key="openCloseQuestion"
// //                                 id="openCloseQuestion"
// //                                 variant="secondary"
// //                                 size="sm"
// //                                 title={closeOutText}
// //                                 onSelect={eventKey => this.closeOut(eventKey)}
// //                             >
// //                                 <BootstrapDropdown.Item className="dropdown-link" onSelect={eventKey => this.closeOut(eventKey)} eventKey={closeoutOptions[0]}>{closeoutOptions[0]}</BootstrapDropdown.Item>
// //                                 <BootstrapDropdown.Item className="dropdown-link" onSelect={eventKey => this.closeOut(eventKey)} eventKey={closeoutOptions[1]}>{closeoutOptions[1]}</BootstrapDropdown.Item>
// //                             </SplitButton>
// //                         </div>
// //                     }

// //                     {tags !== undefined && tags.length && !collapsed && !editing ? (
// //                         <div className={classNames({
// //                             TagRow: true
// //                         })}>
// //                             <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
// //                                 {tags.map((tagContent, idx) => {
// //                                     return (
// //                                         <CustomTag key={idx} content={tagContent} deleteTag={this.deleteTag} editing={editing} />
// //                                     )
// //                                 }
// //                                 )}
// //                             </ul>

// //                         </div>
// //                     ) : (null)}
// //                     {replying &&
// //                         <ReplyEditor id={id} idx={replies.length !== undefined ? replies.length : 0} replies={replies} finishReply={this.finishReply} showQuestionAnswerInterface={true} />
// //                     }
// //                     {adopted === 0 || adopted ? (
// //                         <React.Fragment>
// //                             <div className="SeparationRow">
// //                                 <div className="ShowHideReplies" >
// //                                     <div className="ExpandCollapse">
// //                                         <img src={expand} id="ShowReplies" className="Icon" alt="Answer" />
// //                                     </div>
// //                             Answer
// //                         </div>
// //                                 <hr className="divider" />
// //                             </div>
// //                             {showAdoptedAnchor && <Anchor
// //                                 id={this.props.id}
// //                                 replyId={replies[adopted].replyId}
// //                                 currentUrl={currentUrl}
// //                                 url={replies[adopted].url}
// //                                 collapsed={collapsed}
// //                                 anchorContent={replies[adopted].anchor}
// //                                 brokenAnchor={brokenReply.includes(adopted)}
// //                             />}
// //                             <div className="annotationContent">
// //                                 {adoptedContent}
// //                             </div>
// //                         </React.Fragment>
// //                     ) : (null)}
// //                     {replies !== undefined && showReplies && replies.length && !collapsed && !editing ? (
// //                         <div className="Replies">
// //                             <div className="SeparationRow">
// //                                 <div className="ShowHideReplies" onClick={this.handleShowReplies} >
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
// //                                             showQuestionAnswerInterface={true}
// //                                             currentUser={currentUser}
// //                                             xpath={reply.xpath}
// //                                             anchor={reply.anchor}
// //                                             hostname={reply.hostname}
// //                                             url={reply.url}
// //                                             offsets={reply.offsets}
// //                                             currentUrl={currentUrl}
// //                                             answerIsAdopted={this.answerIsAdopted}
// //                                             // notifyParentOfAdopted={this.props.notifyParentOfAdopted}
// //                                             adopted={this.props.adopted === reply.replyId}
// //                                             brokenAnchor={brokenReply.includes(reply.replyId)}
// //                                         />
// //                                     )
// //                                 }
// //                                 )}
// //                             </ul>
// //                         </div>
// //                     ) : (null)}
// //                     {replies !== undefined && !showReplies && !collapsed && replies.length ? (
// //                         <div className="ShowHideReplies" onClick={this.handleShowReplies} >
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
// //             </li >
// //         );
// //     }
// // }

// // export default QuestionAnswerAnnotation;