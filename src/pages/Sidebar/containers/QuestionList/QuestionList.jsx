import React from 'react';
import './QuestionList.css';

class QuestionList extends React.Component {

    render() {
        const { questions, currentURL } = this.props;
        return (
            <div className="QuestionContainer">
                <h3 id="MyQuestions">My Questions</h3>
                <hr />
                <ul style={{ margin: 0, padding: '0px 0px 0px 0px', background: 'white' }}>
                    {questions.map((question, idx) => {
                        return (<li key={idx}>
                            <div className="questionItem">
                                <div className="questionAnchor">
                                    {question.anchorContent}
                                    {question.url !== currentURL ? (
                                        <div className="anchorURLContainer">{question.url} </div>) : (null)}
                                </div>
                                {question.content}
                            </div>
                            <hr />
                        </li>)
                    })}
                </ul>
            </div>
        );
    }
}

export default QuestionList;