import React, { Component, useEffect, useState } from 'react';
import { AiFillPushpin, AiOutlinePushpin } from 'react-icons/ai';
import outlinepin from '../../../../../assets/img/SVGs/pin.svg';
import fillpin from '../../../../../assets/img/SVGs/pin_2.svg';
import './Annotation.css';
import { deleteAnnotationForeverById, updateAnnotationById, getUserProfileById } from '../../../../../firebase';
import DefaultAnnotation from './DefaultAnnotation';
import ToDoAnnotation from './ToDoAnnotation';
import HighlightAnnotation from './HighlightAnnnotation';
import IssueAnnotation from './IssueAnnotation';
import QuestionAnswerAnnotation from './QuestionAnswerAnnotation';
import { RiTruckLine } from 'react-icons/ri';
import AnnotationContext from "./AnnotationContext";

/*
Initiated in Annotation List
*/


const Annotation = ({ idx, annotation, notifyParent, currentUrl, userGroups, currentUser }) => {

  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [anno, setAnno] = useState(annotation);

  // useEffect(() => {
  //   // document.addEventListener('keydown', this.keydown, false);
  //   if (annotation !== anno) {
  //     setAnno(annotation);
  //   }
  // });


  return (<div>
    <AnnotationContext.Provider
      value={{
        idx: idx,
        id: anno.id,
        anno: anno,
        userGroups: userGroups,
        collapsed: collapsed,
        setCollapsed: (val) => { setCollapsed(val); },
        brokenReply: [],
        brokenChild: [],
        currentUrl: currentUrl,
        currentUser: currentUser,
        isCurrentUser: currentUser.uid === anno.authorId,
        editing: editing,
        setEditing: (val) => { setEditing(val); },

        formatTimestamp: null,
        transmitPinToParent: (id, pinned) => { notifyParent(id, pinned) },
        updateAnnotation: (newAnno) => {
          console.log("update", newAnno);
          if (newAnno !== anno) {
            chrome.runtime.sendMessage({
              msg: 'ANNOTATION_UPDATED',
              from: 'content',
              payload: {
                id: newAnno.id,
                type: newAnno.type.toLowerCase(),
                content: newAnno.content,
                tags: newAnno.tags,
                isPrivate: newAnno.private,
                groups: newAnno.groups,
                childAnchor: newAnno.childAnchor
              }
            });
            setAnno(newAnno);
          }
          setEditing(false);
        },
        //   submitButtonHandler = (CardWrapperState, id) => {
        //     this.setState({ annoGroups: CardWrapperState.groups });
        //     chrome.runtime.sendMessage({
        //       msg: 'ANNOTATION_UPDATED',
        //       from: 'content',
        //       payload: {
        //         id: CardWrapperState.id,
        //         type: CardWrapperState.annotationType.toLowerCase(),
        //         content: CardWrapperState.annotationContent,
        //         tags: CardWrapperState.tags,
        //         isPrivate: CardWrapperState.private,
        //         groups: CardWrapperState.groups,
        //         childAnchor: CardWrapperState.childAnchor
        //       }
        //     });
        //     this.setState({ editing: false });
        //   }
        // Anchors
        brokenAnchor: false,
        handleNewAnchor: () => {
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
              msg: 'ADD_NEW_ANCHOR',
              payload: {
                content: anno.content,
                type: anno.type,
                sharedId: anno.id,
                author: currentUser.uid,
                tags: anno.tags,
                groups: anno.groups
              }
            });
          });
        },
        updateAnchorTags: ({ newTags, childId = null }) => {
          const childAnch = anno.childAnchor.map((c) => {
            if (c.id !== childId) return c;
            let y = c;
            y.tags = newTags;
            return y;
          });
          console.log("anchor");
          chrome.runtime.sendMessage({
            msg: 'ANNOTATION_UPDATED',
            from: 'content',
            payload: {
              id: anno.id,
              type: anno.type.toLowerCase(),
              content: anno.content,
              tags: anno.tags,
              isPrivate: anno.isPrivate,
              groups: anno.groups,
              childAnchor: childAnch
            }
          })
        },
        deleteAnchor: ({ anchorId }) => {
          const childAnch = anno.childAnchor.filter((c) => c.id !== anchorId)
          console.log(anno);
          chrome.runtime.sendMessage({
            msg: 'ANNOTATION_UPDATED',
            from: 'content',
            payload: {
              id: anno.id,
              type: anno.type.toLowerCase(),
              content: anno.content,
              tags: anno.tags,
              isPrivate: anno.private,
              groups: anno.groups,
              childAnchor: childAnch
            }
          });
        },

        // Reply
        replying: replying,
        setReplying: (val) => { setReplying(val); },
        showReply: false,
        replyCountString: "",
        handleShowReply: (id) => { },
        deleteReply: (id) => {
          const repliesToTransmit = anno.replies.filter(reply => reply.replyId !== id);
          chrome.runtime.sendMessage({
            msg: 'UPDATE_REPLIES',
            payload: {
              id: anno.id,
              replies: repliesToTransmit
            }
          });
        },




        handleEditClick: () => { },
        handleTrashClick: (id) => {
          // eslint-disable-next-line no-restricted-globals
          if (confirm("Are you sure? This action cannot be reversed")) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
              let url = tabs[0].url;
              if (this.props.url[0] === url) {
                chrome.tabs.sendMessage(
                  tabs[0].id,
                  {
                    msg: 'ANNOTATION_DELETED_ON_PAGE',
                    id: anno.id,
                  }
                );
              }
              chrome.runtime.sendMessage({
                msg: "ANNOTATION_DELETED",
                from: "content",
                payload: {
                  id: anno.id
                }
              })
            });
          } else {
            return;
          }
        },



        handleDoneToDo: (id) => {
          chrome.runtime.sendMessage({
            msg: 'FINISH_TODO',
            from: 'content',
            payload: { id }
          });
          transmitPinToParent();
        },
        handleExpertReview: () => { console.log('handled'); },
        cancelButtonHandler: () => { },
        submitButtonHandler: () => { },
        handleExpandCollapse: () => { },
        notifyParentOfAdopted: () => { },
        getGroupName: () => { },

      }}
    >
      <DefaultAnnotation />
    </AnnotationContext.Provider>
  </div>
  )
}

