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
        offsets: annotation.offsets,
        xpath: annotation.xpath,
        active: false,
        type: annotation.type,
        authorId: annotation.authorId,
        timeStamp: annotation.createdTimestamp,
        url: annotation.url,
        tags: annotation.tags
      });
    });

    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotationsCopy.map((annotation, idx) => {
          return (
            <React.Fragment>
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
                timeStamp={annotation.timeStamp}
                offsets={annotation.offsets}
                xpath={annotation.xpath}
                url={annotation.url}
                tags={annotation.tags}
              />
              <div className="AnnotationListPadding" key={1000 + idx}></div>
            </React.Fragment>
          );
        })}
      </ul>
    );
  }
}

export default AnnotationList;
