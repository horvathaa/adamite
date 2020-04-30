import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {
  render() {
    const { annotations } = this.props;
    let annotationsCopy = [];
    let idx = 0;
    annotations.forEach(annotation => {
      annotationsCopy.push({
        anchor: annotation.anchor,
        content: annotation.annotation,
        idx: idx,
        id: annotation.id,
        div: annotation.div,
        active: annotation.active
      });
      idx += 1;
    });

    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotationsCopy.map(annotation => {
          return (
            <Annotation
              key={annotation.idx}
              id={annotation.id}
              anchor={annotation.anchor}
              content={annotation.content}
              div={annotation.div}
              active={annotation.active}
            />
          );
        })}
      </ul>
    );
  }
}

export default AnnotationList;
