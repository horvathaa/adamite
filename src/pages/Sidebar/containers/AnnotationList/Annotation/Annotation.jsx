import React, { Component } from 'react';
import classNames from 'classnames';
import './Annotation.css';

class Annotation extends Component {
  handleDoneToDo() {
    console.log('handled');
    return;
  }

  render() {
    const { anchor, content, idx, id, active, todo } = this.props;
    //console.log(idx);
    return (
      <li key={idx} id={id} className={classNames({ AnnotationItem: true })}>
        <div
          className={classNames({
            AnnotationContainerPad: true,
            AnnotationPadActive: true,
          })}
        >
          <div
            className={classNames({ AnnotationContainerLeftPad: true })}
          ></div>
        </div>
        <div id={id}
          className={classNames({
            AnnotationContainer: true,
            ActiveAnnotationContainer: active,
            ToDoAnnotationContainer: todo
          })}
        >
          {/* if(todo){
            <React.Fragment>
              <button className="btn btn-sm btn-outline-danger"
                onClick={_ => this.handleDoneToDo()}>Done?
                </button>
            </React.Fragment>} */}
          <div
            className={classNames({
              AnchorContainer: true,
            })}
          >
            {anchor}
          </div>
          <div
            className={classNames({
              ContentContainer: true,
            })}
          >
            {content}
          </div>
        </div>
        <div
          className={classNames({
            AnnotationContainerPad: true,
            AnnotationPadActive: true,
          })}
        >
          <div
            className={classNames({ AnnotationContainerRightPad: true })}
          ></div>
        </div>
      </li>
    );
  }
}

export default Annotation;
