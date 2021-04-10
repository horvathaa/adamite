

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
    if (ctx.collapsed) return (null);

    return (
        <React.Fragment>

            <div className={" container " + classNames({
                Header: true,
                Truncated: ctx.collapsed,
            })}>
                <div className="profileContainer">
                    <img src={profile} alt="profile" className="profile" />
                </div>
                <div className="userProfileContainer">

                    <div className="author">
                        {ctx.anno.author}
                    </div>
                    <div className="groupName">
                        {ctx.getGroupName()}
                    </div>
                    <div className="timestamp">
                        {formatTimestamp(ctx.anno.createdTimestamp)}
                    </div>
                </div>
                <div className="row">
                    <div className="AnnotationIconContainer">
                        <Tooltip title={"Reply to annotation"} aria-label="reply icon tooltip">
                            <div className="TopIconContainer" onClick={() => ctx.setReplying(true)}>
                                <img src={reply} alt="reply" className="profile" />
                            </div>
                        </Tooltip>
                        <Tooltip title={"Pin or unpin annotation"} aria-label="pin icon tooltip">
                            <div className="TopIconContainer" onClick={ctx.transmitPinToParent}>
                                {ctx.anno.pinned ? (
                                    <img src={fillpin} id="pin" alt="pin" className="profile" />
                                ) : (
                                    <img src={outlinepin} id="pin" alt="pin" className="profile" />
                                )}
                            </div>
                        </Tooltip>
                        <Tooltip title={"Add new anchor to annotation"} aria-label="add new anchor tooltip">
                            <div className="TopIconContainer" >
                                <img src={newAnchor} alt="add new anchor" id="newAnchor" className="profile" onClick={ctx.handleNewAnchor} />
                            </div>
                        </Tooltip>
                        {ctx.currentUser.uid === ctx.authorId ? (
                            <React.Fragment>
                                <Tooltip title={"Edit annotation"} aria-label="edit tooltip">
                                    <div className="TopIconContainer" >
                                        <img src={edit} alt="edit annotation" className="profile" id="edit" onClick={() => ctx.setEditing(!ctx.editing)} />
                                    </div>
                                </Tooltip>
                                <Tooltip title={"Delete annotation"} aria-label="delete annotation tooltip">
                                    <div className="TopIconContainer" >
                                        <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={ctx.deleteAnchor} />
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