import React, { Component } from 'react';
import { AiFillPushpin, AiOutlinePushpin } from 'react-icons/ai';
import outlinepin from '../../../../../assets/img/SVGs/pin.svg';
import fillpin from '../../../../../assets/img/SVGs/pin_2.svg';
import './Annotation.css';
import { deleteAnnotationForeverById, updateAnnotationById, getUserProfileById } from '../../../../../firebase';
import DefaultAnnotation from './DefaultAnnotation';
import ToDoAnnotation from './ToDoAnnotation';
import HighlightAnnotation from './HighlightAnnnotation';
import IssueAnnotation from './IssueAnnotation';
import QuestionAnswerAnnotation from './QuestionAnswerAnnotation';


class Annotation extends Component {

  constructor(props) {
    super(props);
    this.handleEditClick = this.handleEditClick.bind(this);
    this.handleNewAnchor = this.handleNewAnchor.bind(this);
    this.handleTrashClick = this.handleTrashClick.bind(this);
  }

  state = {
    tags: this.props.tags,
    content: this.props.content,
    collapsed: false,
    annotationType: this.props.type,
    editing: false,
    id: this.props.id,
    authorId: this.props.authorId,
    pinned: this.props.pinned,
    isClosed: this.props.isClosed,
    howClosed: this.props.howClosed
  };

  updateData = () => {
    let { tags, content, type, authorId, pinned, isClosed, howClosed } = this.props;
    this.setState({
      tags, content, annotationType: type, authorId, pinned, isClosed, howClosed
    });

  }

