import React from 'react';
// import { Dropdown } from 'react-bootstrap';
import './CardWrapper.css';
import ReactDOM from 'react-dom';
import { Editor, EditorState } from 'draft-js';
import { GiCancel } from 'react-icons/gi';
import RichEditorExample from '../RichTextEditor/RichTextEditor'
import CustomTag from '../CustomTag/CustomTag';
import TagsInput from 'react-tagsinput'
import Dropdown from 'react-dropdown';
function MyEditor() {
    const [editorState, setEditorState] = React.useState(
        EditorState.createEmpty(),
    );
    return <Editor editorState={editorState} onChange={setEditorState} />;
}


export default class CardWrapper extends React.Component {

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
        edit: this.props.edit,
        id: this.props.id === undefined ? false : this.props.id,
        addedTag: false,
        annotationContent: this.props.annotationContent.trim() === '' ? this.props.annotationContent : '',
        annotationType: "default",
        tags: this.props.tags.length === 0 ? [] : this.props.tags,
        elseContent: this.props.elseContent,
        pageAnnotation: this.props.pageAnnotation

    };

    componentDidMount() {
        document.addEventListener('keydown', this.keydown, false);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.keydown, false);
    }

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

    submitPassthrough = () => {
        this.setState({ edit: this.props.submitButtonHandler(this.state) });
    }

    render() {

        const options = [
            'Default', 'To-do', 'Highlight', 'Navigation', 'Issue'
        ];
        const defaultOption = options[0];


        const { pageAnnotation, annotationContent, edit, tags, elseContent, id } = this.state;

        const CardEditor = (<React.Fragment>
            {this.props.edit ? (
                <React.Fragment>
                    <div className="TextareaContainer">
                        <RichEditorExample annotationChangeHandler={this.annotationChangeHandler} />
                    </div>

                    <div className="Tag-Container">
                        <div className="row">
                            <div className="TextareaContainer">
                                <TagsInput value={tags} onChange={this.tagsHandleChange} onlyUnique={true} />
                            </div>
                        </div>
                    </div>
                    <div className="SubmitButtonContainer">
                        <div className="Tag-Container">
                            <div className="row">
                                <div className="Dropdown-Col">
                                    <Dropdown options={options} onChange={this._onSelect} value={defaultOption} placeholder="Select an option" />
                                </div>
                                    &nbsp; &nbsp;
                                    <button className="btn Cancel-Button" onClick={_ => this.props.resetNewSelection()}>
                                    <GiCancel /> Cancel
                                    </button>
                                    &nbsp; &nbsp;
                                    <button id="NewAnnotation" className="Publish-Button SubmitButton " onClick={this.submitPassthrough} disabled={annotationContent.length === 0}>
                                    Publish
                                    </button>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            ) : <React.Fragment>{elseContent}</React.Fragment>}
        </React.Fragment>);

        return (
            <React.Fragment>
                {!id ? (
                    <div className="NewAnnotationContainer">
                        <div className="InnerNewAnnotation">
                            <div className="SelectedTextContainer">{pageAnnotation}</div>
                            {CardEditor}
                        </div>
                    </div>) : <React.Fragment> {CardEditor}  </React.Fragment>}
            </React.Fragment>
        );
    }
}