export default Annotation;



//tags: null,
////const [tags, setTags] = useState(anno);
/*
     {annotationType == "highlight" ? <HighlightAnnotation /> :
        annotationType == "issue" ? <IssueAnnotation /> :
          annotationType == "question" ? <QuestionAnswerAnnotation /> :
            <DefaultAnnotation />
            }
*/


   //childAnchor: null,

        //  replies: [],
      //  isPrivate: false,
       // url: null,
     //  xpath: null,
       // anchor: null,
        //annotationType: null,
        //content: null,
        //authorId: null,
        //pinned: false,

        //isClosed: null,
        //howClosed: null,

        //annoGroups: null,
        //readCount: null,







/*
  const {
    anchor,
    idx,
    id,
    active,
    authorId,
    currentUser,
    trashed,
    timeStamp,
    url,
    currentUrl,
    childAnchor,
    xpath,
    replies,
    isPrivate, adopted, editing, collapsed, tags, content, annotationType, pinned, isClosed, howClosed, userGroups, annoGroups, readCount, brokenAnchor, brokenReply, brokenChild } = this.props;

*/

// class Annotation extends Component {

//   constructor(props) {
//     super(props);
//     this.handleEditClick = this.handleEditClick.bind(this);
//     this.handleNewAnchor = this.handleNewAnchor.bind(this);
//     this.handleTrashClick = this.handleTrashClick.bind(this);
//   }

//   state = {
//     tags: this.props.tags,
//     content: this.props.content,
//     collapsed: true,
//     annotationType: this.props.type,
//     editing: false,
//     id: this.props.id,
//     authorId: this.props.authorId,
//     pinned: this.props.pinned,
//     brokenAnchor: false,
//     brokenReply: [],
//     brokenChild: [],
//     isClosed: this.props.isClosed,
//     howClosed: this.props.howClosed,
//     userGroups: this.props.userGroups === undefined ? [] : this.props.userGroups,
//     annoGroups: this.props.annoGroups === undefined ? [] : this.props.annoGroups,
//     readCount: this.props.readCount === undefined ? 0 : this.props.readCount
//   };

//   updateData = () => {
//     let { tags, content, type, authorId, pinned, isClosed, howClosed } = this.props;
//     this.setState({
//       tags, content, annotationType: type, authorId, pinned, isClosed, howClosed
//     });
//   }

