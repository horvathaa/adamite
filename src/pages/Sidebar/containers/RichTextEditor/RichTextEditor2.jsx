import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-java'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Slate, useSlate, Editable, withReact } from 'slate-react'
import isHotkey from 'is-hotkey'
import { Text, createEditor, Transforms, Editor } from 'slate'
import { withHistory } from 'slate-history'
import { Button, Icon, Toolbar } from './SlateComponents.js'
import { css } from '@emotion/css'
import { render } from 'react-dom'
import { BiBold, BiItalic, BiCode } from 'react-icons/bi';

// AMBER: If we want to support multiple programming languages in one annotation, I think this approach will be necessary
// for now, just have one language declared at the top level of the rich text editor tree
// const appendProgrammingLanguage = (node) => {
//     if (Text.isText(node)) {
//         const newNode = node.code ? {
//             code: true,
//             text: node.text,
//             language: language
//         } : node;
//         return newNode
//     }

//     const children = node.children.map(n => appendProgrammingLanguage(n));

//     if(node.type === 'code') {
//         return {
//             type: 'code',
//             children: node.children,
//             language: language
//         }
//     }
//     else {
//         return children
//     }
// }


// eslint-disable-next-line
Prism.languages.python = Prism.languages.extend('python', {}), Prism.languages.insertBefore('python', 'prolog', { comment: { pattern: /##[^\n]*/, alias: 'comment' }, })
// eslint-disable-next-line
Prism.languages.javascript = Prism.languages.extend('javascript', {}), Prism.languages.insertBefore('javascript', 'prolog', { comment: { pattern: /\/\/[^\n]*/, alias: 'comment' }, })
// eslint-disable-next-line
Prism.languages.html = Prism.languages.extend('html', {}), Prism.languages.insertBefore('html', 'prolog', { comment: { pattern: /<!--[^\n]*-->/, alias: 'comment' }, })
// eslint-disable-next-line
Prism.languages.markdown = Prism.languages.extend("markup", {}), Prism.languages.insertBefore("markdown", "prolog", { blockquote: { pattern: /^>(?:[\t ]*>)*/m, alias: "punctuation" }, code: [{ pattern: /^(?: {4}|\t).+/m, alias: "keyword" }, { pattern: /``.+?``|`[^`\n]+`/, alias: "keyword" }], title: [{ pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/, alias: "important", inside: { punctuation: /==+$|--+$/ } }, { pattern: /(^\s*)#+.+/m, lookbehind: !0, alias: "important", inside: { punctuation: /^#+|#+$/ } }], hr: { pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m, lookbehind: !0, alias: "punctuation" }, list: { pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m, lookbehind: !0, alias: "punctuation" }, "url-reference": { pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/, inside: { variable: { pattern: /^(!?\[)[^\]]+/, lookbehind: !0 }, string: /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/, punctuation: /^[\[\]!:]|[<>]/ }, alias: "url" }, bold: { pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/, lookbehind: !0, inside: { punctuation: /^\*\*|^__|\*\*$|__$/ } }, italic: { pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/, lookbehind: !0, inside: { punctuation: /^[*_]|[*_]$/ } }, url: { pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/, inside: { variable: { pattern: /(!?\[)[^\]]+(?=\]$)/, lookbehind: !0 }, string: { pattern: /"(?:\\.|[^"\\])*"(?=\)$)/ } } } }), Prism.languages.markdown.bold.inside.url = Prism.util.clone(Prism.languages.markdown.url), Prism.languages.markdown.italic.inside.url = Prism.util.clone(Prism.languages.markdown.url), Prism.languages.markdown.bold.inside.italic = Prism.util.clone(Prism.languages.markdown.italic), Prism.languages.markdown.italic.inside.bold = Prism.util.clone(Prism.languages.markdown.bold); // prettier-ignore

const HOTKEYS = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+`': 'code',
}



const LIST_TYPES = ['numbered-list', 'bulleted-list']

const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format)
    const isList = LIST_TYPES.includes(format)

    Transforms.unwrapNodes(editor, {
        match: n => LIST_TYPES.includes(n.type),
        split: true,
    })
    // console.log("ISAC", format)
    if(format === "code"){
        !isActive ? Transforms.setNodes(
            editor,
            { type: 'code' },
            { match: n => Editor.isBlock(editor, n) } 
          ) : 
          Transforms.setNodes(
            editor,
            { type: 'paragraph' ,
             children: [] } 
            )
    }
    else {
        Transforms.setNodes(editor, {
            type: isActive ? 'paragraph' : isList ? 'list-item' : format,
        })
    }

    if (!isActive && isList) {
        const block = { type: format, children: [] }
        Transforms.wrapNodes(editor, block)
    }
}

const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format)

    if (isActive) {
        Editor.removeMark(editor, format)
    } else {
        Editor.addMark(editor, format, true)
    }
}

const isBlockActive = (editor, format) => {
    if(!editor.selection) return false
    const [match] = Editor.nodes(editor, {
        match: n =>  n.type === format,
    })

    return !!match
}

const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
}

