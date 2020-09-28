import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {

  notifyParentOfPinning = (id, pinned) => {
    this.props.notifyParentOfPinning(id, pinned);
  }

  render() {
    const { annotations, currentUser } = this.props;


    // TODO: make shared ID of parent the parent's ID so river can do his search check
    // also fix child anchor on URL click thing - load parent annotation
    let listOfChildAnnos = annotations.filter(anno => anno.SharedId !== null);
    listOfChildAnnos.forEach(anno => {
      for (let parentAnno of annotations) {
        if (typeof anno.SharedId !== "undefined") {
          if (parentAnno.id === anno.SharedId && !parentAnno.childAnchor.includes(anno)) {
            parentAnno.childAnchor.push(anno);
          }
        }
      }
    });

    // console.log('before filter', annotations);

    const annotationsCopy = annotations.filter(anno => anno.SharedId === null || "undefined" === typeof (anno['SharedId']));
    // this.props.requestFilterUpdate(annotationsCopy);
    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotationsCopy.map((annotation, idx) => {
          return (
            <Annotation
              key={idx}
              id={annotation.id}
              anchor={annotation.anchorContent}
              childAnchor={annotation.childAnchor}
              content={annotation.content}
              div={annotation.div}
              active={annotation.active}
              type={annotation.type}
              authorId={annotation.authorId}
              currentUser={currentUser}
              trashed={annotation.trashed}
              timeStamp={annotation.createdTimestamp}
              offsets={annotation.offsets}
              xpath={annotation.xpath}
              url={annotation.url}
              currentUrl={this.props.url}
              tags={annotation.tags}
              pinned={annotation.pinned}
              notifyParentOfPinning={this.notifyParentOfPinning}
              replies={annotation.replies}
              isPrivate={annotation.private}
              isClosed={annotation.isClosed}
              howClosed={annotation.howClosed}
              adopted={annotation.adopted}
              author={annotation.author}
            />
          );
        })}
      </ul>
    );
  }
}

export default AnnotationList;
