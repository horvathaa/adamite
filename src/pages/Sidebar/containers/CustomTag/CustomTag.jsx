import './CustomTag.css';
import React, { Component } from 'react';

class CustomTag extends Component {

    handleDelete = (content) => {
        this.props.deleteTag(content);
    }

    render() {
        const { idx, content, editing } = this.props;
        return (
            <div className="TagContainer">
                <li key={idx} className="Tag">
                    {content} {editing && (
                        <button onClick={_ => this.handleDelete(content)}>x</button>
                    )}
                </li>
            </div>
        )
    }
}

export default CustomTag;