import React from 'react';
import './QuestionList.css';

class QuestionList extends React.Component {

    render() {
        const { questions } = this.props;
        return (
            <div className="QuestionContainer">
                <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                    {questions.map((question, idx) => {
                        return (<li key={idx}>{question.content}</li>)
                    })}
                </ul>
            </div>
        );
    }
}

export default QuestionList;