import React, { useContext } from 'react';
import '../Annotation.css';
import Anchor from './Anchor';
import AnnotationContext from "../AnnotationContext";

const AnchorList = () => {
    const ctx = useContext(AnnotationContext);
    if (ctx.anno.childAnchor === undefined || ctx.anno.childAnchor === null || !ctx.anno.childAnchor.length) return (null);
    return (
        <ul className='AnchorList' style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
            {ctx.anno.childAnchor.map((childAnch, idx) => {
                return (<li key={idx} className='Anchor'>
                    <Anchor anchor={childAnch} />
                </li>
                );
            })}
        </ul>
    )
}

export default AnchorList;
