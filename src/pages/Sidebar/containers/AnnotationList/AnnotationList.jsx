import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {
  render() {
    const { annotations, currentUser } = this.props;

    /* {annotationsCopy.map((annotation, idx) => { */
    // this is just for the user study - do not keep this in real version of app!
    // const annotationsCopy = annotations.filter(anno => anno.authorId === currentUser.uid || anno.authorId === 'XRCVPsHHNANyhefwAaLBBCAecRz1');
    let listOfChildAnnos = annotations.filter(anno => anno.SharedId !== null);
    listOfChildAnnos.forEach(anno => {
      for (let parentAnno of annotations) {
        if (parentAnno.id === anno.SharedId && !parentAnno.childAnchor.includes(anno)) {
          // console.log('found a match - heres kid', anno);
          // console.log('and heres the rent', parentAnno);
          parentAnno.childAnchor.push(anno);
        }
      }
    });

    const annotationsCopy = annotations.filter(anno => anno.SharedId === null);
    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotationsCopy.map((annotation, idx) => {
          // console.log(annotation);
          return (
            <React.Fragment>
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
