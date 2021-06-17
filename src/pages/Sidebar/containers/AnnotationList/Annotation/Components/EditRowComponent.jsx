

import React, { useContext } from 'react';
import classNames from 'classnames';
import '../Annotation.css';
import { Dropdown } from 'react-bootstrap';
import Tooltip from '@material-ui/core/Tooltip';
import { BsTrash } from 'react-icons/bs';
import { AiOutlinePushpin, AiOutlineEdit, AiFillPushpin, AiOutlineComment, AiOutlineUser } from 'react-icons/ai';
import { BiAnchor } from 'react-icons/bi';
import AnnotationContext from "../AnnotationContext";
import { formatTimestamp } from "../../../../utils"
import { GiHamburgerMenu } from 'react-icons/gi';

/*
Context Used

collapsed
anno.author

getGroupName()
formatTimestamp()

transmitPinToParent
setReplying

handleNewAnchorRequest
handleEditRequest
handleDeleteRequest

*/

const EditRowComponent = () => {
    const ctx = useContext(AnnotationContext);
    if (ctx.collapsed || ctx.isNew) return (null);

    return (
        <React.Fragment>
            <div className={" container " + classNames({
                Header: true,
                Truncated: ctx.collapsed,
            })}>
                <div className="profileContainer">
                    <AiOutlineUser alt="profile" className="userProfile" />
                </div>
                <div className="userProfileContainer">

                    <div className="author">
                        {ctx.anno.author}
                    </div>
                    <div className="groupName">
                        {ctx.getGroupName()}
                    </div>
                    <div className="timestamp">
                        {ctx.anno.createdTimestamp !== undefined ? formatTimestamp(ctx.anno.createdTimestamp) : (null)}
                    </div>
                </div>

                <div className="row">
                    <div className="AnnotationIconContainer">
                        <Tooltip title={"Reply to annotation"} aria-label="reply icon tooltip">
                            <div className="TopIconContainer" onClick={() => ctx.setReplying(true)}>
                                <AiOutlineComment className="profile" alt="reply" />
                            </div>
                        </Tooltip>
                        <Tooltip title={"Pin or unpin annotation"} aria-label="pin icon tooltip">
                            <div className="TopIconContainer" onClick={ctx.handlePin}>
                                {ctx.anno.pinned ? (
                                    <AiFillPushpin className="profile" id="pin" alt="pin" />
                                ) : (
                                    <AiOutlinePushpin className="profile" id="pin" alt="pin" />
                                )}
                            </div>
                        </Tooltip>
                        <Tooltip title={"Add new anchor to annotation"} aria-label="add new anchor tooltip">
                            <div className="TopIconContainer" >
                                <BiAnchor className="profile" alt="add new anchor" id="newAnchor" onClick={ctx.handleNewAnchor} />
                            </div>
                        </Tooltip>
                        {ctx.currentUser.uid === ctx.anno.authorId ? (
                            <React.Fragment>
                                <Tooltip title={"Edit annotation"} aria-label="edit tooltip">
                                    <div className="TopIconContainer" >
                                        <AiOutlineEdit className="profile" alt="edit annotation" className="profile" id="edit" onClick={() => ctx.setEditing(!ctx.editing)} />
                                        {/* <img src={edit} alt="edit annotation" className="profile" id="edit" onClick={() => ctx.setEditing(!ctx.editing)} /> */}
                                    </div>
                                </Tooltip>
                                <Tooltip title={"Delete annotation"} aria-label="delete annotation tooltip">
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
                            <Dropdown.Menu style={{width: '220px'}}>
                                <Dropdown.Header className="AnnotationOptionsTitle">
                                    Annoation Options
                                    <hr></hr>
                                </Dropdown.Header>
                                <Dropdown.Item onClick={() => ctx.setReplying(true)} className="DropdownItemOverwrite">
                                    <div className="DropdownIconsWrapper">
                                        <AiOutlineComment className="DropdownIcons" alt="reply" />
                                    </div>
                                    Reply
                                </Dropdown.Item>
                                <Dropdown.Item onClick={ctx.handlePin} className="DropdownItemOverwrite">
                                    {ctx.anno.pinned ? (
                                        <React.Fragment>
                                            <div className="DropdownIconsWrapper">
                                                <AiFillPushpin className="DropdownIcons" id="pin" alt="pin" />
                                            </div>
                                            Unpin
                                        </React.Fragment>
                                    ) : (
                                        <React.Fragment>
                                            <div className="DropdownIconsWrapper">
                                                <AiOutlinePushpin className="DropdownIcons" id="pin" alt="pin" />
                                            </div>
                                            Pin
                                        </React.Fragment>
                                    )}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={ctx.handleNewAnchor} className="DropdownItemOverwrite">
                                    <div className="DropdownIconsWrapper">
                                        <BiAnchor className="DropdownIcons" alt="add new anchor" id="newAnchor" />
                                    </div>
                                    Add Another Anchor
                                </Dropdown.Item>
                                {ctx.currentUser.uid === ctx.anno.authorId ? (
                                    <React.Fragment>
                                        <Dropdown.Item onClick={() => ctx.setEditing(!ctx.editing)} className="DropdownItemOverwrite">
                                            <div className="DropdownIconsWrapper">
                                                <AiOutlineEdit className="DropdownIcons" alt="edit annotation" className="profile" id="edit" />
                                            </div>
                                            Edit Annotation
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={ctx.handleTrashClick} className="DropdownItemOverwrite">
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
        </React.Fragment>
    );
}

export default EditRowComponent;