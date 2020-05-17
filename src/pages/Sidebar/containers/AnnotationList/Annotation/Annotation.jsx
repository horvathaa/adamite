import React, { Component } from 'react';
import classNames from 'classnames';
import { FaCaretDown, FaCaretUp, FaTrash, FaEdit } from 'react-icons/fa';
import './Annotation.css';
import { Dropdown } from 'react-bootstrap';
import { checkPropTypes, string } from 'prop-types';
import { deleteAnnotationForeverById, updateAnnotationById } from '../../../../../firebase';

class Annotation extends Component {
  state = {
    collapsed: false,
    editing: false,
    editedAnnotationContent: null,
    newAnnotationType: null,
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
    updateAnnotationById(id, { content: this.state.editedAnnotationContent, annotationType: this.state.newAnnotationType });
    this.setState({ editing: false });
  }

  updateAnnotationType(eventKey) {
    this.setState({ newAnnotationType: eventKey });
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
                editAreaContainer: this.state.editing,
              })}
            >
              {this.state.editing ? (
                <React.Fragment>
                  <div className="editAreaContainer">
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
                      <Dropdown >
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                          Annotation Type
                      </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item as="button" eventKey="default" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Default
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="to-do" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            To-do
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="question" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Question/Answer
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="highlight" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Highlight
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="navigation" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Navigation
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="issue" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Issue
                        </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    &nbsp; &nbsp;
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
    else if (type === 'navigation') {
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
                editAreaContainer: this.state.editing,
              })}
            >
              {this.state.editing ? (
                <React.Fragment>
                  <div className="editAreaContainer">
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
                      <Dropdown >
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                          Annotation Type
                      </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item as="button" eventKey="default" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Default
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="to-do" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            To-do
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="question" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Question/Answer
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="highlight" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Highlight
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="navigation" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Navigation
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="issue" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Issue
                        </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    &nbsp; &nbsp;
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
    else if (type === 'highlight') {
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
                editAreaContainer: this.state.editing,
              })}
            >
              {this.state.editing ? (
                <React.Fragment>
                  <div className="editAreaContainer">
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
                      <Dropdown >
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                          Annotation Type
                      </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item as="button" eventKey="default" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Default
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="to-do" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            To-do
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="question" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Question/Answer
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="highlight" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Highlight
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="navigation" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Navigation
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="issue" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Issue
                        </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    &nbsp; &nbsp;
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
    else if (type === 'question') {
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
                editAreaContainer: this.state.editing,
              })}
            >
              {this.state.editing ? (
                <React.Fragment>
                  <div className="editAreaContainer">
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
                      <Dropdown >
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                          Annotation Type
                      </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item as="button" eventKey="default" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Default
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="to-do" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            To-do
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="question" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Question/Answer
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="highlight" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Highlight
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="navigation" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Navigation
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="issue" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Issue
                        </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    &nbsp; &nbsp;
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
    else if (type === 'issue') {
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
                editAreaContainer: this.state.editing,
              })}
            >
              {this.state.editing ? (
                <React.Fragment>
                  <div className="editAreaContainer">
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
                      <Dropdown >
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                          Annotation Type
                      </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item as="button" eventKey="default" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Default
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="to-do" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            To-do
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="question" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Question/Answer
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="highlight" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Highlight
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="navigation" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Navigation
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey="issue" onSelect={eventKey => this.updateAnnotationType(eventKey)}>
                            Issue
                        </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    &nbsp; &nbsp;
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

  }
}

export default Annotation;
