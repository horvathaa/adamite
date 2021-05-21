import React, { Component, useEffect, useState } from 'react';
import classNames from 'classnames';
import { AiFillPushpin, AiOutlinePushpin } from 'react-icons/ai';
import outlinepin from '../../../../../assets/img/SVGs/pin.svg';
import fillpin from '../../../../../assets/img/SVGs/pin_2.svg';
import './Annotation.css';
import { deleteAnnotationForeverById, updateAnnotationById, getUserProfileById } from '../../../../../firebase';
// import DefaultAnnotation from './DefaultAnnotation';
// import ToDoAnnotation from './ToDoAnnotation';
// import HighlightAnnotation from './HighlightAnnnotation';
// import IssueAnnotation from './IssueAnnotation';
// import QuestionAnswerAnnotation from './QuestionAnswerAnnotation';
import { RiTruckLine } from 'react-icons/ri';
import AnnotationContext from "./AnnotationContext";
import EditRowComponent from "./Components/EditRowComponent";
import CollapsedDiv from './Components/CollapsedDiv';
import AnnotationTagsList from './Components/AnnotationTagsList';
import AnnotationType from './Components/AnnotationType';
import expand from '../../../../../assets/img/SVGs/expand.svg';
import CardWrapper from '../../CardWrapper/CardWrapper'
import AnchorList from './AnchorList/AnchorList';
import Anchor from './AnchorList/Anchor';
import Reply from './Reply/Reply';
import ReplyEditor from './Reply/ReplyEditor';
import RepliesList from './Reply/RepliesList';

import Highlight from '../../../../../assets/img/SVGs/Highlight.svg';
import Issue from '../../../../../assets/img/SVGs/Issue.svg';
import Question from '../../../../../assets/img/SVGs/Question.svg';
import Default from '../../../../../assets/img/SVGs/Default.svg';
import Todo from '../../../../../assets/img/SVGs/Todo.svg';
// import { updateAnnotation } from '../../../../Background/helpers/annotationHelpers';

/*
Initiated in Annotation List
*/

let messagesOut = [
  //sidebarHelper
  'TEMP_ANNOTATION_ADDED',
  'REMOVE_TEMP_ANNOTATION',
  'ANNOTATION_DELETED_ON_PAGE',
]