const Element = ({ attributes, children, element }) => {
    switch (element.type) {
        case 'block-quote':
            return <blockquote {...attributes}>{children}</blockquote>
        case 'bulleted-list':
            return <ul {...attributes}>{children}</ul>
        case 'heading-one':
            return <h1 {...attributes}>{children}</h1>
        case 'heading-two':
            return <h2 {...attributes}>{children}</h2>
        case 'list-item':
            return <li {...attributes}>{children}</li>
        case 'numbered-list':
            return <ol {...attributes}>{children}</ol>
        default:
            return <p {...attributes}>{children}</p>
    }
}

const Leaf = ({ attributes, children, leaf }) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>
    }
    // console.log("LEAF", leaf, attributes, children.props.parent)
    if (leaf.code || (children.props.parent !== undefined && children.props.parent.type == "code")) {
        var classes = "";
        children = <span className={css`
        font-family: monospace;
        
        ${leaf.comment &&
                css`
            color: slategray;
        `} 
        ${(leaf.operator || leaf.url) &&
                css`
            color: #9a6e3a;
        `}
        ${leaf.keyword &&
                css`
            color: #07a;
        `}
        ${(leaf.variable || leaf.regex) &&
                css`
            color: #e90;
        `}
        ${(leaf.number ||
                    leaf.boolean ||
                    leaf.tag ||
                    leaf.constant ||
                    leaf.symbol ||
                    leaf.attr - name ||
                    leaf.selector) &&
                css`
            color: #905;
        `}
        ${leaf.punctuation &&
                css`
            color: #999;
        `}
        ${(leaf.string || leaf.char) &&
                css`
            color: #690;
        `}
        ${(leaf.function || leaf.class - name) &&
                css`
            color: #dd4a68;
        `}
        `}>
        {children}
        </span>
    }

    if (leaf.italic) {
        children = <em>{children}</em>
    }

    if (leaf.underline) {
        children = <u>{children}</u>
    }

    return <span {...attributes} 
    className= {leaf.code ? css`
    background: rgb(212 242 193 / 84%);
    ` : ""}
    >{children}</span>
}

const BlockButton = ({ format, icon }) => {
    const editor = useSlate();
    const logo = <BiCode />
    return (
        <Button
            active={isBlockActive(editor, format)}
            onMouseDown={event => {
                event.preventDefault()
                toggleBlock(editor, format)
            }}
        >
            <Icon>{logo}</Icon>
        </Button>
    )
}

const MarkButton = ({ format, icon }) => {
    const editor = useSlate()
    const logo = icon === 'format_bold' ? <BiBold /> : <BiItalic />
    return (
        <Button
            active={isMarkActive(editor, format)}
            onMouseDown={event => {
                event.preventDefault()
                toggleMark(editor, format)
            }}
        >
            <Icon>{logo}</Icon>
        </Button>
    )
}

// this is stupid
const isJsonObj = (obj) => {
    const str = JSON.stringify(obj);
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}




