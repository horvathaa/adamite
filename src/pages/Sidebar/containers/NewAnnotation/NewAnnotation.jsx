import React from 'react';
import './NewAnnotation.css';

class NewAnnotation extends React.Component {
  state = {
    submitted: false,
  };

  submitButtonHandler = (event) => {
    this.setState({ submitted: true });
  };

  render() {
    const { newSelection } = this.props;
    // if (!newSelection) {
    //   return null;
    // }

    const { submitted } = this.state;

    return (
      <div className="NewAnnotationContainer">
        <div className="SelectedTextContainer">selected content</div>
        <div className="TextareaContainer">
          <textarea class="form-control" rows="2" />
        </div>
        <div className="SubmitButtonContainer">
          {!submitted ? (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={(e) => this.submitButtonHandler(e)}
            >
              Save
            </button>
          ) : (
            <div class="spinner-border text-secondary" role="status">
              <span class="sr-only">Loading...</span>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default NewAnnotation;
