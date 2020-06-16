import './CustomTag.css';
import React, { Component } from 'react';

class CustomTag extends Component {

    handleDelete = (content) => {
        this.props.deleteTag(content);
    }

    handleTagClick(e) {
        let tagName = e.target.value;
        console.log(tagName);
    }

    render() {
        const { idx, content, editing } = this.props;
        return (
            <div className="TagContainer">
                <li key={idx} className="Tag" value={content} onClick={e => this.handleTagClick(e)}>
                    {content} {editing && (
                        <button onClick={_ => this.handleDelete(content)}>x</button>
                    )}
                </li>
            </div>
        )
    }
}

export default CustomTag;