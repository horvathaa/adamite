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
    annotations.forEach((annotation) => {
      Object.entries(annotation).forEach(([key, value]) => {
        annotationsCopy.push({ anchor: key, content: value, idx: idx });
        idx += 1;
      });
    });

    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotationsCopy.map((annotation) => {
          return (
            <Annotation
              key={annotation.idx}
              anchor={annotation.anchor}
              content={annotation.content}
            />
          );
        })}
      </ul>
    );
  }
}

export default AnnotationList;
