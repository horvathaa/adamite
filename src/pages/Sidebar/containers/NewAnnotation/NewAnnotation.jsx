import React from 'react';
import './NewAnnotation.css';

class NewAnnotation extends React.Component {
  state = {
    submitted: false,
    annotationContent: '',
  };

  annotationChangeHandler = (event) => {
    this.setState({ annotationContent: event.target.value });
  };

  submitButtonHandler = (event) => {
    this.setState({ submitted: true });

    const { url, newSelection } = this.props;
    const annotationPair = JSON.stringify({
      [newSelection]: this.state.annotationContent,
    });
    chrome.runtime.sendMessage(
      {
        msg: 'SAVE_ANNOTATED_TEXT',
        payload: {
          content: annotationPair,
          url,
        },
      },
      (response) => {
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
        <div className="SelectedTextContainer">"{newSelection}"</div>
        <div className="TextareaContainer">
          <textarea
            className="form-control"
            rows="2"
            placeholder={'Put your annotations here'}
            value={annotationContent}
            onChange={(e) => this.annotationChangeHandler(e)}
          />
        </div>
        <div className="SubmitButtonContainer">
          {!submitted ? (
            <button
              className="btn btn-sm btn-outline-secondary SubmitButton"
              onClick={(e) => this.submitButtonHandler(e)}
              disabled={annotationContent.length === 0}
            >
              Save
            </button>
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
