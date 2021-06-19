import React, { useContext, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'
import CodeBlock from "./CodeBlockMarkdown";
import Tooltip from '@material-ui/core/Tooltip';
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
    const id = "id" in ctx.anno ? ctx.anno.id : false,
        pageAnnotation = ctx.anno.anchor,
        elseContent = ctx.anno.content,
        collapsed = ctx.collapsed,
        userGroups = ctx.userGroups;

    const [newAnno, setNewAnno] = useState(ctx.anno);
    const [groups, setGroups] = useState(ctx.anno.groups);

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
    if ((userGroups && userGroups.length) && (groups && groups.length)) {
        const group = userGroups.filter(g => g.gid === groups[0]);
        const name = group.length ? group[0].name : "Private"; // prevent breaking due to group being removed on backend but not updated in anno yet
        splitButtonText = "Post to " + name;
    }
    else {
        splitButtonText = !newAnno.isPrivate ? "Post to Public" : "Post as Private";
    }
    let annoTypeDropDownValue = (ctx.anno.type === 'default') ? 'normal' : (ctx.anno.type === 'highlight') ? 'empty' : ctx.anno.type;
    const placeHolderString = newAnno.tags === undefined || !newAnno.tags.length ? 'Add a tag then hit Enter' : 'Add a tag';

    const CardEditor = (<React.Fragment>
        {ctx.editing ? (
            <React.Fragment>
                <div className="TextareaContainer">
                    <RichEditor
                        annotationContent={newAnno.contentBlock === undefined ? ctx.anno.content : newAnno.contentBlock}
                        annotationChangeHandler={(content, contentBlock) => setNewAnno({ ...newAnno, content, contentBlock })}
                    />
                </div>

                <div className="Tag-Container">
                    <div className="row">
                        <div className="TextareaContainer">
                            <TagsInput value={newAnno.tags !== undefined ? newAnno.tags : []}
                                onChange={(newTags) => setNewAnno({ ...newAnno, tags: newTags })}
                                onlyUnique={true} inputProps={{ className: classNames({ 'react-tagsinput-input': true, empty: !newAnno.tags.length }), placeholder: placeHolderString }}
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
                            <div className="Dropdown-Col col ml-auto mr-auto" style={{display: "flex", backgroundColor: 'transparent', margin: '.25rem'}}>
                            <Tooltip title={"Cancel"} aria-label="Cancel Submission">
                                
                                    <button className="btn Cancel-Button TagButton" placeholder="Cancel" onClick={
                                        isNew ? () => ctx.cancelButtonHandler() :
                                            () => ctx.updateAnnotation(ctx.anno)
                                    }>
                                        <GiCancel />
                                    </button>
                                
                            </Tooltip>
                            &nbsp; &nbsp;
                            <SplitButton
                                key="publicPrivateGroup"
                                id="dropdown-split-variants-secondary"
                                variant="secondary"
                                title={splitButtonText}
                                className="PostButton"
                                onClick={isNew ?
                                    () => ctx.submitButtonHandler(newAnno) :
                                    () => ctx.updateAnnotationFields({ type: newAnno.type, content: newAnno.content, contentBlock: newAnno.contentBlock, isPrivate: newAnno.isPrivate, tags: newAnno.tags, groups })
                                }
                            >
                                <BootstrapDropdown.Header className="AnnotationOptionsTitle">Groups<hr/></BootstrapDropdown.Header>
                                <BootstrapDropdown.Item className="DropdownItemOverwrite" onClick={_ => setNewAnno({ ...newAnno, isPrivate: true })} eventKey="1">Private</BootstrapDropdown.Item>
                                <BootstrapDropdown.Item className="DropdownItemOverwrite" onClick={_ => setNewAnno({ ...newAnno, isPrivate: false })} eventKey="2">Public</BootstrapDropdown.Item>
                                {userGroups.map((group, i) => {
                                    return <BootstrapDropdown.Item className="DropdownItemOverwrite GroupLimitDropDown" onClick={_ => { setGroups([group.gid]); setNewAnno({ ...newAnno, groups: [group.gid] }) }} eventKey={i + 2}>{group.name}</BootstrapDropdown.Item>
                                })}
                            </SplitButton>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        ) : <React.Fragment>
            <div className={classNames({
                Truncated: collapsed,
                annotationContent: true
            })}>
                <ReactMarkdown
                    children={elseContent}
                    components={{ code: CodeBlock }}
                />
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



