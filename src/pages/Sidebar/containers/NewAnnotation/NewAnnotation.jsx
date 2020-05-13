import React from 'react';
import './NewAnnotation.css';

class NewAnnotation extends React.Component {
  state = {
    submitted: false,
    annotationContent: '',
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

  annotationChangeHandler = event => {
    this.setState({ annotationContent: event.target.value });
  };

  submitButtonHandler = event => {
    this.setState({ submitted: true });

    const { url, newSelection, rect, offset } = this.props;
    // todo - switch to xpath
    const divProps = {
      top: rect.top + offset,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
    let annotationType = this.state.annotationContent.includes("todo") || this.state.annotationContent.includes("to-do") ? "to-do" : "default";
    const annotationInfo = JSON.stringify({
      anchor: newSelection,
      annotation: this.state.annotationContent,
      div: divProps,
      id: newSelection + this.state.annotationContent + Math.floor(Math.random() * 1000),
      annotationType: annotationType,
    });

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
        <div className="SelectedTextContainer">{newSelection}</div>
        <div className="TextareaContainer">
          <textarea
            className="form-control"
            rows="2"
            placeholder={'Put your annotations here'}
            value={annotationContent}
            onChange={e => this.annotationChangeHandler(e)}
          />
        </div>
        <div className="SubmitButtonContainer">
          {!submitted ? (
            <React.Fragment>
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
    );
  }
}

export default NewAnnotation;
