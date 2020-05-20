import React from 'react';
// import { Dropdown } from 'react-bootstrap';
import './NewAnnotation.css';
import ReactDOM from 'react-dom';
import { Editor, EditorState } from 'draft-js';
import { GiCancel } from 'react-icons/gi';
import RichEditorExample from '../RichTextEditor/RichTextEditor'
import CustomTag from '../CustomTag/CustomTag';
import TagsInput from 'react-tagsinput'
import Dropdown from 'react-dropdown';
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

  submitButtonHandler = (CardWrapperState) => {
    this.setState({ submitted: true });

    const { url, newSelection, xpath, offsets } = this.props;
    console.log('saving tags');
    console.log(this.state);
    console.log(this.props);
    console.log(CardWrapperState);
    const annotationInfo = {
      anchor: newSelection,
      annotation: CardWrapperState.annotationContent,
      xpath: xpath,
      offsets: offsets,
      tags: CardWrapperState.tags,
      annotationType: CardWrapperState.annotationType,
    };
    console.log(annotationInfo);
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
        <CardWrapper tags={tags} annotationContent={annotationContent} edit={!submitted} pageAnnotation={newSelection} submitButtonHandler={this.submitButtonHandler} elseContent={submittedLoadState} />
      </React.Fragment>
    );
  }
}

export default NewAnnotation;
