

import React, { useContext } from 'react';
import '../Annotation.css';
import AnnotationContext from "../AnnotationContext";
import expand from '../../../../../../assets/img/SVGs/expand.svg'


/*
Context Used
editing
replying
collapsed

setCollapsed

*/

const CollapsedDiv = () => {
    const ctx = useContext(AnnotationContext);
    if (ctx.editing && ctx.replying) return (null);
    return (ctx.collapsed ? (
        <div className="ExpandCollapse">
            <img src={expand} alt="Expand" onClick={_ => ctx.setCollapsed(false)} className="Icon" />
        </div>
    ) : (
        <div className="ExpandCollapse">
            <img src={expand} id="collapse" alt="Collapse" onClick={_ => ctx.setCollapsed(true)} className="Icon" />
        </div>
    ));
}
export default CollapsedDiv;