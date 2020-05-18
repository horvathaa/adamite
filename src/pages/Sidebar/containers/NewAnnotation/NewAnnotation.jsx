import React from 'react';
import { Dropdown } from 'react-bootstrap';
import './NewAnnotation.css';
import ReactDOM from 'react-dom';
import { Editor, EditorState } from 'draft-js';
import RichEditorExample from '../RichTextEditor/RichTextEditor'
function MyEditor() {
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty(),
  );
  return <Editor editorState={editorState} onChange={setEditorState} />;
}




class NewAnnotation extends React.Component {

  // constructor(props) {
  //   super(props);
  //   this.state = { editorState: EditorState.createEmpty() };
  //   this.onChange = editorState => this.setState({ editorState });
  // }



  state = {
    submitted: false,
    annotationContent: '',
    annotationType: "default",
  };

  componentDidMount() {
    document.addEventListener('keydown', this.keydown, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.keydown, false);
  }

  keydown = event => {
    if (event.key === 'Enter') {
      this.submitButtonHandler();
    }
  };

  updateAnnotationType(eventKey) {
    this.setState({ annotationType: eventKey });
  }

  annotationChangeHandler = event => {
    this.setState({ annotationContent: event.target.value });
  };

  submitButtonHandler = event => {
    this.setState({ submitted: true });

    const { url, newSelection, xpath, offsets } = this.props;
    const annotationInfo = {
      anchor: newSelection,
      annotation: this.state.annotationContent,
      xpath: xpath,
      offsets: offsets,
      id: newSelection + this.state.annotationContent + Math.floor(Math.random() * 1000),
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

    const { annotationContent, submitted } = this.state;

    return (

      <div className="NewAnnotationContainer">
        <div className="InnerNewAnnotation">
          <div className="SelectedTextContainer">{newSelection}</div>
          <div className="TextareaContainer">

            <RichEditorExample />
            {/* <textarea
            className="form-control"
            rows="2"
            placeholder={'Put your annotations here'}
            value={annotationContent}
            onChange={e => this.annotationChangeHandler(e)}
          /> */}

          </div>
          <div className="SubmitButtonContainer">
            {!submitted ? (
              <React.Fragment>
                <Dropdown className="AnnotationType">
                  <Dropdown.Toggle className="AnnoatationButton dropdown-toggle" id="dropdown-basic">
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

              </React.Fragment>
            ) : (
                <div className="spinner-border text-secondary" role="status">
                  <span className="sr-only">...</span>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }
}

export default NewAnnotation;