//   async componentDidMount() {
//     document.addEventListener('keydown', this.keydown, false);
//     chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//       if (request.from === 'content' && request.msg === 'ANCHOR_BROKEN' && request.payload.id === this.props.id) {
//         if (this.props.url.includes(this.props.currentUrl) &&
//           request.payload.replyId !== undefined) {
//           const broken = this.props.replies.filter(r => r.replyId === request.payload.replyId);
//           let temp = this.state.brokenReply;
//           temp.push(String(broken[0].replyId));
//           this.setState({ brokenReply: temp });
//         }
//         else if (this.props.url.includes(this.props.currentUrl) &&
//           request.payload.childId !== undefined) {
//           const broken = this.props.childAnchor.filter(c => c.id === request.payload.childId);
//           let temp = this.state.brokenChild;
//           temp.push(broken[0].id);
//           this.setState({ brokenChild: temp });
//         }
//         else if (this.props.url[0] === this.props.currentUrl) {
//           if (sender.tab.url === this.props.currentUrl) {
//             this.setState({ brokenAnchor: true });
//           }
//         }
//       }
//     })
//     this.updateData();
//   }

//   componentDidUpdate(prevProps) {
//     if (prevProps.tags !== this.props.tags ||
//       prevProps.content !== this.props.content ||
//       prevProps.type !== this.props.type ||
//       prevProps.authorId !== this.props.authorId ||
//       prevProps.pinned !== this.props.pinned ||
//       prevProps.isClosed !== this.props.isClosed ||
//       prevProps.howClosed !== this.props.howClosed ||
//       prevProps.author !== this.props.author) {
//       this.updateData();
//     }
//   }

//   componentWillUnmount() {
//     document.removeEventListener('keydown', this.keydown, false);
//   }

//   formatTimestamp = () => {
//     let date = new Date(this.props.timeStamp);
//     var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//     var year = date.getFullYear();
//     var month = months[date.getMonth()];
//     var day = date.getDate();
//     var hour = date.getHours();
//     var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
//     var time = hour + ':' + min + ' ' + day + ' ' + month + ' ' + year;
//     return time;
//   }

//   getGroupName = () => {
//     let matches = [];
//     if (this.props.userGroups !== undefined && this.props.annoGroups !== undefined) {
//       matches = this.props.userGroups.filter(group => this.props.annoGroups.includes(group.gid));
//     }
//     if (matches.length > 0) {
//       let formattedString = "";
//       matches.forEach((group, i) => {
//         if (i === (matches.length - 1)) {
//           formattedString += group.name;
//         }
//         else {
//           formattedString += group.name + ", ";
//         }
//       });
//       return formattedString;
//     }
//     else {
//       return this.props.isPrivate ? "Private" : "Public";
//     }
//   }

//   handleDoneToDo(id) {
//     chrome.runtime.sendMessage({
//       msg: 'FINISH_TODO',
//       from: 'content',
//       payload: { id }
//     });
//     this.transmitPinToParent();
//   }

//   handleExpertReview = () => {
//     // could imagine having user's who are deemed "experts" in certain APIs or are documentation writers
//     // sort of like how Google had code reviewers with "readability" in certain languages and could provide
//     // expert opinion - this would require us to know a bit more about the current API we're looking at (may be able to ascertain
//     // from URL + anchor content)
//     console.log('handled');
//   }

//   handleUnArchive(e) {
//     let id = e.target.value;
//     chrome.runtime.sendMessage({
//       msg: 'UNARCHIVE',
//       from: 'content',
//       payload: { id }
//     });
//     this.transmitPinToParent();
//   }

//   handleTrashClick(id) {
//     // eslint-disable-next-line no-restricted-globals
//     if (confirm("Are you sure? This action cannot be reversed")) {
//       chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//         let url = tabs[0].url;
//         if (this.props.url[0] === url) {
//           chrome.tabs.sendMessage(
//             tabs[0].id,
//             {
//               msg: 'ANNOTATION_DELETED_ON_PAGE',
//               id: id,
//             }
//           );
//         }
//         chrome.runtime.sendMessage({
//           msg: "ANNOTATION_DELETED",
//           from: "content",
//           payload: {
//             id: id
//           }
//         })
//       });
//     } else {
//       return;
//     }
//   }

