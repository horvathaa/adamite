import React, { Component } from 'react';
import classNames from 'classnames';
import { FaCaretDown, FaCaretUp, FaTrash, FaEdit, FaFont, FaExternalLinkAlt, FaHamburger } from 'react-icons/fa';
import { GoThreeBars } from 'react-icons/go';
import './Annotation.css';
import { Dropdown } from 'react-bootstrap';
import { checkPropTypes, string } from 'prop-types';
import CustomTag from '../../CustomTag/CustomTag';
import profile from '../../../../../assets/img/SVGs/Profile.svg';
import expand from '../../../../../assets/img/SVGs/expand.svg'
import { deleteAnnotationForeverById, updateAnnotationById, getUserProfileById } from '../../../../../firebase';
import CardWrapper from '../../CardWrapper/CardWrapper'

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
    // var sec = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    var time = hour + ':' + min + ' ' + day + ' ' + month + ' ' + year;
    return time;
  }

  handleExternalAnchor(url) {
    chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: url });
  }

  handleDoneToDo() {
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

  submitButtonHandler = (CardWrapperState, id) => {
    updateAnnotationById(CardWrapperState.id, {
      content: CardWrapperState.annotationContent,
      type: CardWrapperState.annotationType.toLowerCase(),
      tags: CardWrapperState.tags
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

  cancelButtonHandler = () => {
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
                <div className="profileContainer">
                  <img src={profile} alt="profile" className="profile" />
                  {/* <Profile className="profile" /> */}
                </div>
                <div className="userProfileContainer">

                  <div className="author">
                    {author}
                  </div>
                  <div className="timestamp">
                    {this.formatTimestamp(timeStamp)}
                  </div>
                </div>
                <div className="row">
                  {/* <div className="col">

                  </div> */}
                  <div className="col2">

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

            <React.Fragment>
              <CardWrapper tags={tags}
                annotationType={annotationType}
                annotationContent={content}
                edit={editing}
                pageAnnotation={anchor} id={id}
                cancelButtonHandler={this.cancelButtonHandler}
                submitButtonHandler={this.submitButtonHandler}
                elseContent={content}
                collapsed={collapsed} />
            </React.Fragment>

            {tags.length && !collapsed && !editing ? (
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
                <img src={expand} alt="Expand" onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
                {/* <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" /> */}
              </div>
            ) : (
                <React.Fragment>
                  <div className="ExpandCollapse">
                    {/* <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" /> */}
                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
            {!this.state.collapsed ? (
              <div className={" container " + classNames({
                Header: true,
                Truncated: collapsed,
              })}>
                <div className="profileContainer">
                  <img src={profile} alt="profile" className="profile" />
                  {/* <Profile className="profile" /> */}
                </div>
                <div className="userProfileContainer">

                  <div className="author">
                    {author}
                  </div>
                  <div className="timestamp">
                    {this.formatTimestamp(timeStamp)}
                  </div>
                </div>
                <div className="row">
                  {/* <div className="col">

                </div> */}
                  <div className="col2">

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

            <React.Fragment>
              <CardWrapper tags={tags}
                annotationType={annotationType}
                annotationContent={content}
                edit={editing}
                pageAnnotation={anchor} id={id}
                cancelButtonHandler={this.cancelButtonHandler}
                submitButtonHandler={this.submitButtonHandler}
                elseContent={content}
                collapsed={collapsed} />
            </React.Fragment>

            {tags.length && !collapsed && !editing ? (
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
            {currentUser.uid === authorId && !editing && (
              <button className="ToDo-Button"
                onClick={_ => this.handleDoneToDo()}>Done?</button>
            )}
            {collapsed ? (
              <div className="ExpandCollapse">
                <img src={expand} alt="Expand" onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
                {/* <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" /> */}
              </div>
            ) : (
                <React.Fragment>
                  <div className="ExpandCollapse">
                    {/* <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" /> */}
                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
              <div className={" container " + classNames({
                Header: true,
                Truncated: collapsed,
              })}>
                <div className="profileContainer">
                  <img src={profile} alt="profile" className="profile" />
                  {/* <Profile className="profile" /> */}
                </div>
                <div className="userProfileContainer">

                  <div className="author">
                    {author}
                  </div>
                  <div className="timestamp">
                    {this.formatTimestamp(timeStamp)}
                  </div>
                </div>
                <div className="row">
                  {/* <div className="col">

                  </div> */}
                  <div className="col2">

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

            <React.Fragment>
              <CardWrapper tags={tags}
                annotationType={annotationType}
                annotationContent={content}
                edit={editing}
                pageAnnotation={anchor} id={id}
                cancelButtonHandler={this.cancelButtonHandler}
                submitButtonHandler={this.submitButtonHandler}
                elseContent={content}
                collapsed={collapsed} />
            </React.Fragment>

            {tags.length && !collapsed && !editing ? (
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
                <img src={expand} alt="Expand" onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
                {/* <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" /> */}
              </div>
            ) : (
                <React.Fragment>
                  <div className="ExpandCollapse">
                    {/* <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" /> */}
                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
              <div className={" container " + classNames({
                Header: true,
                Truncated: collapsed,
              })}>
                <div className="profileContainer">
                  <img src={profile} alt="profile" className="profile" />
                  {/* <Profile className="profile" /> */}
                </div>
                <div className="userProfileContainer">

                  <div className="author">
                    {author}
                  </div>
                  <div className="timestamp">
                    {this.formatTimestamp(timeStamp)}
                  </div>
                </div>
                <div className="row">
                  {/* <div className="col">

                </div> */}
                  <div className="col2">

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

            <React.Fragment>
              <CardWrapper tags={tags}
                annotationType={annotationType}
                annotationContent={content}
                edit={editing}
                pageAnnotation={anchor} id={id}
                cancelButtonHandler={this.cancelButtonHandler}
                submitButtonHandler={this.submitButtonHandler}
                elseContent={content}
                collapsed={collapsed} />
            </React.Fragment>

            {tags.length && !collapsed && !editing ? (
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
                <img src={expand} alt="Expand" onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
                {/* <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" /> */}
              </div>
            ) : (
                <React.Fragment>
                  <div className="ExpandCollapse">
                    {/* <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" /> */}
                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
              <div className={" container " + classNames({
                Header: true,
                Truncated: collapsed,
              })}>
                <div className="profileContainer">
                  <img src={profile} alt="profile" className="profile" />
                  {/* <Profile className="profile" /> */}
                </div>
                <div className="userProfileContainer">

                  <div className="author">
                    {author}
                  </div>
                  <div className="timestamp">
                    {this.formatTimestamp(timeStamp)}
                  </div>
                </div>
                <div className="row">
                  {/* <div className="col">

                  </div> */}
                  <div className="col2">

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

            <React.Fragment>
              <CardWrapper tags={tags}
                annotationType={annotationType}
                annotationContent={content}
                edit={editing}
                pageAnnotation={anchor} id={id}
                cancelButtonHandler={this.cancelButtonHandler}
                submitButtonHandler={this.submitButtonHandler}
                elseContent={content}
                collapsed={collapsed} />
            </React.Fragment>

            {tags.length && !collapsed && !editing ? (
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
                <img src={expand} alt="Expand" onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
                {/* <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" /> */}
              </div>
            ) : (
                <React.Fragment>
                  <div className="ExpandCollapse">
                    {/* <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" /> */}
                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
              <div className={" container " + classNames({
                Header: true,
                Truncated: collapsed,
              })}>
                <div className="profileContainer">
                  <img src={profile} alt="profile" className="profile" />
                  {/* <Profile className="profile" /> */}
                </div>
                <div className="userProfileContainer">

                  <div className="author">
                    {author}
                  </div>
                  <div className="timestamp">
                    {this.formatTimestamp(timeStamp)}
                  </div>
                </div>
                <div className="row">
                  {/* <div className="col">

                </div> */}
                  <div className="col2">

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

            <React.Fragment>
              <CardWrapper tags={tags}
                annotationType={annotationType}
                annotationContent={content}
                edit={editing}
                pageAnnotation={anchor} id={id}
                cancelButtonHandler={this.cancelButtonHandler}
                submitButtonHandler={this.submitButtonHandler}
                elseContent={content}
                collapsed={collapsed} />
            </React.Fragment>

            {tags.length && !collapsed && !editing ? (
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
                <img src={expand} alt="Expand" onClick={_ => this.handleExpandCollapse('expand')} className="Icon" />
                {/* <FaCaretDown onClick={_ => this.handleExpandCollapse('expand')} className="Icon" /> */}
              </div>
            ) : (
                <React.Fragment>
                  <div className="ExpandCollapse">
                    {/* <FaCaretUp onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" /> */}
                    <img src={expand} id="collapse" alt="Collapse" onClick={_ => this.handleExpandCollapse('collapse')} className="Icon" />
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
  }
}

export default Annotation;
