import React, { useContext } from 'react';
import classNames from 'classnames';
import '../Annotation.css';
import CustomTag from '../../../CustomTag/CustomTag';
import AnnotationContext from "../AnnotationContext";

/*
Context Used
anno.tags
editing
collapsed
deleteTag
*/


const AnnotationTagsList = () => {
    const ctx = useContext(AnnotationContext);
    if (ctx.anno.tags === undefined || !ctx.anno.tags.length || ctx.collapsed || ctx.editing) return (null);

    return (
        <div className={classNames({
            TagRow: true
        })}>
            <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                {ctx.anno.tags.map((tagContent, idx) => {
                    return (
                        <CustomTag idx={idx} content={tagContent} deleteTag={ctx.deleteTag} editing={ctx.editing} />
                    )
                }
                )}
            </ul>

        </div>
    );
}

export default AnnotationTagsList;