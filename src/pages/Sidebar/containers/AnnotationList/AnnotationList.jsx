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
    console.log(annotations);
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






//onst AnnotationList = (notifyParentOfPinning, groups, url) => {
//       </ul>
//     );
//   }
// }


   // key={idx}
              // id={annotation.id}
              // anchor={annotation.anchorContent}
              // childAnchor={annotation.childAnchor}
              // content={annotation.content}
              // div={annotation.div}
              // active={annotation.active}
              // type={annotation.type}
              // authorId={annotation.authorId}
              // currentUser={currentUser}
              // trashed={annotation.trashed}
              // timeStamp={annotation.createdTimestamp}
              // offsets={annotation.offsets}
              // xpath={annotation.xpath}
              // url={annotation.url}
              // currentUrl={this.props.url}
              // tags={annotation.tags}
              // pinned={annotation.pinned}
              // notifyParentOfPinning={this.notifyParentOfPinning}
              // replies={annotation.replies}
              // isPrivate={annotation.private}
              // isClosed={annotation.isClosed}
              // howClosed={annotation.howClosed}
              // adopted={annotation.adopted}
              // author={annotation.author}
              // userGroups={this.props.groups}
              // annoGroups={annotation.groups}
              // readCount={annotation.readCount}
            ///>

  // const notifyParentOfPinning = (id, pinned) => {
  //   notifyParentOfPinning(id, pinned);
  // }



// class AnnotationList extends Component {

//   notifyParentOfPinning = (id, pinned) => {
//     this.props.notifyParentOfPinning(id, pinned);
//   }

//   render() {
//     const { annotations, currentUser } = this.props;

//     return (
//       <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
//         {annotations.map((annotation, idx) => {
//           return (
//             <Annotation
//               key={idx}
//               id={annotation.id}
//               anchor={annotation.anchorContent}
//               childAnchor={annotation.childAnchor}
//               content={annotation.content}
//               div={annotation.div}
//               active={annotation.active}
//               type={annotation.type}
//               authorId={annotation.authorId}
//               currentUser={currentUser}
//               trashed={annotation.trashed}
//               timeStamp={annotation.createdTimestamp}
//               offsets={annotation.offsets}
//               xpath={annotation.xpath}
//               url={annotation.url}
//               currentUrl={this.props.url}
//               tags={annotation.tags}
//               pinned={annotation.pinned}
//               notifyParentOfPinning={this.notifyParentOfPinning}
//               replies={annotation.replies}
//               isPrivate={annotation.private}
//               isClosed={annotation.isClosed}
//               howClosed={annotation.howClosed}
//               adopted={annotation.adopted}
//               author={annotation.author}
//               userGroups={this.props.groups}
//               annoGroups={annotation.groups}
//               readCount={annotation.readCount}
//             />
//           );
//         })}
//       </ul>
//     );
//   }
// }

// export default AnnotationList;
