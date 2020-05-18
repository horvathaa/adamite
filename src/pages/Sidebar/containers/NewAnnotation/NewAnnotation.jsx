import React from 'react';
import { Dropdown } from 'react-bootstrap';
import './NewAnnotation.css';
import ReactDOM from 'react-dom';
import { Editor, EditorState } from 'draft-js';
import RichEditorExample from '../RichTextEditor/RichTextEditor'
import CustomTag from '../CustomTag/CustomTag';
function MyEditor() {
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty(),
  );
  return <Editor editorState={editorState} onChange={setEditorState} />;
}


class NewAnnotation extends React.Component {

  constructor(props) {
    super(props);
    this.annotationChangeHandler = this.annotationChangeHandler.bind(this)
  }

  saveAnnotationContent(w) {
    console.log(w)
    this.setState({
      annotationContent: w
    })
  }

  state = {
    submitted: false,
    addedTag: false,
    annotationContent: '',
    annotationType: "default",
    tags: [],
  };

  componentDidMount() {
    document.addEventListener('keydown', this.keydown, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydown, false);
  }

  keydown = e => {
    if (e.key === 'Enter' && e.target.className === 'form-control' && this.state.annotationContent !== '') {
      this.submitButtonHandler();
    }
    else if (e.key === 'Enter' && e.target.className === 'tag-control' && e.target.value !== '') {
      e.preventDefault();
      this.state.tags.push(e.target.value);
      this.setState({ addedTag: true });
      e.target.value = '';
      console.log(this.state.tags);
    }
  };

  updateAnnotationType(eventKey) {
    this.setState({ annotationType: eventKey });
  }

  annotationChangeHandler = (value) => {
    this.setState({ annotationContent: value });
  };

  annotationTagHandler = event => {

  }

  deleteTag = (tagName) => {
    this.setState({ tags: this.state.tags.filter(tag => tag !== tagName) });

  }

  submitButtonHandler = event => {
    this.setState({ submitted: true });

    const { url, newSelection, xpath, offsets } = this.props;
    console.log('saving tags');
    console.log(this.state.tags);
    const annotationInfo = {
      anchor: newSelection,
      annotation: this.state.annotationContent,
      xpath: xpath,
      offsets: offsets,
      tags: this.state.tags,
      annotationType: this.state.annotationType,
    };
    chrome.runtime.sendMessage(
      {
        msg: 'SAVE_ANNOTATED_TEXT',
        payload: {
          content: annotationInfo,
          url,
        },
      },
      response => {
        if (response.msg === 'DONE') {
          this.setState({ submitted: false });
          this.props.resetNewSelection();
        }
      }
    );
  };

  render() {
    const { newSelection } = this.props;

    if (!newSelection) {
      return null;
    }

    const { annotationContent, submitted, tags } = this.state;

    return (

      <div className="NewAnnotationContainer">
        <div className="InnerNewAnnotation">
          <div className="SelectedTextContainer">{newSelection}</div>
          <div className="TextareaContainer">

            <RichEditorExample annotationChangeHandler={this.annotationChangeHandler} />
          </div>
          {!submitted ? (
            <React.Fragment>
              <div className="TagContainer">
                {tags.length ? (
                  <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                    {tags.map((tagContent, idx) => {
                      return (
                        <CustomTag idx={idx} content={tagContent} deleteTag={this.deleteTag} editing={true} />
                      )
                    }
                    )}
                  </ul>
                ) : (null)}
                Add Tag:
              <textarea
                  className="tag-control"
                  rows="1"
                  placeholder={'add tag here'}
                  // value={annotationContent}
                  onChange={e => this.annotationTagHandler(e)}
                />
              </div>
              <div className="SubmitButtonContainer">
                <Dropdown className="AnnotationType">
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
                      Question
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
                  onClick={_ => this.props.resetNewSelection()}
                >
                  Cancel
              </button>
              &nbsp; &nbsp;
                <button
                  className="btn btn-sm btn-outline-secondary SubmitButton"
                  onClick={e => this.submitButtonHandler(e)}
                  disabled={annotationContent.length === 0}
                >
                  Save
              </button>
              </div>
            </React.Fragment>
          ) : (
              <div className="spinner-border text-secondary" role="status">
                <span className="sr-only">...</span>
              </div>
            )}
        </div>
      </div>
    );
  }
}

export default NewAnnotation;
