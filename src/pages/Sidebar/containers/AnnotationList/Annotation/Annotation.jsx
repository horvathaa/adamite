import React, { Component } from 'react';
import classNames from 'classnames';
import { FaCaretDown, FaCaretUp, FaTrash, FaEdit } from 'react-icons/fa';
import './Annotation.css';
import { checkPropTypes, string } from 'prop-types';
import { deleteAnnotationForeverById, updateAnnotationById } from '../../../../../firebase';

class Annotation extends Component {
  state = {
    collapsed: false,
    editing: false,
    editedAnnotationContent: null,
  }

  formatTimestamp = (timeStamp) => {
    let date = new Date(timeStamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = date.getFullYear();
    var month = months[date.getMonth()];
    var day = date.getDate();
    var hour = date.getHours();
    var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var sec = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    var time = day + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
  }

  handleDoneToDo() {
    console.log('handled');
    return;
  }

  handleTrashClick(id) {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure? This action cannot be reversed")) {
      deleteAnnotationForeverById(id);
    } else {
      return;
    }
  }

  annotationChangeHandler = event => {
    this.setState({ editedAnnotationContent: event.target.value });
  };

  submitButtonHandler = (event, id) => {
    updateAnnotationById(id, { content: this.state.editedAnnotationContent });
    this.setState({ editing: false });
  }

  handleEditClick(id) {
    this.setState({ editing: true })
  }

  handleEditCancel() {
    this.setState({ editing: false });
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
    const { anchor, content, idx, id, active, type, authorId, currentUser, trashed, timeStamp } = this.props;
    if (type === 'default' && !trashed) {
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
            {!this.state.collapsed ? (
              <div className={classNames({
                Header: true,
                Truncated: this.state.collapsed,
              })}>
                {this.formatTimestamp(timeStamp)}
              </div>
            ) : (null)}
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
                Truncated: this.state.collapsed,
              })}
            >
              {this.state.editing ? (
                <React.Fragment>
                  <div className="TextareaContainer">
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder={content}
                      //value={content} -to-do make this work better
                      onChange={e => this.annotationChangeHandler(e)}
                    />
                  </div>
                  <div className="SubmitButtonContainer">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={_ => this.handleEditCancel()}
                    >
                      Cancel
                      </button>
                      &nbsp; &nbsp;
                    <button
                      className="btn btn-sm btn-outline-secondary SubmitButton"
                      onClick={e => this.submitButtonHandler(e, id)}
                      disabled={content.length === 0}
                    >
                      Save
                    </button>
                  </div>
                </React.Fragment>
              ) : (<div>
                {content}
              </div>
                )}
            </div>
            <div className="IconRow">
              {currentUser.uid === authorId ? (
                <React.Fragment>
                  <div className="IconContainer">
                    <FaTrash className="Icon" id="Trash" onClick={_ => this.handleTrashClick(id)} />
                  </div>
                  <div className="IconContainer">
                    <FaEdit className="Icon" id="Edit" onClick={_ => this.handleEditClick(id)} />
                  </div>
                </React.Fragment>
              ) : (null)}
              {this.state.collapsed ? (
                <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} />
              ) : (
                  <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} />
                )
              }
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
          <div
            className={classNames({
              AnnotationContainerPad: true,
              AnnotationPadActive: true,
            })}
          ></div>
        </li>
      );
    }
    else if (type === 'to-do' && !trashed) {
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
              {this.state.editing ? (
                <React.Fragment>
                  <div className="TextareaContainer">
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder={content}
                      //value={content} -to-do make this work better
                      onChange={e => this.annotationChangeHandler(e)}
                    />
                  </div>
                  <div className="SubmitButtonContainer">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={_ => this.handleEditCancel()}
                    >
                      Cancel
                      </button>
                      &nbsp; &nbsp;
                    <button
                      className="btn btn-sm btn-outline-secondary SubmitButton"
                      onClick={e => this.submitButtonHandler(e, id)}
                      disabled={content.length === 0}
                    >
                      Save
                    </button>
                  </div>
                </React.Fragment>
              ) : (<div>
                {content}
              </div>
                )}
            </div>
            {this.state.collapsed ? (
              <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} />
            ) : (
                <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} />
              )}
            {currentUser.uid === authorId ? (
              <React.Fragment>
                <div className="IconContainer">
                  <FaTrash className="Icon" id="Trash" onClick={_ => this.handleTrashClick(id)} />
                </div>
                <div className="IconContainer">
                  <FaEdit className="Icon" id="Edit" onClick={_ => this.handleEditClick(id)} />
                </div>
                <button className="btn btn-sm"
                  onClick={_ => this.handleDoneToDo()}>Done?</button>
              </React.Fragment>)
              : (null)}
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
