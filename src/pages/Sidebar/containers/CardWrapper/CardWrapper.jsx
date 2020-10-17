import React from 'react';
import './CardWrapper.css';
import classNames from 'classnames';
import { GiCancel } from 'react-icons/gi';
import RichEditor from '../RichTextEditor/RichTextEditor';
import TagsInput from 'react-tagsinput';
import Dropdown from 'react-dropdown';
import { SplitButton, Dropdown as BootstrapDropdown } from 'react-bootstrap';

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
        annotationContent: this.props.annotationContent.trim() === '' ? '' : this.props.annotationContent,
        annotationType: this.props.annotationType === undefined ? "Default" : this.props.annotationType,
        tags: this.props.tags !== undefined && this.props.tags.length === 0 ? [] : this.props.tags,
        elseContent: this.props.elseContent,
        pageAnnotation: this.props.pageAnnotation,
        collapsed: this.props.collapsed,
        private: true,
        groups: []
    };

    updateData = () => {
        let { tags, annotationContent, annotationType } = this.props;

        this.setState({
            tags, elseContent: annotationContent, annotationType: annotationType === undefined ? "Default" : annotationType
        })
    }

    componentDidMount() {
        document.addEventListener('keydown', this.keydown, false);
        this.updateData();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.tags !== this.props.tags || prevProps.annotationContent !== this.props.annotationContent || prevProps.type !== this.props.type) {
            this.updateData();
        }
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

    tagsHandleChange = (newTag) => {
        this.setState({ tags: newTag })
    }

    submitPassthrough = () => {
        console.log('state', this.state);
        this.setState({ edit: this.props.submitButtonHandler(this.state) });
    }

    cancelPassthrough = () => {
        this.props.cancelButtonHandler();
    }

    disabled = (annotationContent) => {
        return annotationContent.trim().length === 0;
    }

    dropDownSelection = (option) => {
        if (option.value === 'Normal') {
            this.setState({ annotationType: "default" });
        }
        else if (option.value === 'highlight') {
            this.setState({ annotationType: "highlight" });
        }
        else {
            this.setState({ annotationType: option.value });
        }
    }

    render() {

        const options = [
            'Normal', 'To-do', 'Question', 'Highlight', 'Issue'
        ];
        const defaultOption = options[0];


        const { annotationContent, tags, elseContent, id, annotationType } = this.state;
        const { userGroups } = this.props;
        const splitButtonText = this.state.private ? "Post to Only Me" : "Post to Public";
        let annoTypeDropDownValue;
        if (annotationType === 'default') {
            annoTypeDropDownValue = 'normal';
        }
        else if (annotationType === 'highlight') {
            annoTypeDropDownValue = 'empty';
        }
        else {
            annoTypeDropDownValue = annotationType;
        }

        const CardEditor = (<React.Fragment>
            {this.props.edit ? (
                <React.Fragment>
                    <div className="TextareaContainer">
                        <RichEditor annotationContent={annotationContent} annotationChangeHandler={this.annotationChangeHandler} />
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
                                    <Dropdown options={options} onChange={this.dropDownSelection} value={annoTypeDropDownValue} />
                                </div>
                                    &nbsp; &nbsp;
                                    <button className="btn Cancel-Button" onClick={this.cancelPassthrough}>
                                    <GiCancel /> Cancel
                                    </button>
                                    &nbsp; &nbsp;
                                <SplitButton
                                    key="publicPrivateGroup"
                                    id="dropdown-split-variants-secondary"
                                    variant="secondary"
                                    title={splitButtonText}
                                    onClick={this.submitPassthrough}
                                >
                                    <BootstrapDropdown.Item onClick={_ => this.setState({ private: true })} eventKey="1">Only Me</BootstrapDropdown.Item>
                                    <BootstrapDropdown.Item onClick={_ => this.setState({ private: false })} eventKey="2">Public</BootstrapDropdown.Item>
                                    {userGroups.map((group, i) => {
                                        return <BootstrapDropdown.Item onClick={_ => this.setState({ groups: [group.gid] })} eventKey={i + 2}>{group.name}</BootstrapDropdown.Item>
                                    })}
                                </SplitButton>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            ) : <React.Fragment>
                    <div className={classNames({
                        Truncated: this.props.collapsed,
                        annotationContent: true
                    })}>
                        {elseContent}
                    </div>
                </React.Fragment>}
        </React.Fragment>);

        return (
            <React.Fragment>
                {!id ? (
                    <div className="NewAnnotationContainer">
                        <div className="InnerNewAnnotation">
                            <div className="SelectedTextContainer">{this.props.pageAnnotation}</div>
                            {CardEditor}
                        </div>
                    </div>) : <React.Fragment> {CardEditor}  </React.Fragment>}
            </React.Fragment>
        );
    }
}

