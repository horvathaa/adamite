
import React, { useContext } from 'react';
import '../Annotation.css';
import expand from '../../../../../../assets/img/SVGs/expand.svg';
import Reply from './Reply';
import { BiExpand} from 'react-icons/bi';

import AnnotationContext from "../AnnotationContext";


import ReplyModel from "./ReplyModel";
import classNames from 'classnames';

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
            {ctx.showReplies && <hr className="divider" />   }
                <div className="ShowHideReplies" onClick={() => ctx.handleShowReplies(!ctx.showReplies)}>
                    <div className={classNames({ ExpandCollapse: true, hidden: !ctx.showReplies })}>
                        {/* <BiExpand className={classNames({ Icon: true })} alt="Show replies"  /> */}
                        {/* <img src={expand} className={classNames({ Icon: true })} alt="Show replies" onClick={() => ctx.handleShowReplies(!ctx.showReplies)} /> */}
                    </div>
                    {ctx.anno.replies.length} {ctx.replyCountString}
                </div>
                
            </div>
            {ctx.showReplies && <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                {ctx.anno.replies.map((reply, idx) => {
                    return (<Reply reply={reply} idx={idx} />)
                }
                )}
            </ul>}
        </div>
    );
}


export default RepliesList;