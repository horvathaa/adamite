import React, { Component } from 'react';
import Annotation from './Annotation/Annotation';

/*
Initiated in Sidebar
*/


class AnnotationList extends Component {

  notifyParentOfPinning = (id, pinned) => {
    this.props.notifyParentOfPinning(id, pinned);
  }
  render() {
    const { annotations, currentUser } = this.props;
    return (
      <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
        {annotations.map((anno, idx) => {
          return (
            <Annotation
              key={idx}
              idx={idx}
              annotation={anno}
              notifyParentOfPinning={this.notifyParentOfPinning}
              userGroups={this.props.groups}
              currentUrl={this.props.url}
              currentUser={currentUser}
            />
          );
        })}
      </ul>
    );
  }
}
export default AnnotationList;
