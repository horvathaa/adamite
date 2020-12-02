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
    // let listOfChildAnnos, annotationSuperSet, annotationsToRender = [];
    // console.log('hmm', annotations, altAnnotationList);
    // if (altAnnotationList !== undefined) {
    //   console.log('sigh')
    //   listOfChildAnnos = annotations.filter(anno => anno.SharedId !== null);
    //   let altChildAnnos = altAnnotationList.filter(anno => anno.SharedId !== null && anno.url === this.props.url);
    //   // console.log(altChildAnnos, 'wahthathat');
    //   listOfChildAnnos = listOfChildAnnos.concat(altChildAnnos);
    //   annotationSuperSet = annotations.concat(altAnnotationList);
    //   // console.log('lol', listOfChildAnnos);
    // } else {
    //   console.log('why is this so bad lmao else');
    //   listOfChildAnnos = annotations.filter(anno => anno.SharedId !== null);
    //   annotationSuperSet = annotations;
    // }



    // listOfChildAnnos.forEach(anno => {
    //   for (let parentAnno of annotationSuperSet) {
    //     if (altAnnotationList !== undefined) {
    //       annotationsToRender = annotationSuperSet;
    //     }
    //     if (typeof anno.SharedId !== "undefined") {
    //       // console.log('anno in loop', anno);
    //       if (parentAnno.id === anno.SharedId && !parentAnno.childAnchor.includes(anno)) {
    //         parentAnno.childAnchor.push(anno);
    //         if (altAnnotationList !== undefined) {
    //           if ((parentAnno.url === this.props.url || anno.url === this.props.url) && !annotationsToRender.includes(parentAnno)) {
    //             annotationsToRender.push(parentAnno);
    //           }
    //         }
    //         else {
    //           annotationsToRender.push(parentAnno);
    //         }
    //       }

    //     }
    //   }

    // });

    // console.log('before filter', annotationsToRender);

    // let annotationsCopy = annotationsToRender.filter(anno => anno.SharedId === null || "undefined" === typeof (anno['SharedId']));
    // // annotationsCopy = annotationsCopy.concat(annotationsToRender.filter(anno => {
    // //   return anno.childAnchor !== null &&
    // //     anno.childAnchor !== undefined &&
    // //     anno.childAnchor.length &&
    // //     anno.url === this.props.url
    // // })) // temp fix
    // console.log('afterfilter', annotationsCopy);
    // // this.props.requestFilterUpdate(annotationsCopy);
    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotations.map((annotation, idx) => {
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
