
import React, { useContext } from 'react';
import '../Annotation.css';
import expand from '../../../../../../assets/img/SVGs/expand.svg';
import Reply from '../Reply/Reply';

import AnnotationContext from "../AnnotationContext";


/*
Context Used

anno.replies
collapsed
editing
handleShowReplies
replyCountString

*/
const RepliesList = () => {
    const ctx = useContext(AnnotationContext);
    if (ctx.anno.replies === undefined || !ctx.anno.replies.length || ctx.collapsed || ctx.editing)
        return (null);

    return (
        <div className="Replies">
            <div className="SeparationRow">
                <div className="ShowHideReplies">
                    <div className="ExpandCollapse">
                        <img src={expand} className="Icon" alt="Show replies" onClick={ctx.handleShowReplies} />
                    </div>
                    {ctx.anno.replies.length} {ctx.replyCountString}
                </div>
                <hr className="divider" />
            </div>
            <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                {ctx.anno.replies.map((reply, idx) => {
                    return (<Reply reply={reply} />)
                }
                )}
            </ul>
        </div>
    );
}


export default RepliesList;