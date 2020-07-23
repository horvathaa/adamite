import React, { Component } from 'react';
import profile from '../../../../../../assets/img/SVGs/Profile.svg';
import CustomTag from '../../../CustomTag/CustomTag';
import { FcCheckmark } from 'react-icons/fc';
import '../Annotation.css';
import './Reply.css';

class Reply extends Component {

    formatTimestamp = () => {
        let date = new Date(this.props.timeStamp);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var year = date.getFullYear();
        var month = months[date.getMonth()];
        var day = date.getDate();
        var hour = date.getHours();
        var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        // var sec = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
        var time = hour + ':' + min + ' ' + day + ' ' + month + ' ' + year;
        return time;
    }

    render() {
        const { content, author, idx, tags, answer } = this.props;
        const displayAuthor = author.substring(0, author.indexOf('@'));
        return (
            <React.Fragment>
                {idx !== 0 && <hr className="divider" />}
                <li key={idx} className="ReplyContent">
                    <div className=" container Header">
                        <div className="profileContainer">
                            <img src={profile} alt="profile" className="profile" />
                        </div>
                        <div className="userProfileContainer">
                            <div className="author">
                                {displayAuthor}
                            </div>
                            <div className="timestamp">
                                {this.formatTimestamp()}
                            </div>
                        </div>
                    </div>
                    <div className="annotationContent">
                        {answer !== undefined && answer ? <FcCheckmark /> : (null)}
                        {content}

                    </div>
                    {tags.length ? (
                        <div className="TagRow">
                            <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                                {tags.map((tagContent, idx) => {
                                    return (
                                        <CustomTag idx={idx} content={tagContent} />
                                    )
                                }
                                )}
                            </ul>
                        </div>
                    ) : (null)}
                </li>
            </React.Fragment>
        );
    }
}

export default Reply;
