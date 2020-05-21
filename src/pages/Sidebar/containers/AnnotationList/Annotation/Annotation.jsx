import React, { Component } from 'react';
import classNames from 'classnames';
import { FaCaretDown, FaCaretUp, FaTrash, FaEdit, FaFont, FaExternalLinkAlt, FaHamburger } from 'react-icons/fa';
import { GoThreeBars } from 'react-icons/go';
import './Annotation.css';
import { Dropdown } from 'react-bootstrap';
import { checkPropTypes, string } from 'prop-types';
import CustomTag from '../../CustomTag/CustomTag';
import { deleteAnnotationForeverById, updateAnnotationById, getUserProfileById } from '../../../../../firebase';

const HamburgerToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}><GoThreeBars className="Icon" />
    {children}
  </a>
));

class Annotation extends Component {

  state = {
    tags: this.props.tags,
    content: this.props.content,
    collapsed: false,
    annotationType: this.props.type,
    editing: false,
    authorId: this.props.authorId
  };

  updateData = () => {
    let { tags, content, type, authorId } = this.props;
    this.setState({
      tags, content, annotationType: type, authorId
    });

  }

  async componentDidMount() {
    document.addEventListener('keydown', this.keydown, false);
    this.updateData();
    let authorDoc = getUserProfileById(this.state.authorId);
    let user = "";
    await authorDoc.get().then(function (doc) {
      if (doc.exists) {
        user = doc.data().email.substring(0, doc.data().email.indexOf('@'));
      }
      else {
        user = "anonymous";
      }
    }).catch(function (error) {
      console.log('could not get doc:', error);
    });

    this.setState({ author: user });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tags !== this.props.tags ||
      prevProps.content !== this.props.content ||
      prevProps.type !== this.props.type ||
      prevProps.authorId !== this.props.authorId) {
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

  handleExternalAnchor(url) {
    chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: url });
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
    const { anchor, idx, id, active, authorId, currentUser, trashed, timeStamp, url, currentUrl } = this.props;
    const { editing, collapsed, tags, content, annotationType, author } = this.state;
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
              <div className={" container " + classNames({
                Header: true,
                Truncated: collapsed,
              })}>
                <div className="row">
                  <div className="col">
                    {this.formatTimestamp(timeStamp)}
                  </div>
                  <div className="col2">
                    {author}
                    &nbsp;&nbsp;
                    {currentUser.uid === authorId && !collapsed ? (
                      <Dropdown className="HamburgerMenu">
                        <Dropdown.Toggle as={HamburgerToggle}></Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item as="button" eventKey={id} onSelect={eventKey => this.handleEditClick(id)}>
                            Edit
                        </Dropdown.Item>
                          <Dropdown.Item as="button" eventKey={id} onSelect={eventKey => this.handleTrashClick(id)}>
                            Delete
                        </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    ) : (null)}
                  </div>
                </div>
              </div>
            ) : (null)}
            <div
              className={classNames({
                AnchorContainer: true,
                Truncated: collapsed
              })}
            >
              <div className="AnchorIconContainer">
                {currentUrl === url ? (
                  <FaFont className="AnchorIcon" />
                ) : (<FaExternalLinkAlt className="AnchorIcon" onClick={_ => this.handleExternalAnchor(url)} />)}
              </div>
              <div className="AnchorTextContainer">
                {anchor}
              </div>
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
            {collapsed ? (
              <div className="ExpandCollapse">
                <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
              </div>
            ) : (
                <React.Fragment>
                  <div className="ExpandCollapse">
                    <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
                  </div>

                </React.Fragment>
              )
            }
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
              <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
            ) : (
                <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
                <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
              ) : (
                  <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
                <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
              ) : (
                  <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
                <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
              ) : (
                  <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
                <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
              ) : (
                  <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
