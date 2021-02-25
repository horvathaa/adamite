import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

import './AnnotationList.css';

class AnnotationList extends Component {

  notifyParentOfPinning = (id, pinned) => {
    this.props.notifyParentOfPinning(id, pinned);
  }

  render() {
    const { annotations, currentUser } = this.props;
    let renderedAnnotations = this.props.showPinned !== undefined && this.props.showPinned ? annotations.filter(a => a.pinned === false) : annotations;

    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {renderedAnnotations.map((annotation, idx) => {
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
