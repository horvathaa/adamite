import React, { useContext, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from "./CodeBlockMarkdown";
import Tooltip from '@material-ui/core/Tooltip';
import './CardWrapper.module.css';
import { Text } from 'slate'
import classNames from 'classnames';
import { GiCancel } from 'react-icons/gi';
import RichEditor from '../RichTextEditor/RichTextEditor';
import RichEditor2 from '../RichTextEditor/RichTextEditor2';
import TagsInput from 'react-tagsinput';
import Dropdown from 'react-dropdown';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SplitButton, Dropdown as BootstrapDropdown } from 'react-bootstrap';
import AnnotationContext from "../AnnotationList/Annotation/AnnotationContext";

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}



const CardWrapper = ({ isNew = false, anno = null }) => {
    const ctx = useContext(AnnotationContext);
    const id = ctx.anno && "id" in ctx.anno ? ctx.anno.id : anno ? anno.id : false,
        pageAnnotation = anno ? anno.anchor : ctx.anno.anchor,
        elseContent = anno ? anno.content : ctx.anno.content,
        collapsed = anno ? true : ctx.collapsed,
        userGroups = ctx.userGroups;

    const [newAnno, setNewAnno] = useState(anno ? anno : ctx.anno);
    const [groups, setGroups] = useState(anno ? anno.groups : ctx.anno.groups);
    const pl = isJson(elseContent) ? JSON.parse(elseContent).language : 'js';

    const deserializeJson = (node) => {
        if (Text.isText(node)) {
            let string = node.text;
            if (node.bold && node.italic && string !== "") {
                string = `***${string}***`
            }
            else if(node.bold && string !== "") {
                string = `**${string}**`
            }
            else if(node.italic && string !== "") {
                string = `*${string}*`
            }
            if (node.code) {
                string = `\`${string}\``
            }
            
            return string
        }
        
        const children = node.children.map(n => deserializeJson(n)).join('');
    
        switch (node.type) {
            case 'paragraph':
                return `\n${children}\n`
            case 'link':
                return `[${children}](${escapeHtml(node.url)})`
            case 'code': {
                return `\t${children}\n`
            }
            default:
                return children
        }
    }


    useEffect(() => {
        if (newAnno !== ctx.anno) { setNewAnno(newAnno); }
    }, [newAnno]);

    const dropDownSelection = (option) => {
        let newVal = (option.value === 'Normal') ? "default" : (option.value === 'highlight') ? "highlight" : option.value;
        setNewAnno({ ...newAnno, type: newVal });
    }

    const defaultRenderTag = (props) => {
        let {tag, key, disabled, onRemove, classNameRemove, getTagDisplayValue, ...other} = props
        return (
          <span key={key} {...other}>
            {getTagDisplayValue(tag.length > 12 ? tag.slice(0,12) + "..." : tag)}
            {!disabled &&
              <a className={classNameRemove} onClick={(e) => onRemove(key)} />
            }
          </span>
        )
    }

    const codeComponent = {
        code({node, inline, className, children, ...props }) {
            return !inline ? <SyntaxHighlighter style={coy} language={pl} PreTag="div" children={String(children).replace(/\n$/, '')} {...props} /> :
            <code className={className} {...props}>
                {children}
            </code>
        }
    }

    const options = ['Normal', 'To-do', 'Question', 'Highlight', 'Issue'];
    const defaultOption = options[0];

    // console.log('markdown', deserializeJson(JSON.parse(elseContent)));


    let splitButtonText;
    if ((userGroups && userGroups.length) && (groups && groups.length)) {
        const group = userGroups.filter(g => g.gid === groups[0]);
        const name = group.length ? group[0].name : "Private"; // prevent breaking due to group being removed on backend but not updated in anno yet
        splitButtonText = "Post to " + name;
    }
    else {
        splitButtonText = !newAnno.isPrivate ? "Post to Public" : "Post as Private";
    }
    let annoTypeDropDownValue = (newAnno.type === 'default') ? 'normal' : (newAnno.type === 'highlight') ? 'empty' : newAnno.type;
    const placeHolderString = newAnno.tags === undefined || !newAnno.tags.length ? 'Add a tag then hit Enter' : 'Add a tag';


    const CardEditor = (<React.Fragment>
        {ctx.editing ? (
            <React.Fragment>
                <div className="TextareaContainer">
                    {/* <RichEditor
                        annotationContent={newAnno.contentBlock === undefined ? ctx.anno.content : ctx.anno.contentBlock}
                        annotationChangeHandler={(content, contentBlock) => setNewAnno({ ...newAnno, content, contentBlock })}
                    /> */}
                    <RichEditor2 
                        initialContent={
                            isJson(elseContent) ? 
                                JSON.parse(elseContent).children : 
                                [ {
                                        type:'paragraph',
                                        children: [{
                                            text: elseContent
                                        }]
                                    }
                                ]
                        }
                        initialLanguage={
                            isJson(elseContent) ? 
                                JSON.parse(elseContent).language :
                                'js'
                        } 
                        annotationChangeHandler={(content) => setNewAnno({ ...newAnno, content })}/>
                </div>

                <div className="Tag-Container">
                    <div className="row">
                        <div className="TextareaContainer">
                            <TagsInput value={newAnno.tags !== undefined ? newAnno.tags : []}
                                onChange={(newTags) => setNewAnno({ ...newAnno, tags: newTags })}
                                renderTag={defaultRenderTag} 
                                onlyUnique={true} 
                                inputProps={{ className: classNames({ 'react-tagsinput-input': true, empty: !newAnno.tags.length }), placeholder: placeHolderString }}
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
                                <BootstrapDropdown.Item className="DropdownItemOverwrite" onClick={_ => { setGroups([]); setNewAnno({ ...newAnno, isPrivate: true, groups: [] })}} eventKey="1">Private</BootstrapDropdown.Item>
                                <BootstrapDropdown.Item className="DropdownItemOverwrite" onClick={_ => { setGroups([]); setNewAnno({ ...newAnno, isPrivate: false, groups: [] })}} eventKey="2">Public</BootstrapDropdown.Item>
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
                Truncated: anno ? false : collapsed,
                annotationContent: true
            })}>
                <ReactMarkdown
                    children={isJson(elseContent) ? deserializeJson(JSON.parse(elseContent)) : elseContent}
                    components={codeComponent}
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