//   keydown = e => {
//     if (e.key === 'Enter' && e.target.className === 'tag-control-editAnnotation' && e.target.value !== '') {
//       e.preventDefault();
//       this.state.tags.push(e.target.value);
//     }
//   }

//   annotationTagHandler = event => {

//   }

//   annotationChangeHandler = event => {
//     this.setState({ content: event.target.value });
//   };

//   submitButtonHandler = (CardWrapperState, id) => {
//     this.setState({ annoGroups: CardWrapperState.groups });
//     chrome.runtime.sendMessage({
//       msg: 'ANNOTATION_UPDATED',
//       from: 'content',
//       payload: {
//         id: CardWrapperState.id,
//         type: CardWrapperState.annotationType.toLowerCase(),
//         content: CardWrapperState.annotationContent,
//         tags: CardWrapperState.tags,
//         isPrivate: CardWrapperState.private,
//         groups: CardWrapperState.groups,
//         childAnchor: CardWrapperState.childAnchor
//       }
//     });
//     this.setState({ editing: false });
//   }

//   updateAnnotationType(eventKey) {
//     this.setState({ annotationType: eventKey });
//   }

//   handleEditClick(id) {
//     this.setState({ editing: true })
//   }

//   handleEditCancel() {
//     this.setState({ editing: false });
//   }

//   handleNewAnchor = (id) => {
//     chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//       chrome.tabs.sendMessage(tabs[0].id, {
//         msg: 'ADD_NEW_ANCHOR',
//         payload: {
//           content: this.state.content,
//           type: this.state.annotationType,
//           sharedId: id,
//           author: this.props.currentUser.uid,
//           tags: this.state.tags,
//           groups: this.state.annoGroups
//         }
//       });
//     });
//   }
//   updateAnchorTags = ({ newTags, childId = null }) => {
//     let { content, type, isPrivate } = this.props;
//     // console.log("newTags", newTags);
//     //console.log(childId);
//     const childAnch = this.props.childAnchor.map((c) => {
//       if (c.id !== childId) return c;
//       let y = c;
//       y.tags = newTags;
//       return y;
//     });

//     chrome.runtime.sendMessage({
//       msg: 'ANNOTATION_UPDATED',
//       from: 'content',
//       payload: {
//         id: this.props.id,
//         type: type.toLowerCase(),
//         content: content,
//         tags: this.state.tags,
//         isPrivate: isPrivate,
//         groups: this.state.annoGroups,
//         childAnchor: childAnch
//       }
//     });
//   }
//   deleteAnchor = ({ childId = null }) => {
//     let { content, type, isPrivate } = this.props;
//     const childAnch = this.props.childAnchor.filter((c) => c.id !== childId)

//     chrome.runtime.sendMessage({
//       msg: 'ANNOTATION_UPDATED',
//       from: 'content',
//       payload: {
//         id: this.props.id,
//         type: type.toLowerCase(),
//         content: content,
//         tags: this.state.tags,
//         isPrivate: isPrivate,
//         groups: this.state.annoGroups,
//         childAnchor: childAnch
//       }

//     });
//     // console.log("delete child anchor", childId);

//   }

//   transmitPinToParent = () => {
//     this.handlePin().then(pinState => { this.props.notifyParentOfPinning(this.props.id, pinState) });
//   }

//   handlePin = () => {
//     return new Promise((resolve, reject) => {
//       const { pinned } = this.state;
//       this.setState({ pinned: !pinned });
//       resolve(!pinned);
//     });
//   }

//   notifyParentOfAdopted = (annoId, replyId, adoptedState) => {
//     chrome.runtime.sendMessage({
//       msg: 'REQUEST_ADOPTED_UPDATE',
//       from: 'content',
//       payload: {
//         annoId, replyId, adoptedState
//       }
//     })
//   }

//   cancelButtonHandler = () => {
//     this.setState({ editing: false });
//   }

//   deleteTag = (tagName) => {
//     this.setState({ tags: this.state.tags.filter(tag => tag !== tagName) });
//   }

