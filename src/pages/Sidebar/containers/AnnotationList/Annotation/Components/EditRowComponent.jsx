

import React, { useContext } from 'react';
import classNames from 'classnames';
import '../Annotation.css';
import profile from '../../../../../../assets/img/SVGs/Profile.svg';
import reply from '../../../../../../assets/img/SVGs/Reply.svg';
import outlinepin from '../../../../../../assets/img/SVGs/pin.svg';
import fillpin from '../../../../../../assets/img/SVGs/pin_2.svg';
import newAnchor from '../../../../../../assets/img/SVGs/NewAnchor2.svg';
import edit from '../../../../../../assets/img/SVGs/edit.svg';
import trash from '../../../../../../assets/img/SVGs/delet.svg';
import Tooltip from '@material-ui/core/Tooltip';
import { CgProfile } from 'react-icons/cg';
import { BsReply, BsTrash } from 'react-icons/bs';
import { AiOutlinePushpin, AiOutlineEdit, AiFillPushpin, AiOutlineComment, AiOutlineUser } from 'react-icons/ai';

import { BiAnchor } from 'react-icons/bi';
import { FaRegComment } from 'react-icons/fa';
import AnnotationContext from "../AnnotationContext";
import { formatTimestamp } from "../../../../utils"
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
                    {/* <img src={profile} alt="profile" className="profile" /> */}
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
                                {/* <img src={reply} alt="reply" className="profile" /> */}
                            </div>
                        </Tooltip>
                        <Tooltip title={"Pin or unpin annotation"} aria-label="pin icon tooltip">
                            <div className="TopIconContainer" onClick={ctx.handlePin}>
                                {ctx.anno.pinned ? (
                                    <AiFillPushpin className="profile" id="pin" alt="pin" />
                                    // <img src={fillpin} id="pin" alt="pin" className="profile" />
                                ) : (
                                    <AiOutlinePushpin className="profile" id="pin" alt="pin" />
                                    // <img src={outlinepin} id="pin" alt="pin" className="profile" />
                                )}
                            </div>
                        </Tooltip>
                        <Tooltip title={"Add new anchor to annotation"} aria-label="add new anchor tooltip">
                            <div className="TopIconContainer" >
                                <BiAnchor className="profile" alt="add new anchor" id="newAnchor" onClick={ctx.handleNewAnchor} />
                                {/* <img src={newAnchor} alt="add new anchor" id="newAnchor" className="profile" onClick={ctx.handleNewAnchor} /> */}
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
                </div>
            </div>
        </React.Fragment>
    );
}

export default EditRowComponent;