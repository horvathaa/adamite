import React, { Component, useContext, useEffect, useState } from 'react';
import profile from '../../../../../../assets/img/SVGs/Profile.svg';
import CustomTag from '../../../CustomTag/CustomTag';
import Anchor from '../AnchorList/Anchor';
import '../Annotation.css';
import './Reply.module.css';
import ReplyEditor from './ReplyEditor';
import { Text } from 'slate'
import AnnotationContext from "../AnnotationContext";
import { formatTimestamp } from "../../../../utils"
import cleanReplyModel from './ReplyModel';
import { Dropdown } from 'react-bootstrap';
import Tooltip from '@material-ui/core/Tooltip';
import { BsTrash } from 'react-icons/bs';
import { AiOutlineEdit, AiOutlineUser } from 'react-icons/ai';
import { GiHamburgerMenu } from 'react-icons/gi';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

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

    const deserializeJson = (node) => {
        if (Text.isText(node)) {
            let string = node.text;
            if (node.bold && node.italic && string !== "") {
                string = `***${string}***`
            }
            else if(node.bold && string !== "") {
                string = `**${string}**`
            }
            else if(node.italic && string !== "") {
                string = `*${string}*`
            }
            if (node.code) {
                string = `\`${string}\``
            }
            
            return string
        }
        
        const children = node.children.map(n => deserializeJson(n)).join('');
    
        switch (node.type) {
            case 'paragraph':
                return `\n${children}\n`
            case 'link':
                return `[${children}](${escapeHtml(node.url)})`
            case 'code': {
                return `\t${children}\n`
            }
            default:
                return children
        }
    }

    const codeComponent = {
        code({node, inline, className, children, ...props }) {
            return !inline ? <SyntaxHighlighter style={coy} language={'js'} PreTag="div" children={String(children).replace(/\n$/, '')} {...props} /> :
            <code className={className} {...props}>
                {children}
            </code>
        }
    }



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
                    {idx !== 0}
                    <li key={idx} className="ReplyContent">
                        <div className=" container Header">
                            <div className={replyData.photoURL === "" && "profileContainer"}>
                                {replyData.photoURL === ""  || replyData.photoURL === null ?
                                    <AiOutlineUser alt="profile" className="userProfile" /> :
                                    <img src={replyData.photoURL} alt="profile" className="profilePhoto userProfilePhoto" />
                                }
                            </div>
                            {/* <div className="profileContainer">
                                <img src={profile} alt="profile" className="profile" />
                            </div> */}
                            <div className="userProfileContainer">
                                <div className="author">
                                    {replyData.displayName === null || replyData.displayName === "" ? replyData.author : replyData.displayName}
                                </div>
                                <div className="timestamp">
                                    {formatTimestamp(replyData.timestamp)}
                                </div>
                            </div>

                            <div className="row">
                                <div className="AnnotationIconContainer">
                                    {ctx.currentUser.uid === replyData.authorId ? (
                                        <React.Fragment>
                                            <Tooltip title={"Edit reply"} aria-label="edit tooltip" onClick={_ => setEditing(true)}>
                                                <div className="TopIconContainer" >
                                                    <AiOutlineEdit className="profile" alt="edit reply" id="edit" onClick={() => setEditing(!ctx.editing)} />
                                                </div>
                                            </Tooltip>
                                            <Tooltip title={"Delete reply"} aria-label="delete reply tooltip" onClick={deleteReply}>
                                                <div className="TopIconContainer" >
                                                    <BsTrash alt="delete reply" className="profile" id="trash" onClick={deleteReply} />
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
                                            {ctx.currentUser.uid === replyData.authorId ? (
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
                        </div>
                        {reply.anchor !== null ? (
                            <Anchor anchor={reply.anchor} replyIdProp={replyData.replyId} />) : (null)}
                        <ReactMarkdown
                            children={isJson(replyData.replyContent) ? deserializeJson(JSON.parse(replyData.replyContent)) : replyData.replyContent}
                            components={codeComponent}
                        />
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