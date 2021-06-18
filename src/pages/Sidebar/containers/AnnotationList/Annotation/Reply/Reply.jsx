import React, { Component, useContext, useEffect, useState } from 'react';
import profile from '../../../../../../assets/img/SVGs/Profile.svg';
import CustomTag from '../../../CustomTag/CustomTag';
import Anchor from '../AnchorList/Anchor';
import '../Annotation.css';
import './Reply.module.css';
import ReplyEditor from './ReplyEditor';
import AnnotationContext from "../AnnotationContext";
import { formatTimestamp } from "../../../../utils"
import cleanReplyModel from './ReplyModel';
import { Dropdown } from 'react-bootstrap';
import Tooltip from '@material-ui/core/Tooltip';
import { BsTrash } from 'react-icons/bs';
import { AiOutlineEdit} from 'react-icons/ai';
import { GiHamburgerMenu } from 'react-icons/gi';

const Reply = ({ idx, reply }) => {

    const ctx = useContext(AnnotationContext);
    // const content = reply.replyContent,
    //author = reply.author,
    const currentUser = ctx.currentUser;
    const [replyData, setReply] = useState(cleanReplyModel(reply));
    const [editing, setEditing] = useState(false);
    const [adopted, setAdopted] = useState(false); // switch to liked - array of objects where each item in the list is an object {id: currentUser.id, liked: true/false}
    let showQuestionAnswerInterface = ctx.anno.type === 'question';

    useEffect(() => {
        if (reply !== replyData) {
            setReply(reply);
        }
    }, [reply, replyData])



    const finishReply = () => {
        setEditing(false);
        ctx.setReplying(false);
    }
    const deleteReply = () => {
        const remainingReplies = ctx.anno.replies.filter(r => r.replyId !== replyData.replyId);
        ctx.updateAnnotation({ ...ctx.anno, replies: remainingReplies });
    }

    // const star = adopted ?
    //     <AiFillStar className="profile" /> :
    //     <AiOutlineStar className="profile" />;

    return (<React.Fragment>
        {editing ?
            (<ReplyEditor
                edit={true}
                reply={replyData}
                showQuestionAnswerInterface={showQuestionAnswerInterface}
                finishReply={finishReply}
            />) : (
                <React.Fragment>
                    {idx !== 0 }
                    <li key={idx} className="ReplyContent">
                        <div className=" container Header">
                            <div className="profileContainer">
                                <img src={profile} alt="profile" className="profile" />
                            </div>
                            <div className="userProfileContainer">
                                <div className="author">
                                    {replyData.author}
                                </div>
                                <div className="timestamp">
                                    {formatTimestamp(replyData.timestamp)}
                                </div>
                            </div>

                            <div className="row">
                                <div className="AnnotationIconContainer">
                                    {ctx.currentUser.uid === ctx.anno.authorId ? (
                                        <React.Fragment>
                                            {/* <Tooltip title="Star Comment" aria-label="Star Comment" onClick={ctx.transmitAdoptedToParent}>
                                                <div className="TopIconContainer" >
                                                    {star}
                                                </div>
                                            </Tooltip> */}
                                            <Tooltip title={"Edit annotation"} aria-label="edit tooltip" onClick={_ => setEditing(true)}>
                                                <div className="TopIconContainer" >
                                                    <AiOutlineEdit className="profile" alt="edit annotation" className="profile" id="edit" onClick={() => ctx.setEditing(!ctx.editing)} />
                                                </div>
                                            </Tooltip>
                                            <Tooltip title={"Delete annotation"} aria-label="delete annotation tooltip" onClick={deleteReply}>
                                                <div className="TopIconContainer" >
                                                    <BsTrash alt="delete annotation" className="profile" id="trash" onClick={ctx.handleTrashClick} />
                                                    {/* <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={ctx.handleTrashClick} /> */}
                                                </div>
                                            </Tooltip>
                                        </React.Fragment>
                                    ) : (null)}
                                </div>

                                <div className="AnnotationsOptions">
                                    <Dropdown>
                                        <Dropdown.Toggle id="dropdown-basic" className="vertical-center">
                                            <GiHamburgerMenu alt="Hamburger menu" className="profile" />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu style={{ width: '220px' }}>
                                            <Dropdown.Header className="AnnotationOptionsTitle">
                                                 Reply Options
                                                <hr></hr>
                                            </Dropdown.Header>
                                            {/* <Dropdown.Item onClick={ctx.transmitAdoptedToParent} className="DropdownItemOverwrite">
                                                <div className="DropdownIconsWrapper">
                                                    {star}
                                                </div>
                                                Star Comment
                                            </Dropdown.Item> */}
                                            {ctx.currentUser.uid === ctx.anno.authorId ? (
                                                <React.Fragment>
                                                    <Dropdown.Item onClick={_ => setEditing(true)} className="DropdownItemOverwrite">
                                                        <div className="DropdownIconsWrapper">
                                                            <AiOutlineEdit className="DropdownIcons" alt="edit annotation" className="profile" id="edit" />
                                                        </div>
                                                        Edit Annotation
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={deleteReply} className="DropdownItemOverwrite">
                                                        <div className="DropdownIconsWrapper">
                                                            <BsTrash alt="delete annotation" className="DropdownIcons" id="trash" />
                                                        </div>
                                                        Delete
                                                    </Dropdown.Item>
                                                </React.Fragment>
                                            ) : (null)}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </div>

                            {/* <div className="row">
                                <div className="AnnotationIconContainer">
                                    {star}
                                    {currentUser.uid === replyData.authorId ? (
                                        <React.Fragment>
                                            <div className="TopIconContainer" >
                                                <img src={edit} alt="edit reply" className="profile" id="edit" onClick={_ => setEditing(true)} />
                                            </div>
                                            <div className="TopIconContainer" >
                                                <img src={trash} alt="delete reply" className="profile" id="delete" onClick={deleteReply} />
                                            </div>
                                        </React.Fragment>
                                    ) : (null)}
                                </div>
                            </div> */}
                        </div>
                        {reply.anchor !== null ? (
                            <Anchor anchor={replyData.anchor} replyIdProp={replyData.replyId} />) : (null)}
                        <div className="annotationContent">
                            <div className="contentBody">
                                {replyData.replyContent}
                            </div>
                        </div>
                        {replyData.tags !== undefined && replyData.tags.length ? (
                            <div className="TagRow">
                                <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                                    {replyData.tags.map((tagContent, idx) => {
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

}

export default Reply;