import React, { Component } from 'react';
import classNames from 'classnames';
import { FaFont, FaExternalLinkAlt } from 'react-icons/fa';
import '../Annotation.css';

class Anchor extends Component {

    render() {
        const { currentUrl, collapsed, url, anchorContent } = this.props;
        return (
            <div
                className={classNames({
                    AnchorContainer: true,
                    Truncated: collapsed
                })}
            >
                <div className="AnchorIconContainer">
                    {currentUrl === url ? (
                        <FaFont className="AnchorIcon" />
                    ) : (<FaExternalLinkAlt className="AnchorIcon" onClick={_ => this.handleExternalAnchor(url)} />)}
                </div>
                <div className="AnchorTextContainer">
                    {anchorContent}
                </div>
            </div>
        );
    }
}

export default Anchor;