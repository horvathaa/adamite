import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {
  render() {
    const { annotations, currentUser } = this.props;

    // this is just for the user study - do not keep this in real version of app!
    const annotationsCopy = annotations.filter(anno => anno.authorId === currentUser.uid || anno.authorId === 'XRCVPsHHNANyhefwAaLBBCAecRz1');

    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotationsCopy.map((annotation, idx) => {
          return (
            <React.Fragment>
              <Annotation
                key={idx}
                id={annotation.id}
                anchor={annotation.anchorContent}
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
