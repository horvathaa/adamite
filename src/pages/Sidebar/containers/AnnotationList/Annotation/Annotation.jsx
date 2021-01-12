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
import { RiTruckLine } from 'react-icons/ri';


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
    collapsed: true,
    annotationType: this.props.type,
    editing: false,
    id: this.props.id,
    authorId: this.props.authorId,
    pinned: this.props.pinned,
    brokenAnchor: false,
    brokenReply: [],
    brokenChild: [],
    isClosed: this.props.isClosed,
    howClosed: this.props.howClosed,
    userGroups: this.props.userGroups === undefined ? [] : this.props.userGroups,
    annoGroups: this.props.annoGroups === undefined ? [] : this.props.annoGroups,
    readCount: this.props.readCount === undefined ? 0 : this.props.readCount
  };

  updateData = () => {
    let { tags, content, type, authorId, pinned, isClosed, howClosed } = this.props;
    this.setState({
      tags, content, annotationType: type, authorId, pinned, isClosed, howClosed
    });
  }

  async componentDidMount() {
    document.addEventListener('keydown', this.keydown, false);
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.from === 'content' && request.msg === 'ANCHOR_BROKEN' && request.payload.id === this.props.id) {
        if (this.props.url.includes(this.props.currentUrl) &&
          request.payload.replyId !== undefined) {
          const broken = this.props.replies.filter(r => r.replyId === request.payload.replyId);
          let temp = this.state.brokenReply;
          temp.push(String(broken[0].replyId));
          this.setState({ brokenReply: temp });
        }
        else if (this.props.url.includes(this.props.currentUrl) &&
          request.payload.childId !== undefined) {
          const broken = this.props.childAnchor.filter(c => c.id === request.payload.childId);
          let temp = this.state.brokenChild;
          temp.push(broken[0].id);
          this.setState({ brokenChild: temp });
        }
        else if (this.props.url[0] === this.props.currentUrl) {
          if (sender.tab.url === this.props.currentUrl) {
            this.setState({ brokenAnchor: true });
          }
        }
      }
    })
    this.updateData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tags !== this.props.tags ||
      prevProps.content !== this.props.content ||
      prevProps.type !== this.props.type ||
      prevProps.authorId !== this.props.authorId ||
      prevProps.pinned !== this.props.pinned ||
      prevProps.isClosed !== this.props.isClosed ||
      prevProps.howClosed !== this.props.howClosed ||
      prevProps.author !== this.props.author) {
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
    var time = hour + ':' + min + ' ' + day + ' ' + month + ' ' + year;
    return time;
  }

  getGroupName = () => {
    let matches = [];
    if (this.props.userGroups !== undefined && this.props.annoGroups !== undefined) {
      matches = this.props.userGroups.filter(group => this.props.annoGroups.includes(group.gid));
    }
    if (matches.length > 0) {
      let formattedString = "";
      matches.forEach((group, i) => {
        if (i === (matches.length - 1)) {
          formattedString += group.name;
        }
        else {
          formattedString += group.name + ", ";
        }
      });
      return formattedString;
    }
    else {
      return this.props.isPrivate ? "Private" : "Public";
    }
  }

  handleDoneToDo(id) {
    chrome.runtime.sendMessage({
      msg: 'FINISH_TODO',
      from: 'content',
      payload: { id }
    });
    this.transmitPinToParent();
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
    chrome.runtime.sendMessage({
      msg: 'UNARCHIVE',
      from: 'content',
      payload: { id }
    });
    this.transmitPinToParent();
  }

  handleTrashClick(id) {
    // eslint-disable-next-line no-restricted-globals
    if (confirm("Are you sure? This action cannot be reversed")) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        let url = tabs[0].url;
        if (this.props.url[0] === url) {
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
    this.setState({ annoGroups: CardWrapperState.groups });
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_UPDATED',
      from: 'content',
      payload: {
        id: CardWrapperState.id,
        type: CardWrapperState.annotationType.toLowerCase(),
        content: CardWrapperState.annotationContent,
        tags: CardWrapperState.tags,
        isPrivate: CardWrapperState.private,
        groups: CardWrapperState.groups
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
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {
        msg: 'ADD_NEW_ANCHOR',
        payload: {
          content: this.state.content,
          type: this.state.annotationType,
          sharedId: id,
          author: this.props.currentUser.uid,
          tags: this.state.tags,
          groups: this.state.annoGroups
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
      // this.setState({ readCount: this.state.readCount + 1 })
      chrome.runtime.sendMessage({
        msg: 'UPDATE_READ_COUNT',
        from: 'content',
        payload: {
          id: this.props.id,
          readCount: this.state.readCount
        }
      })
    }
  }

  render() {
    const { anchor, idx, id, active, authorId, currentUser, trashed, timeStamp, url, currentUrl, childAnchor, xpath, replies, isPrivate, adopted } = this.props;
    const { editing, collapsed, tags, content, annotationType, pinned, isClosed, howClosed, userGroups, annoGroups, readCount, brokenAnchor, brokenReply, brokenChild } = this.state;
    const author = this.props.author === undefined ? "anonymous" : this.props.author;
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
        notifyParentOfAdopted={this.notifyParentOfAdopted}
        getGroupName={this.getGroupName}
        userGroups={userGroups}
        brokenAnchor={brokenAnchor}
        brokenReply={brokenReply}
        brokenChild={brokenChild}
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
        notifyParentOfAdopted={this.notifyParentOfAdopted}
        getGroupName={this.getGroupName}
        userGroups={userGroups}
        brokenAnchor={brokenAnchor}
        brokenReply={brokenReply}
        brokenChild={brokenChild}
      />);
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
          notifyParentOfAdopted={this.notifyParentOfAdopted}
          getGroupName={this.getGroupName}
          userGroups={userGroups}
          brokenAnchor={brokenAnchor}
          brokenReply={brokenReply}
          brokenChild={brokenChild}
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
          getGroupName={this.getGroupName}
          userGroups={userGroups}
          brokenAnchor={brokenAnchor}
          brokenReply={brokenReply}
          brokenChild={brokenChild}
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
          getGroupName={this.getGroupName}
          userGroups={userGroups}
          brokenAnchor={brokenAnchor}
          brokenReply={brokenReply}
          brokenChild={brokenChild}
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
