import React from 'react';
import ReactDOM from 'react-dom';
import "./RichTextEditor.css"
import { Editor, EditorState, RichUtils, convertToRaw } from 'draft-js';
import { GrBlockQuote } from "react-icons/gr";
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdCode, MdFormatListBulleted, MdFormatListNumbered } from 'react-icons/md';


export default class RichEditorExample extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty()
        };

        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => {
            const blocks = convertToRaw(editorState.getCurrentContent()).blocks;
            const value = blocks.map(block => (!block.text.trim() && '\n') || block.text).join('\n');
            //console.log(blocks);
            this.props.annotationChangeHandler(value);
            this.setState({ editorState: editorState });

        }  //this.setState({ editorState, annotationContent: editorState });
        this.handleKeyCommand = (command) => this._handleKeyCommand(command);
        this.onTab = (e) => this._onTab(e);
        this.toggleBlockType = (type) => this._toggleBlockType(type);
        this.toggleInlineStyle = (style) => {
            console.log("style");
            console.log(style);
            this._toggleInlineStyle(style);
        }

    }

    _handleKeyCommand(command) {
        const { editorState } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    _onTab(e) {
        const maxDepth = 4;
        this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
    }

    _toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }

    _toggleInlineStyle(inlineStyle) {
        console.log(this.onChange);
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }

    render() {
        const { editorState } = this.state;

        // If the user changes block type before entering any text, we can
        // either style the placeholder or hide it. Let's just hide it now.
        let className = 'RichEditor-editor';
        var contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' RichEditor-hidePlaceholder';
            }
        }
        EditorState.moveSelectionToEnd(this.state.editorState)
        var selectionState = this.state.editorState.getSelection();

        return (
            <div className="RichEditor-root">
                <div className="RichEditor-controls">
                    <InlineStyleControls
                        editorState={editorState}
                        onToggle={this.toggleInlineStyle}
                    />
                    <BlockStyleControls
                        editorState={editorState}
                        onToggle={this.toggleBlockType}
                    />
                </div>
                <div className={className} onClick={this.focus}>
                    <Editor
                        blockStyleFn={getBlockStyle}
                        customStyleMap={styleMap}
                        editorState={editorState}
                        handleKeyCommand={this.handleKeyCommand}
                        onChange={this.onChange}
                        onTab={this.onTab}
                        placeholder=""
                        ref="editor"
                        spellCheck={true}
                    />
                </div>
            </div>
        );
    }
}

// Custom overrides for "code" style.
const styleMap = {
    CODE: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
        fontSize: 16,
        padding: 2,
    },
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote': return 'RichEditor-blockquote';
        default: return null;
    }
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
    }

    render() {
        let className = 'RichEditor-styleButton';
        if (this.props.active) {
            className += ' RichEditor-activeButton';
        }
        console.log(this.props.icon);
        return (
            <span className={className} onMouseDown={this.onToggle}>
                {this.props.icon === undefined ? this.props.label : this.props.icon}
            </span>
        );
    }
}

const BLOCK_TYPES = [
    // { label: 'H1', style: 'header-one' },
    // { label: 'H2', style: 'header-two' },
    // { label: 'H3', style: 'header-three' },
    // { label: 'H4', style: 'header-four' },
    // { label: 'H5', style: 'header-five' },
    // { label: 'H6', style: 'header-six' },
    { label: 'Blockquote', style: 'blockquote', icon: <GrBlockQuote className="RichEditor-styleSvg" /> },
    { label: 'UL', style: 'unordered-list-item', icon: <MdFormatListBulleted className="RichEditor-styleSvg" /> },
    { label: 'OL', style: 'ordered-list-item', icon: <MdFormatListNumbered className="RichEditor-styleSvg" /> },
    { label: 'Code Block', style: 'code-block' },
];

const BlockStyleControls = (props) => {
    const { editorState } = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();

    return (
        <React.Fragment>
            {BLOCK_TYPES.map((type) =>
                <StyleButton
                    key={type.label}
                    active={type.style === blockType}
                    label={type.label}
                    icon={type.icon}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </React.Fragment>
    );
};

var INLINE_STYLES = [
    { label: 'Bold', style: 'BOLD', icon: <MdFormatBold className="RichEditor-styleSvg" />, styleClass: "RichEditor-styleSvg" },
    { label: 'Italic', style: 'ITALIC', icon: <MdFormatItalic className="RichEditor-styleSvg" /> },
    { label: 'Underline', style: 'UNDERLINE', icon: <MdFormatUnderlined className="RichEditor-styleSvg" /> },
    { label: 'Monospace', style: 'CODE', icon: <MdCode className="RichEditor-styleSvg" /> },
];

const InlineStyleControls = (props) => {
    var currentStyle = props.editorState.getCurrentInlineStyle();
    return (
        <React.Fragment>
            {INLINE_STYLES.map(type =>
                <StyleButton
                    key={type.label}
                    active={currentStyle.has(type.style)}
                    label={type.label}
                    icon={type.icon}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </React.Fragment>
    );
};
