// import React, { useState } from 'react';
// // import { Dropdown } from 'react-bootstrap';
// import './NewAnnotation.css';
// // import ReactDOM from 'react-dom';
// // import { Editor, EditorState } from 'draft-js';
// // import { GiCancel } from 'react-icons/gi';
// // import RichEditor from '../RichTextEditor/RichTextEditor'
// // import CustomTag from '../CustomTag/CustomTag';
// // import TagsInput from 'react-tagsinput'
// // import Dropdown from 'react-dropdown';
// import CardWrapper from '../CardWrapper/CardWrapper'
// import { AiOutlineConsoleSql } from 'react-icons/ai';
// import { v4 as uuidv4 } from 'uuid';

// const NewAnnotation = () => {
//   //let folderId = uuidv4();
//   const [submitted, setSubmitted] = useState(false);
//   const [addedTag, setAddedTag] = useState(false);
//   const [annotationContent, setAnnotationContent] = useState('');
//   const [annotationType, setAnnotationType] = useState('default');
//   const [tags, setTags] = useState([])

//   componentDidMount() {
//     //document.addEventListener('keydown', this.keydown, false);
//     const { xpath, offsets } = this.props;
//     const annotationInfo = {
//       xpath: xpath,
//       offsets: offsets,
//     };
//     chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         {
//           msg: 'TEMP_ANNOTATION_ADDED',
//           newAnno: annotationInfo,
//         }
//       );
//     });
//   }


//   deleteTag = (tagName) => { setTags(tags.filter(tag => tag !== tagName)); }

//   cancelButtonHandler = () => {
//     chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         {
//           msg: 'REMOVE_TEMP_ANNOTATION',
//         }
//       );
//     });
//     this.props.resetNewSelection();
//   }

//   submitButtonHandler = (CardWrapperState) => {
//     this.setState({ submitted: true });
//     chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         {
//           msg: 'REMOVE_TEMP_ANNOTATION',
//         },
//         response => {
//           if (response.msg === 'REMOVED') {
//             const { url, newSelection, xpath, offsets } = this.props;
//             const annotationInfo = {
//               anchor: newSelection,
//               annotation: CardWrapperState.annotationContent,
//               xpath: xpath,
//               offsets: offsets,
//               tags: CardWrapperState.tags,
//               annotationType: CardWrapperState.annotationType.toLowerCase(),
//               private: CardWrapperState.private,
//               groups: CardWrapperState.groups
//             };
//             chrome.runtime.sendMessage(
//               {
//                 msg: 'SAVE_ANNOTATED_TEXT',
//                 payload: {
//                   content: annotationInfo,
//                   url,
//                 },
//               },
//               response => {
//                 console.log('response', response);
//                 if (response.msg === 'DONE') {
//                   console.log('response', response);

//                   this.setState({ submitted: false });
//                   this.props.resetNewSelection();
//                 }
//               }
//             );
//           }
//         }
//       );
//     });
//   };


//   const { newSelection, type, annoContent, userGroups } = this.props;

//   const options = [
//     'Default', 'To-do', 'Highlight', 'Issue'
//   ];

//   const submittedLoadState = (
//     <div className="spinner-border text-secondary" role="status">
//       <span className="sr-only">...</span>
//     </div>
//   )

//   const defaultOption = options[0];



//   const { annotationContent, submitted, tags } = this.state;

//   const annoBody = annoContent === "" ? annotationContent : annoContent;

//   return (<div>
//     <AnnotationContext.Provider
//       value={{
//         anno: anno,
//         currentUrl: currentUrl,
//         currentUser: currentUser,
//         isCurrentUser: currentUser.uid === anno.authorId,
//         userGroups: userGroups,
//         collapsed: collapsed,
//         setCollapsed: (val) => { setCollapsed(val); },
//         editing: editing,
//         setEditing: (val) => { setEditing(val); },

//         brokenReply: [],
//         brokenChild: [],



//         transmitPinToParent: (id, pinned) => { notifyParent(id, pinned) },

