import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {
  render() {
    const { annotations, currentUser } = this.props;
    let annotationsCopy = [];
    annotations.forEach(annotation => {
      annotationsCopy.push({
        anchor: annotation.anchorContent,
        content: annotation.content,
        id: annotation.id,
        div: annotation.div,
        active: false, // annotation.active,
        type: annotation.type,
        authorId: annotation.authorId,
      });
    });

    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotationsCopy.map((annotation, idx) => {
          return (
            <Annotation
              key={idx}
              id={annotation.id}
              anchor={annotation.anchor}
              content={annotation.content}
              div={annotation.div}
              active={annotation.active}
              type={annotation.type}
              authorId={annotation.authorId}
              currentUser={currentUser}
              trashed={annotation.trashed}
            />
          );
        })}
      </ul>
    );
  }
}

export default AnnotationList;
