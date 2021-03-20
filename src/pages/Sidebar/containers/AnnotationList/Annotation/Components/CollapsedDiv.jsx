

import React, { useContext } from 'react';
import '../Annotation.css';
import AnnotationContext from "../AnnotationContext";
import expand from '../../../../../../assets/img/SVGs/expand.svg'


const CollapsedDiv = () => {
    const annoContext = useContext(AnnotationContext);
    return (annoContext.collapsed ? (
        <div className="ExpandCollapse">
            <img src={expand} alt="Expand" onClick={_ => annoContext.handleExpandCollapse('expand')} className="Icon" />
        </div>
    ) : (
        <div className="ExpandCollapse">
            <img src={expand} id="collapse" alt="Collapse" onClick={_ => annoContext.handleExpandCollapse('collapse')} className="Icon" />
        </div>
    ));
}
export default CollapsedDiv;