//         updateAnnotation: (newAnno) => {
//           console.log("update", newAnno);
//           if (newAnno !== anno) {
//             chrome.runtime.sendMessage({
//               msg: 'ANNOTATION_UPDATED',
//               from: 'content',
//               payload: {
//                 id: newAnno.id,
//                 type: newAnno.type.toLowerCase(),
//                 content: newAnno.content,
//                 tags: newAnno.tags,
//                 isPrivate: newAnno.private,
//                 groups: newAnno.groups,
//                 childAnchor: newAnno.childAnchor
//               }
//             });
//             setAnno(newAnno);
//           }
//           setEditing(false);
//         },
//         brokenAnchor: false,
//         handleNewAnchor: () => {
//           chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             chrome.tabs.sendMessage(tabs[0].id, {
//               msg: 'ADD_NEW_ANCHOR',
//               payload: {
//                 content: anno.content,
//                 type: anno.type,
//                 sharedId: anno.id,
//                 author: currentUser.uid,
//                 tags: anno.tags,
//                 groups: anno.groups
//               }
//             });
//           });
//         },

//         handleEditClick: () => { },
//         handleTrashClick: (id) => {},
//         handleDoneToDo: (id) => {
//           chrome.runtime.sendMessage({
//             msg: 'FINISH_TODO',
//             from: 'content',
//             payload: { id }
//           });
//           transmitPinToParent();
//         },
//         handleExpertReview: () => { console.log('handled'); },
//         cancelButtonHandler: () => {
//           if(isNew){
//             chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//               chrome.tabs.sendMessage(
//                 tabs[0].id,
//                 {
//                   msg: 'REMOVE_TEMP_ANNOTATION',
//                 }
//               );
//             });
//             resetNewSelection();
//           }
//          },
//         submitButtonHandler: () => { },
//         handleExpandCollapse: () => { },
//         notifyParentOfAdopted: () => { },
//         getGroupName: () => { },
//       }}
//     >
//       <li key={idx} id={anno.id} className={classNames({ AnnotationItem: true })}>
//         <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} >
//           <div className={classNames({ AnnotationContainerLeftPad: true })}></div>
//         </div>
//         <div id={anno.id} className={classNames({ AnnotationContainer: true, ActiveAnnotationContainer: true, })} >
//           <AnnotationBadgeContainer />
//           <EditRowComponent />
//           <AnchorList />
//           <CardWrapper />
//           <AnnotationTagsList />

//           {replying && <ReplyEditor id={id} finishReply={() => setReplying(false)} />}
//           {/* <RepliesList /> 
//                 <ShowRepliesComponent />  */}
//           <CollapsedDiv />
//         </div>
//         <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} >
//           <div className={classNames({ AnnotationContainerRightPad: true })} ></div>
//         </div>
//         <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} ></div>
//       </li>
//     </AnnotationContext.Provider>
//   </div>
//   );
// }
// export default NewAnnotation;



  // constructor(props) {
  //   super(props);
  //   this.annotationChangeHandler = this.annotationChangeHandler.bind(this)
  // }

  // saveAnnotationContent(w) {
  //   this.setState({
  //     annotationContent: w
  //   })
  // }

  // state = {
  //   submitted: false,
  //   addedTag: false,
  //   annotationContent: '',
  //   annotationType: "default",
  //   tags: [],
  // };
  // componentWillUnmount() {
  //   document.removeEventListener('keydown', this.keydown, false);

  // }


  // updateAnnotationType(eventKey) {
  //   this.setState({ annotationType: eventKey });
  // }

  // annotationChangeHandler = (value) => {
  //   this.setState({ annotationContent: value });
  // };

  // annotationTagHandler = event => {

  // }

  //   return (
  //     <React.Fragment>
  //       <CardWrapper
  //         tags={tags} annotationContent={annoBody}
  //         childAnchor={[]}
  //         edit={!submitted}
  //         pageAnnotation={newSelection}
  //         annotationType={type}
  //         userGroups={userGroups}
  //         cancelButtonHandler={this.cancelButtonHandler}
  //         submitButtonHandler={this.submitButtonHandler}
  //         elseContent={submittedLoadState} />
  //     </React.Fragment>

  //   );
  // }




// class NewAnnotation extends React.Component {

//   constructor(props) {
//     super(props);
//     this.annotationChangeHandler = this.annotationChangeHandler.bind(this)
//   }

//   saveAnnotationContent(w) {
//     this.setState({
//       annotationContent: w
//     })
//   }

//   state = {
//     submitted: false,
//     addedTag: false,
//     annotationContent: '',
//     annotationType: "default",
//     tags: [],
//   };

