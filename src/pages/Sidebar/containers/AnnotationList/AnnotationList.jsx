import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {

  notifyParentOfPinning = (id, pinned) => {
    this.props.notifyParentOfPinning(id, pinned);
  }

  render() {
    const { annotations, altAnnotationList, currentUser } = this.props;
    // console.log('what am i DOING', altAnnotationList);

    let listOfChildAnnos = annotations.filter(anno => anno.SharedId !== null);
    let altChildAnnos = altAnnotationList.filter(anno => anno.SharedId !== null);
    // console.log(altChildAnnos, 'wahthathat');
    listOfChildAnnos = listOfChildAnnos.concat(altChildAnnos);
    let annotationsToRender = annotations.concat(altAnnotationList);
    // console.log('lol', listOfChildAnnos);
    listOfChildAnnos.forEach(anno => {
      for (let parentAnno of annotationsToRender) {
        if (typeof anno.SharedId !== "undefined") {
          // console.log('anno in loop', anno);
          if (parentAnno.id === anno.SharedId && !parentAnno.childAnchor.includes(anno)) {
            parentAnno.childAnchor.push(anno);
          }
        }
      }
    });

    // console.log('before filter', annotations);

    let annotationsCopy = annotations.filter(anno => anno.SharedId === null || "undefined" === typeof (anno['SharedId']));
    annotationsCopy = annotationsCopy.concat(annotationsToRender.filter(anno => anno.childAnchor !== null && anno.childAnchor !== undefined && anno.childAnchor.length && anno.url === this.props.url)) // temp fix
    // console.log('afterfilter', annotationsCopy);
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
              userGroups={this.props.groups}
              annoGroups={annotation.groups}
              readCount={annotation.readCount}
            />
          );
        })}
      </ul>
    );
  }
}

export default AnnotationList;