  // probably switch to just storing text version of username in the annotation table so we cut down
  // on this read
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
      prevProps.authorId !== this.props.authorId ||
      prevProps.pinned !== this.props.pinned ||
      prevProps.isClosed !== this.props.isClosed ||
      prevProps.howClosed !== this.props.howClosed) {
      this.updateData();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydown, false);
  }

  formatTimestamp = () => {
    let date = new Date(this.props.timeStamp);
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

  handleDoneToDo(id) {
    updateAnnotationById(id, {
      createdTimestamp: new Date().getTime(),
      trashed: true
    }
    );
  }

  handleExpertReview = () => {
    // could imagine having user's who are deemed "experts" in certain APIs or are documentation writers
    // sort of like how Google had code reviewers with "readability" in certain languages and could provide
    // expert opinion - this would require us to know a bit more about the current API we're looking at (may be able to ascertain
    // from URL + anchor content)
    console.log('handled');
  }

  handleUnArchive(e) {
    let id = e.target.value;
    updateAnnotationById(id, {
      createdTimestamp: new Date().getTime(),
      trashed: false
    }
    );
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
        chrome.runtime.sendMessage({
          msg: "ANNOTATION_DELETED",
          from: "content",
          payload: {
            id: id
          }
        })
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
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_UPDATED',
      from: 'content',
      payload: {
        id: CardWrapperState.id,
        type: CardWrapperState.annotationType.toLowerCase(),
        content: CardWrapperState.annotationContent,
        tags: CardWrapperState.tags,
        isPrivate: CardWrapperState.private
      }
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

  handleNewAnchor = (id) => {
    alert('Select the text you want to anchor this annotation to!')
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {
        msg: 'ADD_NEW_ANCHOR',
        payload: {
          content: this.state.content,
          type: this.state.annotationType,
          sharedId: id,
          author: this.props.currentUser.uid,
          tags: this.state.tags
        }
      });
    });

  }

  transmitPinToParent = () => {
    this.handlePin().then(pinState => { this.props.notifyParentOfPinning(this.props.id, pinState) });
  }

  handlePin = () => {
    return new Promise((resolve, reject) => {
      const { pinned } = this.state;
      this.setState({ pinned: !pinned });
      resolve(!pinned);
    });
  }

  notifyParentOfAdopted = (annoId, replyId, adoptedState) => {
    chrome.runtime.sendMessage({
      msg: 'REQUEST_ADOPTED_UPDATE',
      from: 'content',
      payload: {
        annoId, replyId, adoptedState
      }
    })
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
    const { anchor, idx, id, active, authorId, currentUser, trashed, timeStamp, url, currentUrl, childAnchor, xpath, replies, isPrivate, adopted } = this.props;
    const { editing, collapsed, tags, content, annotationType, author, pinned, isClosed, howClosed } = this.state;
    if (annotationType === 'default' && !trashed) {
      return (<DefaultAnnotation
        idx={idx}
        id={id}
        collapsed={collapsed}
        author={author}
        formatTimestamp={this.formatTimestamp}
        pin={pinned}
        transmitPinToParent={this.transmitPinToParent}
        currentUser={currentUser}
        authorId={authorId}
        handleNewAnchor={this.handleNewAnchor}
        handleEditClick={this.handleEditClick}
        handleTrashClick={this.handleTrashClick}
        childAnchor={childAnchor}
        currentUrl={currentUrl}
        url={url}
        anchor={anchor}
        xpath={xpath}
        tags={tags}
        annotationType={annotationType}
        annotationContent={content}
        editing={editing}
        cancelButtonHandler={this.cancelButtonHandler}
        submitButtonHandler={this.submitButtonHandler}
        handleExpandCollapse={this.handleExpandCollapse}
        isPrivate={isPrivate}
        replies={replies}
      />);
    }
    else if (annotationType === 'to-do' && !trashed && currentUser.uid === authorId) {
      return (<ToDoAnnotation
        idx={idx}
        id={id}
        collapsed={collapsed}
        author={author}
        formatTimestamp={this.formatTimestamp}
        pin={pinned}
        transmitPinToParent={this.transmitPinToParent}
        currentUser={currentUser}
        authorId={authorId}
        handleNewAnchor={this.handleNewAnchor}
        handleEditClick={this.handleEditClick}
        handleTrashClick={this.handleTrashClick}
        childAnchor={childAnchor}
        currentUrl={currentUrl}
        url={url}
        anchor={anchor}
        xpath={xpath}
        tags={tags}
        annotationType={annotationType}
        annotationContent={content}
        editing={editing}
        handleDoneToDo={this.handleDoneToDo}
        cancelButtonHandler={this.cancelButtonHandler}
        submitButtonHandler={this.submitButtonHandler}
        handleExpandCollapse={this.handleExpandCollapse}
        replies={replies}
        isPrivate={isPrivate}
      />);
    }
    else if (annotationType === 'navigation') {
      return (null);
    }
    else if (annotationType === 'highlight') {
      return (
        <HighlightAnnotation
          idx={idx}
          id={id}
          collapsed={collapsed}
          author={author}
          formatTimestamp={this.formatTimestamp}
          pin={pinned}
          transmitPinToParent={this.transmitPinToParent}
          currentUser={currentUser}
          authorId={authorId}
          handleNewAnchor={this.handleNewAnchor}
          handleEditClick={this.handleEditClick}
          handleTrashClick={this.handleTrashClick}
          childAnchor={childAnchor}
          currentUrl={currentUrl}
          url={url}
          anchor={anchor}
          xpath={xpath}
          tags={tags}
          annotationType={annotationType}
          annotationContent={content}
          editing={editing}
          cancelButtonHandler={this.cancelButtonHandler}
          submitButtonHandler={this.submitButtonHandler}
          handleExpandCollapse={this.handleExpandCollapse}
          replies={replies}
          isPrivate={isPrivate}
        />
      );
    }
    else if (annotationType === 'question') {
      return (
        <QuestionAnswerAnnotation
          idx={idx}
          id={id}
          collapsed={collapsed}
          author={author}
          formatTimestamp={this.formatTimestamp}
          pin={pinned}
          transmitPinToParent={this.transmitPinToParent}
          currentUser={currentUser}
          authorId={authorId}
          handleNewAnchor={this.handleNewAnchor}
          handleEditClick={this.handleEditClick}
          handleTrashClick={this.handleTrashClick}
          childAnchor={childAnchor}
          currentUrl={currentUrl}
          url={url}
          anchor={anchor}
          xpath={xpath}
          tags={tags}
          annotationType={annotationType}
          annotationContent={content}
          editing={editing}
          replies={replies}
          cancelButtonHandler={this.cancelButtonHandler}
          submitButtonHandler={this.submitButtonHandler}
          handleExpandCollapse={this.handleExpandCollapse}
          isPrivate={isPrivate}
          isClosed={isClosed}
          howClosed={howClosed}
          adopted={adopted}
          notifyParentOfAdopted={this.notifyParentOfAdopted}
        />
      );
    }
    else if (annotationType === 'issue') {
      return (
        <IssueAnnotation
          idx={idx}
          id={id}
          collapsed={collapsed}
          author={author}
          formatTimestamp={this.formatTimestamp}
          pin={pinned}
          transmitPinToParent={this.transmitPinToParent}
          currentUser={currentUser}
          authorId={authorId}
          handleNewAnchor={this.handleNewAnchor}
          handleEditClick={this.handleEditClick}
          handleTrashClick={this.handleTrashClick}
          childAnchor={childAnchor}
          currentUrl={currentUrl}
          url={url}
          anchor={anchor}
          xpath={xpath}
          tags={tags}
          annotationType={annotationType}
          annotationContent={content}
          editing={editing}
          handleExpertReview={this.handleExpertReview}
          cancelButtonHandler={this.cancelButtonHandler}
          submitButtonHandler={this.submitButtonHandler}
          handleExpandCollapse={this.handleExpandCollapse}
          replies={replies}
          isPrivate={isPrivate}
        />
      );
    }
    else {
      return (
        <React.Fragment>
          {authorId === currentUser.uid ? (
            <div className="whoops">
              This annotation is archived &nbsp; &nbsp;
              <button value={id} className="Unarchive" onClick={this.handleUnArchive}>
                Un-archive?
            </button>
            </div>
          ) : (null)
          }
        </React.Fragment>
      );
    }
  }
}

export default Annotation;