//   componentDidMount() {
//     document.addEventListener('keydown', this.keydown, false);
//     const { xpath, offsets } = this.props;
//     const annotationInfo = {
//       xpath: xpath,
//       offsets: offsets,
//     };
//     chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         {
//           msg: 'TEMP_ANNOTATION_ADDED',
//           newAnno: annotationInfo,
//         }
//       );
//     });
//   }

//   componentWillUnmount() {
//     document.removeEventListener('keydown', this.keydown, false);

//   }

//   //TODO: FIX FOR NEW RICH TEXT ANNOTATOR
//   // keydown = e => {
//   //   if (e.key === 'Enter' && e.target.className === 'form-control' && this.state.annotationContent !== '') {
//   //     this.submitButtonHandler();
//   //   }
//   //   else if (e.key === 'Enter' && e.target.className === 'tag-control' && e.target.value !== '') {
//   //     e.preventDefault();
//   //     this.state.tags.push(e.target.value);
//   //     this.setState({ addedTag: true });
//   //     e.target.value = '';
//   //     console.log(this.state.tags);
//   //   }
//   // };

//   updateAnnotationType(eventKey) {
//     this.setState({ annotationType: eventKey });
//   }

//   annotationChangeHandler = (value) => {
//     this.setState({ annotationContent: value });
//   };

//   annotationTagHandler = event => {

//   }

//   deleteTag = (tagName) => {
//     this.setState({ tags: this.state.tags.filter(tag => tag !== tagName) });

//   }

//   tagsHandleChange = (newTag) => {
//     this.setState({ tags: newTag })
//   }

//   cancelButtonHandler = () => {
//     chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         {
//           msg: 'REMOVE_TEMP_ANNOTATION',
//         }
//       );
//     });
//     this.props.resetNewSelection();
//   }

//   submitButtonHandler = (CardWrapperState) => {
//     this.setState({ submitted: true });
//     chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         {
//           msg: 'REMOVE_TEMP_ANNOTATION',
//         },
//         response => {
//           if (response.msg === 'REMOVED') {
//             const { url, newSelection, xpath, offsets } = this.props;
//             const annotationInfo = {
//               anchor: newSelection,
//               annotation: CardWrapperState.annotationContent,
//               xpath: xpath,
//               offsets: offsets,
//               tags: CardWrapperState.tags,
//               annotationType: CardWrapperState.annotationType.toLowerCase(),
//               private: CardWrapperState.private,
//               groups: CardWrapperState.groups
//             };
//             chrome.runtime.sendMessage(
//               {
//                 msg: 'SAVE_ANNOTATED_TEXT',
//                 payload: {
//                   content: annotationInfo,
//                   url,
//                 },
//               },
//               response => {
//                 console.log('response', response);
//                 if (response.msg === 'DONE') {
//                   console.log('response', response);
//                   // annotationInfo.id = response.value;
//                   // if (annotationInfo.xpath !== null) {
//                   //   chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//                   //     chrome.tabs.sendMessage(
//                   //       tabs[0].id,
//                   //       {
//                   //         msg: 'ANNOTATION_ADDED',
//                   //         newAnno: annotationInfo,
//                   //       }
//                   //     );
//                   //   });
//                   // }

//                   this.setState({ submitted: false });
//                   this.props.resetNewSelection();
//                 }
//               }
//             );
//           }
//         }
//       );
//     });


//   };

//   render() {
//     const { newSelection, type, annoContent, userGroups } = this.props;

//     const options = [
//       'Default', 'To-do', 'Highlight', 'Issue'
//     ];

//     const submittedLoadState = (
//       <div className="spinner-border text-secondary" role="status">
//         <span className="sr-only">...</span>
//       </div>
//     )

//     const defaultOption = options[0];

//     // if (!newSelection) {
//     //   return null;
//     // }

//     const { annotationContent, submitted, tags } = this.state;

//     const annoBody = annoContent === "" ? annotationContent : annoContent;

//     return (
//       <React.Fragment>
//         <CardWrapper
//           tags={tags} annotationContent={annoBody}
//           childAnchor={[]}
//           edit={!submitted}
//           pageAnnotation={newSelection}
//           annotationType={type}
//           userGroups={userGroups}
//           cancelButtonHandler={this.cancelButtonHandler}
//           submitButtonHandler={this.submitButtonHandler}
//           elseContent={submittedLoadState} />
//       </React.Fragment>

//     );
//   }
// }

// export default NewAnnotation;
