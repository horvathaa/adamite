import React, { Component } from 'react';
import classNames from 'classnames';
import { FaCaretDown, FaCaretUp, FaTrash, FaEdit } from 'react-icons/fa';
import './Annotation.css';
import { Dropdown } from 'react-bootstrap';
import { checkPropTypes, string } from 'prop-types';
import CustomTag from '../../CustomTag/CustomTag';
import { deleteAnnotationForeverById, updateAnnotationById } from '../../../../../firebase';

class Annotation extends Component {

  state = {
    tags: this.props.tags,
    content: this.props.content,
    collapsed: false,
    annotationType: this.props.type,
    editing: false
  };

  updateData = () => {
    let { tags, content, type } = this.props;

    this.setState({
      tags, content, annotationType: type
    })
  }

  componentDidMount() {
    document.addEventListener('keydown', this.keydown, false);
    this.updateData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tags !== this.props.tags || prevProps.content !== this.props.content || prevProps.type !== this.props.type) {
      this.updateData();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydown, false);
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
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        let url = tabs[0].url;
        if (this.props.url === url) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              msg: 'ANNOTATION_DELETED_ON_PAGE',
              id: id,
            }
          );
        }
        deleteAnnotationForeverById(id);
      });

    } else {
      return;
    }
  }

  keydown = e => {
    if (e.key === 'Enter' && e.target.className === 'tag-control-editAnnotation' && e.target.value !== '') {
      e.preventDefault();
      this.state.tags.push(e.target.value);
    }
  }

  annotationTagHandler = event => {

  }

  annotationChangeHandler = event => {
    this.setState({ content: event.target.value });
  };

  submitButtonHandler = (event, id) => {
    updateAnnotationById(id, {
      content: this.state.content,
      annotationType: this.state.annotationType,
      tags: this.state.tags
    });
    this.setState({ editing: false });
  }

  updateAnnotationType(eventKey) {
    this.setState({ annotationType: eventKey });
  }

  handleEditClick(id) {
    this.setState({ editing: true })
  }

  handleEditCancel() {
    this.setState({ editing: false });
  }

  deleteTag = (tagName) => {
    this.setState({ tags: this.state.tags.filter(tag => tag !== tagName) });
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
    const { anchor, idx, id, active, authorId, currentUser, trashed, timeStamp } = this.props;
    const { editing, collapsed, tags, content, annotationType } = this.state;
    if (annotationType === 'default' && !trashed) {
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
                Truncated: collapsed,
              })}>
                {this.formatTimestamp(timeStamp)}
              </div>
            ) : (null)}
            <div
              className={classNames({
                AnchorContainer: true,
                Truncated: collapsed
              })}
            >
              {anchor}
            </div>
            <div
              className={classNames({
                ContentContainer: true,
                Truncated: collapsed,
                editAreaContainer: editing,
              })}
            >
              {editing ? (
                <React.Fragment>
                  <div className="editAreaContainer">
                    <div className="TextareaContainer">
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder={content}
                        value={content} //-to-do make this work better
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
            {editing ? (
              <div className="editTag">
                Add Tag:
                <textarea
                  className="tag-control-editAnnotation"
                  rows="1"
                  placeholder={'add tag here'}
                  // value={annotationContent}
                  onChange={e => this.annotationTagHandler(e)}
                />
              </div>) : (null)}
            {tags.length && !collapsed ? (
              <div className={classNames({
                TagRow: true
              })}>
                <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                  {tags.map((tagContent, idx) => {
                    return (
                      <CustomTag idx={idx} content={tagContent} deleteTag={this.deleteTag} editing={editing} />
                    )
                  }
                  )}
                </ul>

              </div>
            ) : (null)}
            <div className="IconRow">
              {currentUser.uid === authorId && !collapsed ? (
                <React.Fragment>
                  <div className="IconContainer">
                    <FaTrash className="Icon" id="Trash" onClick={_ => this.handleTrashClick(id)} />
                  </div>
                  <div className="IconContainer">
                    <FaEdit className="Icon" id="Edit" onClick={_ => this.handleEditClick(id)} />
                  </div>
                </React.Fragment>
              ) : (null)}
              {collapsed ? (
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
    else if (annotationType === 'to-do' && !trashed) {
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
                Truncated: collapsed
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
    else if (annotationType === 'navigation') {
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
    else if (annotationType === 'highlight') {
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
    else if (annotationType === 'question') {
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
    else if (annotationType === 'issue') {
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
