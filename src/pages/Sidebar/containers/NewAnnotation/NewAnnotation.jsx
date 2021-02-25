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
import { AiOutlineConsoleSql } from 'react-icons/ai';

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
    const { xpath, offsets } = this.props;
    const annotationInfo = {
      xpath: xpath,
      offsets: offsets,
    };
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          msg: 'TEMP_ANNOTATION_ADDED',
          newAnno: annotationInfo,
        }
      );
    });
    this.props.scrollToNewAnnotationEditor();
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
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          msg: 'REMOVE_TEMP_ANNOTATION',
        }
      );
    });
    this.props.resetNewSelection();
  }

  submitButtonHandler = (CardWrapperState) => {
    this.setState({ submitted: true });
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          msg: 'REMOVE_TEMP_ANNOTATION',
        },
        response => {
          if (response.msg === 'REMOVED') {
            const { url, newSelection, xpath, offsets } = this.props;
            const annotationInfo = {
              anchor: newSelection,
              annotation: CardWrapperState.annotationContent,
              xpath: xpath,
              offsets: offsets,
              tags: CardWrapperState.tags,
              annotationType: CardWrapperState.annotationType.toLowerCase(),
              private: CardWrapperState.private,
              groups: CardWrapperState.groups
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
                  this.props.scrollToNewAnnotation(response.value);
                }
              }
            );
          }
        }
      );
    });


  };

  render() {
    const { newSelection, type, annoContent, userGroups } = this.props;

    const options = [
      'Default', 'To-do', 'Highlight', 'Issue'
    ];

    const submittedLoadState = (
      <div className="spinner-border text-secondary" role="status">
        <span className="sr-only">...</span>
      </div>
    )

    const defaultOption = options[0];

    // if (!newSelection) {
    //   return null;
    // }

    const { annotationContent, submitted, tags } = this.state;

    const annoBody = annoContent === "" ? annotationContent : annoContent;

    return (
      <React.Fragment>
        <CardWrapper
          tags={tags} annotationContent={annoBody}
          edit={!submitted}
          pageAnnotation={newSelection}
          annotationType={type}
          userGroups={userGroups}
          cancelButtonHandler={this.cancelButtonHandler}
          submitButtonHandler={this.submitButtonHandler}
          elseContent={submittedLoadState} />
      </React.Fragment>

    );
  }
}

export default NewAnnotation;