const Annotation = ({ idx, annotation, isNew = false, notifyParentOfPinning, resetNewSelection = () => { }, currentUrl, userGroups, currentUser }) => {

  const [editing, setEditing] = useState(isNew);
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(!isNew);
  const [showReplies, setShowReplies] = useState(false);
  const [anno, setAnno] = useState(annotation);

  useEffect(() => {
    if (annotation !== anno && anno.childAnchor !== annotation.childAnchor) {
      setAnno(annotation);
    }
    if (isNew) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            msg: 'TEMP_ANNOTATION_ADDED',
            newAnno: anno.childAnchor[0],
          }
        );
      });
    }
  }, [annotation, anno, isNew]);


  const AnnotationBadgeContainer = () => {
    let badge = anno.type === 'issue' ? Issue : anno.type === 'highlight' ? Highlight : anno.type === 'todo' ? Todo : anno.type === 'question' ? Question : Default;
    return (<div className="annotationTypeBadgeContainer" onClick={() => setCollapsed(!collapsed)}>
      <div className="annotationTypeBadge row2">
        <div className="annotationTypeBadge col2">
          <div className="badgeContainer">
            <img src={badge} alt={`${anno.type} type badge`} />
          </div>
        </div>
      </div>
    </div>);
  }


  return (<div>
    <AnnotationContext.Provider
      value={{
        idx: idx,
        id: anno.id,
        anno: anno,
        isNew: isNew,
        currentUrl: currentUrl,
        currentUser: currentUser,
        isCurrentUser: currentUser.uid === anno.authorId,
        userGroups: userGroups,

        collapsed: collapsed,
        setCollapsed: (val) => { setCollapsed(val); },
        editing: editing,
        setEditing: (val) => { setEditing(val); },
        showReplies: showReplies,
        handleShowReplies: (val) => { setShowReplies(val) },
        replying: replying,
        setReplying: (val) => { setReplying(val) },
        brokenReply: [],
        brokenChild: [],



        handlePin: () => {
          const newAnno = { ...anno, pinned: !anno.pinned };
          if (newAnno !== anno) {
            console.log('how many times is this being done')
            chrome.runtime.sendMessage({
              msg: 'ANNOTATION_UPDATED',
              from: 'content',
              payload: {
                newAnno
              }
            });
            setAnno(newAnno);
          }
        },

        updateAnnotation: (newAnno) => {
          if (newAnno !== anno) {
            chrome.runtime.sendMessage({
              msg: 'ANNOTATION_UPDATED',
              from: 'content',
              payload: {
                newAnno
              }
            });
            setAnno(newAnno);
          }
          setEditing(false);
        },
        updateAnnotationFields: (annotationFields) => {
          if (!annotationFields) { setEditing(false); return; }
          const newAnno = { ...anno, ...annotationFields };
          if (newAnno !== anno) {
            chrome.runtime.sendMessage({
              msg: 'ANNOTATION_UPDATED',
              from: 'content',
              payload: {
                newAnno: newAnno
              }
            });
            setAnno(newAnno);
          }
          setEditing(false);
        },

        brokenAnchor: false,
        handleNewAnchor: () => {
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(
              tabs[0].id, {
              msg: 'ADD_NEW_ANCHOR',
              payload: {
                newAnno: anno,
                updateType: "NewAnchor"
              }
            });
          });

        },
        updateAnchors: (newAnchors) => {
          chrome.runtime.sendMessage({
            msg: 'ANNOTATION_UPDATED',
            from: 'content',
            payload: {
              newAnno: { ...anno, childAnchor: newAnchors },
              updateType: "NewAnchor"
            }

          });
          setAnno({ ...anno, childAnchor: newAnchors })
        },
        // Reply

        replyCountString: anno.replies !== undefined && anno.replies.length === 1 ? "reply" : "replies",
        handleTrashClick: () => {
          // eslint-disable-next-line no-restricted-globals
          if (confirm("Are you sure? This action cannot be reversed")) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
              let url = tabs[0].url;
              if (currentUrl[0] === url) {
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
        },
        handleExpertReview: () => { console.log('handled'); },
        closeOut: (questionState) => {
          const newAnno = { ...anno, howClosed: questionState, isClosed: questionState === "Answered" || questionState === "No Longer Relevant", pinned: !(questionState === "Answered" || questionState === "No Longer Relevant") }
          if (newAnno !== anno) {
            chrome.runtime.sendMessage({
              msg: 'ANNOTATION_UPDATED',
              from: 'content',
              payload: {
                newAnno
              }
            });
            setAnno(newAnno);
          }
        },
        cancelButtonHandler: () => {
          if (isNew) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
              chrome.tabs.sendMessage(tabs[0].id, { msg: 'REMOVE_TEMP_ANNOTATION', });
            });
            resetNewSelection();

          }
        },
        submitButtonHandler: (newAnno) => {
          console.log('newanno', newAnno)
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { msg: 'REMOVE_TEMP_ANNOTATION', },
              response => {
                if (response.msg === 'REMOVED') {
                  chrome.runtime.sendMessage(
                    {
                      msg: 'CREATE_ANNOTATION', //'SAVE_ANNOTATED_TEXT',
                      payload: {
                        newAnno: newAnno,
                        url: currentUrl,
                      },
                    },
                    response => {
                      if (response.msg === 'DONE') {
                        resetNewSelection();
                      }
                    }
                  );
                }
              }
            );
          });
        },
        handleExpandCollapse: () => { },
        getGroupName: () => {
          let matches = [];
          if (userGroups !== undefined && anno.groups !== undefined) {
            matches = userGroups.filter(group => anno.groups.includes(group.gid));
          }
          if (matches.length > 0) {
            let formattedString = "";
            matches.forEach((group, i) => {
              if (i === (matches.length - 1)) {
                formattedString += group.name;
              }
              else {
                formattedString += group.name + ", ";
              }
            });
            return formattedString;
          }
          else {
            return anno.isPrivate ? "Private" : "Public";
          }
        },
      }}
    >
      {

        <li key={idx} id={anno.id} className={classNames({ AnnotationItem: true })}>
          <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} >
            <div className={classNames({ AnnotationContainerLeftPad: true })}></div>
          </div>
          <div id={anno.id} className={classNames({ AnnotationContainer: true, ActiveAnnotationContainer: true, })} >
            {!isNew && <AnnotationBadgeContainer />}
            <EditRowComponent />
            <AnchorList />
            <CardWrapper isNew={isNew} />
            {!editing && <AnnotationType />}
            <AnnotationTagsList />
            {replying && <ReplyEditor finishReply={() => setReplying(false)} />}
            <RepliesList />
            {!isNew && <CollapsedDiv />}
          </div>
          <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} >
            <div className={classNames({ AnnotationContainerRightPad: true })} ></div>
          </div>
          <div className={classNames({ AnnotationContainerPad: true, AnnotationPadActive: true, })} ></div>
        </li>
      }
    </AnnotationContext.Provider>
  </div >
  )
}
export default Annotation;

