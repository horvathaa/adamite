import React, { Component } from 'react';
import '../Annotation.css';

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
        const { content, author } = this.props;
        const displayAuthor = author.substring(0, author.indexOf('@'));
        return (
            <div>
                <div className="userProfileContainer">
                    <div className="author">
                        {displayAuthor}
                    </div>
                    <div className="timestamp">
                        {this.formatTimestamp()}
                    </div>
                </div>
                <div className="annotationContent">
                    {content}
                </div>
            </div>
        );
    }
}

export default Reply;
