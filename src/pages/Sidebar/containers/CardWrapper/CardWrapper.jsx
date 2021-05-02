import React, { useContext, useState, useEffect } from 'react';
import './CardWrapper.module.css';
import classNames from 'classnames';
import { GiCancel } from 'react-icons/gi';
import RichEditor from '../RichTextEditor/RichTextEditor';
import TagsInput from 'react-tagsinput';
import Dropdown from 'react-dropdown';
import { SplitButton, Dropdown as BootstrapDropdown } from 'react-bootstrap';
import AnnotationContext from "../AnnotationList/Annotation/AnnotationContext";

const CardWrapper = ({ isNew = false }) => {
    const ctx = useContext(AnnotationContext);
    // if (isNew) console.log(ctx.anno);
    const id = "id" in ctx.anno ? ctx.anno.id : false,
        pageAnnotation = ctx.anno.anchor,
        elseContent = ctx.anno.content,
        collapsed = ctx.collapsed,
        userGroups = ctx.userGroups;

    const [newAnno, setNewAnno] = useState(ctx.anno);
    const [groups, setGroups] = useState(ctx.userGroups);

    useEffect(() => {
        if (newAnno !== ctx.anno) setNewAnno(newAnno);
    });
    const dropDownSelection = (option) => {
        let newVal = (option.value === 'Normal') ? "default" : (option.value === 'highlight') ? "highlight" : option.value;
        setNewAnno({ ...newAnno, type: newVal });
    }

    const options = ['Normal', 'To-do', 'Question', 'Highlight', 'Issue'];
    const defaultOption = options[0];


    let splitButtonText;
    if (groups && groups.length) {
        const name = userGroups.filter(g => g.gid === groups[0])[0].name;
        splitButtonText = "Post to " + name;
    }
    else {
        splitButtonText = !newAnno.isPrivate ? "Post to Public" : "Post as Private";
    }
    let annoTypeDropDownValue = (newAnno.type === 'default') ? 'normal' : (newAnno.type === 'highlight') ? 'empty' : newAnno.type;


    const CardEditor = (<React.Fragment>
        {ctx.editing ? (
            <React.Fragment>
                <div className="TextareaContainer">
                    <RichEditor annotationContent={newAnno.content}
                        annotationChangeHandler={(content) => setNewAnno({ ...newAnno, content: content })} />
                </div>

                <div className="Tag-Container">
                    <div className="row">
                        <div className="TextareaContainer">
                            <TagsInput value={newAnno.tags}
                                onChange={(newTags) => setNewAnno({ ...newAnno, tags: newTags })}
                                onlyUnique={true}
                            />
                        </div>
                    </div>
                </div>
                <div className="SubmitButtonContainer">
                    <div className="Tag-Container">
                        <div className="row">
                            <div className="Dropdown-Col">
                                <Dropdown options={options}
                                    onChange={dropDownSelection}
                                    value={annoTypeDropDownValue} />
                            </div>
                            &nbsp; &nbsp;
                            <button className="btn Cancel-Button" onClick={
                                isNew ? () => ctx.cancelButtonHandler() :
                                    () => ctx.updateAnnotation(ctx.anno)
                            }>
                                <GiCancel /> Cancel
                            </button>
                            &nbsp; &nbsp;
                            <SplitButton
                                key="publicPrivateGroup"
                                id="dropdown-split-variants-secondary"
                                variant="secondary"
                                title={splitButtonText}
                                onClick={isNew ? () => ctx.submitButtonHandler(newAnno) :
                                    () => ctx.updateAnnotation(newAnno)
                                }
                            >
                                <BootstrapDropdown.Item onClick={_ => setNewAnno({ ...newAnno, isPrivate: true })} eventKey="1">Private</BootstrapDropdown.Item>
                                <BootstrapDropdown.Item onClick={_ => setNewAnno({ ...newAnno, isPrivate: false })} eventKey="2">Public</BootstrapDropdown.Item>
                                {userGroups.map((group, i) => {
                                    return <BootstrapDropdown.Item onClick={_ => setGroups([group.gid])} eventKey={i + 2}>{group.name}</BootstrapDropdown.Item>
                                })}
                            </SplitButton>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        ) : <React.Fragment>
            <div className={classNames({
                Truncated: collapsed,
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
                        <div className="SelectedTextContainer">{pageAnnotation}</div>
                        {CardEditor}
                    </div>
                </div>) : <React.Fragment> {CardEditor}  </React.Fragment>}
        </React.Fragment>
    );
}

export default CardWrapper;




  // if (ctx.anno.annotationContent !== annotationContent) setAnnotationContent(ctx.anno.annotationContent);
        // if (ctx.anno.annotationType !== annotationType) setAnnotationType(ctx.anno.annotationType);
    // submitPassthrough = () => {
    //     ctx.updateAnnotation(newAnno);
    //   this.setState({ edit: this.props.submitButtonHandler(this.state) });
    // }

    // const cancelPassthrough = () => {
    //     ctx.updateAnnotation(ctx.anno);
    //    this.props.cancelButtonHandler();
    // }
    // const disabled = (annotationContent) => {
    //     return annotationContent.trim().length === 0;
    // }
 //const [annotationContent, setAnnotationContent] = useState(ctx.anno.content);
    //const [annotationType, setAnnotationType] = useState(ctx.anno.annotationType);
    //const [tags, setTags] = useState(ctx.anno.tags);


    // const { annotationContent, tags, elseContent, id, annotationType, groups } = this.state;
    // const { userGroups } = this.props;

// constructor(props) {
//     super(props);
//     this.annotationChangeHandler = this.annotationChangeHandler.bind(this)
// }

// saveAnnotationContent(w) {
//     this.setState({
//         annotationContent: w
//     })
// }


    // updateAnnotationType(eventKey) {
    //     this.setState({ annotationType: eventKey });
    // }

    // annotationChangeHandler = (value) => {
    //     this.setState({ annotationContent: value });
    // };

    // annotationTagHandler = event => {

    // }

    // tagsHandleChange = (newTag) => {
    //     this.setState({ tags: newTag })
    // }
// export default class CardWrapper extends React.Component {

//     constructor(props) {
//         super(props);
//         this.annotationChangeHandler = this.annotationChangeHandler.bind(this)
//     }

//     saveAnnotationContent(w) {
//         this.setState({
//             annotationContent: w
//         })
//     }

//     state = {
//         edit: this.props.edit,
//         id: this.props.id === undefined ? false : this.props.id,
//         addedTag: false,
//         annotationContent: this.props.annotationContent.trim() === '' ? '' : this.props.annotationContent,
//         annotationType: this.props.annotationType === undefined ? "Default" : this.props.annotationType,
//         tags: this.props.tags !== undefined && this.props.tags.length === 0 ? [] : this.props.tags,
//         elseContent: this.props.elseContent,
//         pageAnnotation: this.props.pageAnnotation,
//         collapsed: this.props.collapsed,
//         private: true,
//         groups: []
//     };

//     updateData = () => {
//         let { tags, annotationContent, annotationType } = this.props;

//         this.setState({
//             tags, elseContent: annotationContent, annotationType: annotationType === undefined ? "Default" : annotationType
//         })
//     }

//     componentDidMount() {
//         document.addEventListener('keydown', this.keydown, false);
//         this.updateData();
//     }

//     componentDidUpdate(prevProps) {
//         if (prevProps.tags !== this.props.tags || prevProps.annotationContent !== this.props.annotationContent || prevProps.type !== this.props.type) {
//             this.updateData();
//         }
//     }

//     componentWillUnmount() {
//         document.removeEventListener('keydown', this.keydown, false);
//     }

//     updateAnnotationType(eventKey) {
//         this.setState({ annotationType: eventKey });
//     }

//     annotationChangeHandler = (value) => {
//         this.setState({ annotationContent: value });
//     };

//     annotationTagHandler = event => {

//     }

//     tagsHandleChange = (newTag) => {
//         this.setState({ tags: newTag })
//     }

//     submitPassthrough = () => {
//         this.setState({ edit: this.props.submitButtonHandler(this.state) });
//     }

//     cancelPassthrough = () => {
//         this.props.cancelButtonHandler();
//     }

//     disabled = (annotationContent) => {
//         return annotationContent.trim().length === 0;
//     }

//     dropDownSelection = (option) => {
//         if (option.value === 'Normal') {
//             this.setState({ annotationType: "default" });
//         }
//         else if (option.value === 'highlight') {
//             this.setState({ annotationType: "highlight" });
//         }
//         else {
//             this.setState({ annotationType: option.value });
//         }
//     }

//     render() {

//         const options = [
//             'Normal', 'To-do', 'Question', 'Highlight', 'Issue'
//         ];
//         const defaultOption = options[0];


//         const { annotationContent, tags, elseContent, id, annotationType, groups } = this.state;
//         const { userGroups } = this.props;
//         let splitButtonText;
//         if (groups.length) {
//             const name = userGroups.filter(g => g.gid === groups[0])[0].name;
//             splitButtonText = "Post to " + name;
//         }
//         else {
//             splitButtonText = this.state.private ? "Post as Private" : "Post to Public";
//         }
//         let annoTypeDropDownValue;
//         if (annotationType === 'default') {
//             annoTypeDropDownValue = 'normal';
//         }
//         else if (annotationType === 'highlight') {
//             annoTypeDropDownValue = 'empty';
//         }
//         else {
//             annoTypeDropDownValue = annotationType;
//         }

//         const CardEditor = (<React.Fragment>
//             {this.props.edit ? (
//                 <React.Fragment>
//                     <div className="TextareaContainer">
//                         <RichEditor annotationContent={annotationContent} annotationChangeHandler={this.annotationChangeHandler} />
//                     </div>

//                     <div className="Tag-Container">
//                         <div className="row">
//                             <div className="TextareaContainer">
//                                 <TagsInput value={tags} onChange={this.tagsHandleChange} onlyUnique={true} />
//                             </div>
//                         </div>
//                     </div>
//                     <div className="SubmitButtonContainer">
//                         <div className="Tag-Container">
//                             <div className="row">
//                                 <div className="Dropdown-Col">
//                                     <Dropdown options={options} onChange={this.dropDownSelection} value={annoTypeDropDownValue} />
//                                 </div>
//                                 &nbsp; &nbsp;
//                                 <button className="btn Cancel-Button" onClick={this.cancelPassthrough}>
//                                     <GiCancel /> Cancel
//                                 </button>
//                                 &nbsp; &nbsp;
//                                 <SplitButton
//                                     key="publicPrivateGroup"
//                                     id="dropdown-split-variants-secondary"
//                                     variant="secondary"
//                                     title={splitButtonText}
//                                     onClick={this.submitPassthrough}
//                                 >
//                                     <BootstrapDropdown.Item onClick={_ => this.setState({ private: true })} eventKey="1">Private</BootstrapDropdown.Item>
//                                     <BootstrapDropdown.Item onClick={_ => this.setState({ private: false })} eventKey="2">Public</BootstrapDropdown.Item>
//                                     {userGroups.map((group, i) => {
//                                         return <BootstrapDropdown.Item onClick={_ => this.setState({ groups: [group.gid] })} eventKey={i + 2}>{group.name}</BootstrapDropdown.Item>
//                                     })}
//                                 </SplitButton>
//                             </div>
//                         </div>
//                     </div>
//                 </React.Fragment>
//             ) : <React.Fragment>
//                 <div className={classNames({
//                     Truncated: this.props.collapsed,
//                     annotationContent: true
//                 })}>
//                     {elseContent}
//                 </div>
//             </React.Fragment>}
//         </React.Fragment>);

//         return (
//             <React.Fragment>
//                 {!id ? (
//                     <div className="NewAnnotationContainer">
//                         <div className="InnerNewAnnotation">
//                             <div className="SelectedTextContainer">{this.props.pageAnnotation}</div>
//                             {CardEditor}
//                         </div>
//                     </div>) : <React.Fragment> {CardEditor}  </React.Fragment>}
//             </React.Fragment>
//         );
//     }
// }

