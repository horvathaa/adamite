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
        if (newAnno !== ctx.anno) { setNewAnno(newAnno); }
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
                            <TagsInput value={newAnno.tags !== undefined ? newAnno.tags : []}
                                onChange={(newTags) => setNewAnno({ ...newAnno, tags: newTags })}
                                onlyUnique={true}
                                addOnBlur
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
                                    () => ctx.updateAnnotationFields({ type: newAnno.type, content: newAnno.content, isPrivate: newAnno.isPrivate, tags: newAnno.tags })
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