//   handleExpandCollapse = (request) => {
//     if (request === 'collapse') {
//       this.setState({ collapsed: true });
//     }
//     else {
//       this.setState({ collapsed: false });
//       // this.setState({ readCount: this.state.readCount + 1 })
//       chrome.runtime.sendMessage({
//         msg: 'UPDATE_READ_COUNT',
//         from: 'content',
//         payload: {
//           id: this.props.id,
//           readCount: this.state.readCount
//         }
//       })
//     }
//   }

//   render() {
//     const { anchor, idx, id, active, authorId, currentUser, trashed, timeStamp, url, currentUrl, childAnchor, xpath, replies, isPrivate, adopted } = this.props;
//     const { editing, collapsed, tags, content, annotationType, pinned, isClosed, howClosed, userGroups, annoGroups, readCount, brokenAnchor, brokenReply, brokenChild } = this.state;
//     const author = this.props.author === undefined ? "anonymous" : this.props.author;
//     if (annotationType === 'default' && !trashed) {
//       return (<DefaultAnnotation
//         idx={idx}
//         id={id}
//         collapsed={collapsed}
//         author={author}
//         formatTimestamp={this.formatTimestamp}
//         pin={pinned}
//         transmitPinToParent={this.transmitPinToParent}
//         currentUser={currentUser}
//         authorId={authorId}
//         handleNewAnchor={this.handleNewAnchor}
//         handleEditClick={this.handleEditClick}
//         handleTrashClick={this.handleTrashClick}
//         childAnchor={childAnchor}
//         currentUrl={currentUrl}
//         url={url}
//         anchor={anchor}
//         updateAnchorTags={this.updateAnchorTags}
//         deleteAnchor={this.deleteAnchor}
//         xpath={xpath}
//         tags={tags}
//         annotationType={annotationType}
//         annotationContent={content}
//         editing={editing}
//         cancelButtonHandler={this.cancelButtonHandler}
//         submitButtonHandler={this.submitButtonHandler}
//         handleExpandCollapse={this.handleExpandCollapse}
//         isPrivate={isPrivate}
//         replies={replies}
//         notifyParentOfAdopted={this.notifyParentOfAdopted}
//         getGroupName={this.getGroupName}
//         userGroups={userGroups}
//         brokenAnchor={brokenAnchor}
//         brokenReply={brokenReply}
//         brokenChild={brokenChild}
//       />);
//     }
//     else if (annotationType === 'to-do' && !trashed && currentUser.uid === authorId) {
//       return (<ToDoAnnotation
//         idx={idx}
//         id={id}
//         collapsed={collapsed}
//         author={author}
//         formatTimestamp={this.formatTimestamp}
//         pin={pinned}
//         transmitPinToParent={this.transmitPinToParent}
//         currentUser={currentUser}
//         authorId={authorId}
//         handleNewAnchor={this.handleNewAnchor}
//         handleEditClick={this.handleEditClick}
//         handleTrashClick={this.handleTrashClick}
//         childAnchor={childAnchor}
//         currentUrl={currentUrl}
//         url={url}
//         anchor={anchor}
//         updateAnchorTags={this.updateAnchorTags}
//         deleteAnchor={this.deleteAnchor}
//         xpath={xpath}
//         tags={tags}
//         annotationType={annotationType}
//         annotationContent={content}
//         editing={editing}
//         handleDoneToDo={this.handleDoneToDo}
//         cancelButtonHandler={this.cancelButtonHandler}
//         submitButtonHandler={this.submitButtonHandler}
//         handleExpandCollapse={this.handleExpandCollapse}
//         replies={replies}
//         isPrivate={isPrivate}
//         notifyParentOfAdopted={this.notifyParentOfAdopted}
//         getGroupName={this.getGroupName}
//         userGroups={userGroups}
//         brokenAnchor={brokenAnchor}
//         brokenReply={brokenReply}
//         brokenChild={brokenChild}
//       />);
//     }
//     else if (annotationType === 'highlight') {
//       return (
//         <HighlightAnnotation
//           idx={idx}
//           id={id}
//           collapsed={collapsed}
//           author={author}
//           formatTimestamp={this.formatTimestamp}
//           pin={pinned}
//           transmitPinToParent={this.transmitPinToParent}
//           currentUser={currentUser}
//           authorId={authorId}
//           handleNewAnchor={this.handleNewAnchor}
//           handleEditClick={this.handleEditClick}
//           handleTrashClick={this.handleTrashClick}
//           childAnchor={childAnchor}
//           currentUrl={currentUrl}
//           url={url}
//           anchor={anchor}
//           updateAnchorTags={this.updateAnchorTags}
//           deleteAnchor={this.deleteAnchor}
//           xpath={xpath}
//           tags={tags}
//           annotationType={annotationType}
//           annotationContent={content}
//           editing={editing}
//           cancelButtonHandler={this.cancelButtonHandler}
//           submitButtonHandler={this.submitButtonHandler}
//           handleExpandCollapse={this.handleExpandCollapse}
//           replies={replies}
//           isPrivate={isPrivate}
//           notifyParentOfAdopted={this.notifyParentOfAdopted}
//           getGroupName={this.getGroupName}
//           userGroups={userGroups}
//           brokenAnchor={brokenAnchor}
//           brokenReply={brokenReply}
//           brokenChild={brokenChild}
//         />
//       );
//     }
//     else if (annotationType === 'question') {
//       return (
//         <QuestionAnswerAnnotation
//           idx={idx}
//           id={id}
//           collapsed={collapsed}
//           author={author}
//           formatTimestamp={this.formatTimestamp}
//           pin={pinned}
//           transmitPinToParent={this.transmitPinToParent}
//           currentUser={currentUser}
//           authorId={authorId}
//           handleNewAnchor={this.handleNewAnchor}
//           handleEditClick={this.handleEditClick}
//           handleTrashClick={this.handleTrashClick}
//           childAnchor={childAnchor}
//           currentUrl={currentUrl}
//           url={url}
//           anchor={anchor}
//           updateAnchorTags={this.updateAnchorTags}
//           deleteAnchor={this.deleteAnchor}
//           xpath={xpath}
//           tags={tags}
//           annotationType={annotationType}
//           annotationContent={content}
//           editing={editing}
//           replies={replies}
//           cancelButtonHandler={this.cancelButtonHandler}
//           submitButtonHandler={this.submitButtonHandler}
//           handleExpandCollapse={this.handleExpandCollapse}
//           isPrivate={isPrivate}
//           isClosed={isClosed}
//           howClosed={howClosed}
//           adopted={adopted}
//           notifyParentOfAdopted={this.notifyParentOfAdopted}
//           getGroupName={this.getGroupName}
//           userGroups={userGroups}
//           brokenAnchor={brokenAnchor}
//           brokenReply={brokenReply}
//           brokenChild={brokenChild}
//         />
//       );
//     }
//     else if (annotationType === 'issue') {
//       return (
//         <IssueAnnotation
//           idx={idx}
//           id={id}
//           collapsed={collapsed}
//           author={author}
//           formatTimestamp={this.formatTimestamp}
//           pin={pinned}
//           transmitPinToParent={this.transmitPinToParent}
//           currentUser={currentUser}
//           authorId={authorId}
//           handleNewAnchor={this.handleNewAnchor}
//           handleEditClick={this.handleEditClick}
//           handleTrashClick={this.handleTrashClick}
//           childAnchor={childAnchor}
//           currentUrl={currentUrl}
//           url={url}
//           anchor={anchor}
//           updateAnchorTags={this.updateAnchorTags}
//           deleteAnchor={this.deleteAnchor}
//           xpath={xpath}
//           tags={tags}
//           annotationType={annotationType}
//           annotationContent={content}
//           editing={editing}
//           handleExpertReview={this.handleExpertReview}
//           cancelButtonHandler={this.cancelButtonHandler}
//           submitButtonHandler={this.submitButtonHandler}
//           handleExpandCollapse={this.handleExpandCollapse}
//           replies={replies}
//           isPrivate={isPrivate}
//           getGroupName={this.getGroupName}
//           userGroups={userGroups}
//           brokenAnchor={brokenAnchor}
//           brokenReply={brokenReply}
//           brokenChild={brokenChild}
//         />
//       );
//     }
//     else {
//       return (
//         <React.Fragment>
//           {authorId === currentUser.uid ? (
//             <div className="whoops">
//               This annotation is archived &nbsp; &nbsp;
//               <button value={id} className="Unarchive" onClick={this.handleUnArchive}>
//                 Un-archive?
//             </button>
//             </div>
//           ) : (null)
//           }
//         </React.Fragment>
//       );
//     }
//   }
// }

// export default Annotation;
