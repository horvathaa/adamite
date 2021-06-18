import './CustomTag.css';
import React, { Component } from 'react';

class CustomTag extends Component {

    handleDelete = (content) => {
        this.props.deleteTag(content);
    }

    handleTagClick() {
        let tagName = this.props.content;
        chrome.runtime.sendMessage(
            {
                msg: 'FILTER_BY_TAG',
                from: 'content',
                payload: tagName,
            }
        );
    }

    render() {
        const { idx, content, editing } = this.props;
        return (
                <div className="TagContainer">
                    <li key={idx} className="Tag" value={content} onClick={_ => this.handleTagClick()}>
                        #{content} {editing && (
                            <button onClick={_ => this.handleDelete(content)}>x</button>
                        )}
                    </li>
                </div>
        )
    }
}

export default CustomTag;