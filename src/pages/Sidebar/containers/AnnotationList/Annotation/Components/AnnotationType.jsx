import React, { useContext } from 'react';
import AnnotationContext from "../AnnotationContext";
import '../Annotation.css';
import expand from '../../../../../../assets/img/SVGs/expand.svg'
import Anchor from '../AnchorList/Anchor';
import { SplitButton, Dropdown as BootstrapDropdown } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Text } from 'slate';

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}



const AnnotationType = () => {
    const ctx = useContext(AnnotationContext);
    const answeredQuestion = ctx.anno.type === 'question' && ctx.anno.howClosed === "Answered";
    const answeredQuestionWithReply = answeredQuestion && ctx.anno.replies !== undefined && ctx.anno.replies.length && ctx.anno.replies.map(r => r.answer).lastIndexOf(true) > -1;
    const answerIndex = answeredQuestionWithReply ? ctx.anno.replies.map(r => r.answer).lastIndexOf(true) : -1;
    const replyAnswer = answeredQuestionWithReply ? ctx.anno.replies[answerIndex] : null;
    const pl = replyAnswer && isJson(replyAnswer.replyContent) ? JSON.parse(replyAnswer.replyContent).language : 'js';

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

    const codeComponent = {
        code({node, inline, className, children, ...props }) {
            return !inline ? <SyntaxHighlighter wrapLongLines={true} style={coy} language={pl}  PreTag="div" children={String(children).replace(/\n$/, '')} {...props} /> :
            <code style={{whiteSpace: 'pre-wrap !important' }}  {...props}>
                {children}
            </code>
        }
    }

    const IssueButton = ctx.anno.type === 'issue' && <div> <button className="Issue-Button"
        onClick={_ => ctx.handleExpertReview()}>Flag for Expert Review?</button>
    </div>
    const DoneButton = ctx.anno.type === 'to-do' && <div> <button className="ToDo-Button"
        onClick={_ => ctx.handleDoneToDo(ctx.id)}>Done?</button>
    </div>
    const QuestionAnswerSplitButton = ctx.anno.type === 'question' &&
        <div className="openCloseQuestionRow">
            <SplitButton
                key="openCloseQuestion"
                id="openCloseQuestion"
                className="PostButton"
                variant="secondary"
                size="sm"
                title={'howClosed' in ctx.anno ? ctx.anno.howClosed : "Unanswered Question"}
                onSelect={eventKey => ctx.closeOut(eventKey)}
                onClick={() => {
                    if (ctx.anno.howClosed === undefined || ctx.anno.howClosed === "Unanswered Question") ctx.setReplying(true)
                }}
            >
                <BootstrapDropdown.Header className="AnnotationOptionsTitle">Question Status<hr/></BootstrapDropdown.Header>
                <BootstrapDropdown.Item className="DropdownItemOverwrite" onSelect={eventKey => { ctx.closeOut(eventKey) }} eventKey={"Unanswered Question"}>{"Unanswered Question"}</BootstrapDropdown.Item>
                <BootstrapDropdown.Item className="DropdownItemOverwrite" onSelect={eventKey => ctx.closeOut(eventKey)} eventKey={"No Longer Relevant"}>{"No Longer Relevant"}</BootstrapDropdown.Item>
                <BootstrapDropdown.Item className="DropdownItemOverwrite" onSelect={eventKey => ctx.closeOut(eventKey)} eventKey={"Answered"}>{"Answered"}</BootstrapDropdown.Item>
            </SplitButton>
        </div>


    const AnswerContent = answeredQuestionWithReply ? <React.Fragment>
        <div className="SeparationRow">
        <hr className="divider" />
            <div className="ShowHideReplies" >
                {/* <div className="ExpandCollapse">
                    <img src={expand} id="ShowReplies" className="Icon" alt="Answer" />
                </div> */}
                Answer
            </div>
            
        </div>
        {replyAnswer.anchor !== null && <Anchor
            anchor={replyAnswer.anchor}
        />}
        <div className="annotationContent">
            <ReactMarkdown children={isJson(replyAnswer.replyContent) ? deserializeJson(JSON.parse(replyAnswer.replyContent)) : replyAnswer.replyContent}
            components={codeComponent} />
        </div>
    </React.Fragment> : (null)

    switch (ctx.anno.type) {
        case 'issue':
            return (IssueButton);
        case 'to-do':
            return (DoneButton);
        case 'question':
            if ("howClosed" in ctx.anno && ctx.anno.howClosed === "Answered") {
                return [AnswerContent, QuestionAnswerSplitButton].map(comp => comp)
            }
            else {
                return (QuestionAnswerSplitButton);
            }
        default:
            return null;
    }


};

export default AnnotationType;