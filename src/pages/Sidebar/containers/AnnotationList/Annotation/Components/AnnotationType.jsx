import React, { useContext } from 'react';
import AnnotationContext from "../AnnotationContext";
import '../Annotation.css';
import expand from '../../../../../../assets/img/SVGs/expand.svg'
import Anchor from '../AnchorList/Anchor';
import { SplitButton, Dropdown as BootstrapDropdown } from 'react-bootstrap';


const AnnotationType = () => {
    const ctx = useContext(AnnotationContext);
    const answeredQuestion = ctx.anno.type === 'question' && ctx.anno.howClosed === "Answered";
    const answeredQuestionWithReply = answeredQuestion && ctx.anno.replies !== undefined && ctx.anno.replies.length && ctx.anno.replies.map(r => r.answer).lastIndexOf(true) > -1;
    const answerIndex = answeredQuestionWithReply ? ctx.anno.replies.map(r => r.answer).lastIndexOf(true) : -1;
    const replyAnswer = answeredQuestionWithReply ? ctx.anno.replies[answerIndex] : null;

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
                variant="secondary"
                size="sm"
                title={'howClosed' in ctx.anno ? ctx.anno.howClosed : "Unanswered Question"}
                onSelect={eventKey => ctx.closeOut(eventKey)}
                onClick={() => {
                    if (ctx.anno.howClosed === undefined || ctx.anno.howClosed === "Unanswered Question") ctx.setReplying(true)
                }}
            >
                <BootstrapDropdown.Item className="dropdown-link" onSelect={eventKey => { console.log('click'); ctx.closeOut(eventKey) }} eventKey={"Unanswered Question"}>{"Unanswered Question"}</BootstrapDropdown.Item>
                <BootstrapDropdown.Item className="dropdown-link" onSelect={eventKey => ctx.closeOut(eventKey)} eventKey={"No Longer Relevant"}>{"No Longer Relevant"}</BootstrapDropdown.Item>
                <BootstrapDropdown.Item className="dropdown-link" onSelect={eventKey => ctx.closeOut(eventKey)} eventKey={"Answered"}>{"Answered"}</BootstrapDropdown.Item>
            </SplitButton>
        </div>


    const AnswerContent = answeredQuestionWithReply && <React.Fragment>
        <div className="SeparationRow">
            <div className="ShowHideReplies" >
                <div className="ExpandCollapse">
                    <img src={expand} id="ShowReplies" className="Icon" alt="Answer" />
                </div>
                Answer
            </div>
            <hr className="divider" />
        </div>
        {replyAnswer.anchor !== null && <Anchor
            anchor={replyAnswer.anchor}
        />}
        <div className="annotationContent">
            {replyAnswer.replyContent}
        </div>
    </React.Fragment>

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