// Define our app...
const RichTextEditor2 = ({ initialContent, initialLanguage, annotationChangeHandler }) => {
    const initialValue = initialContent && isJsonObj(initialContent) ? initialContent : [
        {
            type:'paragraph',
            children: [{
                text: ''
            }]
        }
    ]

    const [value, setValue] = useState(initialValue)
    const [language, setLanguage] = useState(initialLanguage)
    const renderElement = useCallback(props => {
        switch (props.element.type) {
          case 'code':
            return <CodeElement {...props} />
          default:
            return <Element {...props} />
        }
      }, []);
    const renderLeaf = useCallback(props => <Leaf {...props} />, [])
    const editor = useMemo(() => withHistory(withReact(createEditor())), [])
    

    // Define a React component renderer for our code blocks.
    const CodeElement = props => {
        return (
            <pre {...props.attributes} className="RichEditorCodeBlock">
                <span>{props.children}</span>
            </pre>
        )
    }

    

    const updateValue = (newValue) => {
        let editor = {
            children: newValue,
            language: language
        }
        setValue(newValue);
        annotationChangeHandler(JSON.stringify(editor), JSON.stringify(editor));
    }


    // decorate function depends on the language selected
    const decorate = useCallback(
        ([node, path]) => {
            const ranges = []
            if (!Text.isText(node)) {
                return ranges
            }
            const getLength = token => {
                if (typeof token === 'string') {
                    return token.length
                } else if (typeof token.content === 'string') {
                    return token.content.length
                } else {
                    return token.content.reduce((l, t) => l + getLength(t), 0)
                }
            }
            const tokens = Prism.tokenize(node.text, Prism.languages[language])
            let start = 0

            for (const token of tokens) {
                const length = getLength(token)
                const end = start + length

                if (typeof token !== 'string') {
                    ranges.push({
                        [token.type]: true,
                        anchor: { path, offset: start },
                        focus: { path, offset: end },
                    })
                }

                start = end
            }

            return ranges
        },
        [language]
    )

    return (
        <Slate editor={editor} value={value} onChange={value => updateValue(value)}>
            <div className="RichEditor-root">
                <Toolbar>
                    <MarkButton format="bold" icon="format_bold" />
                    <MarkButton format="italic" icon="format_italic" />
                    <BlockButton format="code" icon="code" />
                </Toolbar>
                <div
                    contentEditable={false}
                    style={{ position: 'relative', top: '5px', right: '5px' }}
                >
                    <div className="language-select">
                        <select
                            value={language}
                            style={{ float: 'right' }}
                            onChange={e => setLanguage(e.target.value)}
                        >
                            <option value="js">JavaScript</option>
                            <option value="css">CSS</option>
                            <option value="html">HTML</option>
                            <option value="python">Python</option>
                            <option value="sql">SQL</option>
                            <option value="java">Java</option>
                            <option value="php">PHP</option>
                        </select>
                    </div>
                </div>
                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder="Enter some rich text…"
                    spellCheck
                    autoFocus
                    onKeyDown={event => {
                        for (const hotkey in HOTKEYS) {
                            if (isHotkey(hotkey, event)) {
                                event.preventDefault()
                                const mark = HOTKEYS[hotkey]
                                toggleMark(editor, mark)
                            }
                        }
                    }}
                    decorate={decorate}
                />
            </div>
        </Slate>
    )
}

// different token types, styles found on Prismjs website
// const Leaf = ({ attributes, children, leaf }) => {
//     return (
//         <span
//             {...attributes}
//             className={css`
//             font-family: monospace;
//             background: hsla(0, 0%, 100%, .5);
//         ${leaf.comment &&
//                 css`
//             color: slategray;
//           `} 
//         ${(leaf.operator || leaf.url) &&
//                 css`
//             color: #9a6e3a;
//           `}
//         ${leaf.keyword &&
//                 css`
//             color: #07a;
//           `}
//         ${(leaf.variable || leaf.regex) &&
//                 css`
//             color: #e90;
//           `}
//         ${(leaf.number ||
//                     leaf.boolean ||
//                     leaf.tag ||
//                     leaf.constant ||
//                     leaf.symbol ||
//                     leaf.attr - name ||
//                     leaf.selector) &&
//                 css`
//             color: #905;
//           `}
//         ${leaf.punctuation &&
//                 css`
//             color: #999;
//           `}
//         ${(leaf.string || leaf.char) &&
//                 css`
//             color: #690;
//           `}
//         ${(leaf.function || leaf.class - name) &&
//                 css`
//             color: #dd4a68;
//           `}
//         `}
//         >
//             {children}
//         </span>
//     )
// }

// const initialValue = [
//     {
//         children: [
//             {
//                 text: '<h1>Hi!</h1>',
//             },
//         ],
//     },
// ]

export default RichTextEditor2;
