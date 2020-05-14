import React, { Component } from 'react';
import classNames from 'classnames';
import { FaCaretDown, FaCaretUp, FaTrash } from 'react-icons/fa';
import './Annotation.css';
import { checkPropTypes, string } from 'prop-types';
import { deleteAnnotationForeverById } from '../../../../../firebase';

class Annotation extends Component {
  state = {
    collapsed: false
  }

  handleDoneToDo() {
    console.log('handled');
    return;
  }

  handleTrashClick(id) {
    deleteAnnotationForeverById(id);
  }

  handleExpandCollapse = (request) => {
    if (request === 'collapse') {
      this.setState({ collapsed: true });
    }
    else {
      this.setState({ collapsed: false });
    }
  }

  render() {
    const { anchor, content, idx, id, active, type, authorId, currentUser } = this.props;
    if (type === 'default') {
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
            })}
          >
            <div
              className={classNames({
                AnchorContainer: true,
                Truncated: this.state.collapsed
              })}
            >
              {anchor}
            </div>
            <div
              className={classNames({
                ContentContainer: true,
                Truncated: this.state.collapsed
              })}
            >
              {content}
            </div>
            {this.state.collapsed ? (
              <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} />
            ) : (
                <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} />
              )
            }
            {currentUser.uid === authorId ? (
              <FaTrash onClick={_ => this.handleTrashClick(id)} />
            ) : (null)}
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
    else if (type === 'to-do') {
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
            })}
          >
            <div
              className={classNames({
                AnchorContainer: true,
                Truncated: this.state.collapsed
              })}
            >
              {anchor}
            </div>
            <div
              className={classNames({
                ContentContainer: true,
                Truncated: this.state.collapsed
              })}
            >
              {content}
            </div>
            {this.state.collapsed ? (
              <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} />
            ) : (
                <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} />
              )}
            {currentUser.uid === authorId ? (
              <FaTrash onClick={_ => this.handleTrashClick(id)} />
            ) : (null)}
            <React.Fragment>
              <button className="btn btn-sm"
                onClick={_ => this.handleDoneToDo()}>Done?</button>
            </React.Fragment>
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
}

export default Annotation;
