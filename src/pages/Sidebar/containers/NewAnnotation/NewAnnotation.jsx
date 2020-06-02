import React from 'react';
// import { Dropdown } from 'react-bootstrap';
import './NewAnnotation.css';
// import ReactDOM from 'react-dom';
// import { Editor, EditorState } from 'draft-js';
// import { GiCancel } from 'react-icons/gi';
// import RichEditor from '../RichTextEditor/RichTextEditor'
// import CustomTag from '../CustomTag/CustomTag';
// import TagsInput from 'react-tagsinput'
// import Dropdown from 'react-dropdown';
import CardWrapper from '../CardWrapper/CardWrapper'

// function MyEditor() {
//   const [editorState, setEditorState] = React.useState(
//     EditorState.createEmpty(),
//   );
//   return <Editor editorState={editorState} onChange={setEditorState} />;
// }


class NewAnnotation extends React.Component {

  constructor(props) {
    super(props);
    this.annotationChangeHandler = this.annotationChangeHandler.bind(this)
  }

  saveAnnotationContent(w) {
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

  //TODO: FIX FOR NEW RICH TEXT ANNOTATOR
  // keydown = e => {
  //   if (e.key === 'Enter' && e.target.className === 'form-control' && this.state.annotationContent !== '') {
  //     this.submitButtonHandler();
  //   }
  //   else if (e.key === 'Enter' && e.target.className === 'tag-control' && e.target.value !== '') {
  //     e.preventDefault();
  //     this.state.tags.push(e.target.value);
  //     this.setState({ addedTag: true });
  //     e.target.value = '';
  //     console.log(this.state.tags);
  //   }
  // };

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

  tagsHandleChange = (newTag) => {
    this.setState({ tags: newTag })
  }

  cancelButtonHandler = () => {
    this.props.resetNewSelection();
  }

  submitButtonHandler = (CardWrapperState) => {
    this.setState({ submitted: true });

    const { url, newSelection, xpath, offsets } = this.props;
    const annotationInfo = {
      anchor: newSelection,
      annotation: CardWrapperState.annotationContent,
      xpath: xpath,
      offsets: offsets,
      tags: CardWrapperState.tags,
      annotationType: CardWrapperState.annotationType.toLowerCase(),
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
          annotationInfo.id = response.value;
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                msg: 'ANNOTATION_ADDED',
                newAnno: annotationInfo,
              }
            );
          });

          this.setState({ submitted: false });
          this.props.resetNewSelection();

        }
      }
    );
  };

  render() {
    const { newSelection } = this.props;

    const options = [
      'Default', 'To-do', 'Highlight', 'Navigation', 'Issue'
    ];

    const submittedLoadState = (
      <div className="spinner-border text-secondary" role="status">
        <span className="sr-only">...</span>
      </div>
    )

    const defaultOption = options[0];

    if (!newSelection) {
      return null;
    }

    const { annotationContent, submitted, tags } = this.state;

    return (
      <React.Fragment>
        <CardWrapper
          tags={tags} annotationContent={annotationContent}
          edit={!submitted}
          pageAnnotation={newSelection}

          cancelButtonHandler={this.cancelButtonHandler}
          submitButtonHandler={this.submitButtonHandler}
          elseContent={submittedLoadState} />
      </React.Fragment>
      //   <div className="NewAnnotationContainer">
      //     <div className="InnerNewAnnotation">
      //       <div className="SelectedTextContainer">{newSelection}</div>
      //       <div className="TextareaContainer">
      //         <RichEditor annotationChangeHandler={this.annotationChangeHandler} />
      //       </div>
      //       {!submitted ? (
      //         <React.Fragment>
      //           <div className="Tag-Container">
      //             <div className="row">
      //               <div className="TextareaContainer">
      //                 <TagsInput value={tags} onChange={this.tagsHandleChange} onlyUnique={true} />
      //               </div>
      //             </div>
      //           </div>
      //           <div className="SubmitButtonContainer">
      //             <div className="Tag-Container">
      //               <div className="row">
      //                 <div className="Dropdown-Col">
      //                   <Dropdown options={options} onChange={this._onSelect} value={defaultOption} placeholder="Select an option" />
      //                 </div>
      //           &nbsp; &nbsp;
      //             <button
      //                   className="btn Cancel-Button"
      //                   onClick={_ => this.props.resetNewSelection()}
      //                 >
      //                   <GiCancel /> Cancel
      //           </button>
      //           &nbsp; &nbsp;
      //             <button
      //                   id="NewAnnotation"
      //                   className="Publish-Button SubmitButton "
      //                   onClick={e => this.submitButtonHandler(e)}
      //                   disabled={annotationContent.length === 0}
      //                 >
      //                   Publish
      //           </button>
      //               </div>
      //             </div>
      //           </div>
      //         </React.Fragment>
      //       ) : (
      //           <div className="spinner-border text-secondary" role="status">
      //             <span className="sr-only">...</span>
      //           </div>
      //         )}
      //     </div>
      //   </div >
    );
  }
}

export default NewAnnotation;
