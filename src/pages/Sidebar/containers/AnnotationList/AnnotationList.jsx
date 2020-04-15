import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {
    // state = {
    //  probably want search, filter here in order to dynamically alter the list
    //  determine whether the list of annotations needs to be updated either by URL changing or filter/search
    // }
    render() {
        const { annotations } = this.props;
        let annotationsCopy = [];
        let idx = 0;
        annotations.map((annotation) => {
            Object.entries(annotation).map(([key, value]) => {
                annotationsCopy.push({ anchor: key, content: value, idx: idx });
                idx += 1;
            })
        });

        return (
            <ul>{
                annotationsCopy.map((annotation) => {
                    return (
                        <li key={annotation.idx}>
                            <Annotation
                                key={annotation.idx}
                                anchor={annotation.anchor}
                                content={annotation.content}
                            />
                        </li>
                    );
                })
            }

            </ul>
        )
    }
}



export default AnnotationList;