import React, { Component } from 'react';
import classNames from 'classnames';
import { FaFont, FaExternalLinkAlt } from 'react-icons/fa';
import '../Annotation.css';
import './Anchor.css';

class Anchor extends Component {
    handleOnLocalOnClick = () => {
        if (this.props.id === null) {
            return;
        }
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            if (this.props.url === url) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: 'ANNOTATION_FOCUS_ONCLICK',
                        id: this.props.id,
                    }
                );
            }
        });
    }

    handleOnLocalOnMouseEnter = () => {
        if (this.props.id === null) {
            return;
        }
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            if (this.props.url === url) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: 'ANNOTATION_FOCUS',
                        id: this.props.id,
                    }
                );
            }
        });
    }

    handleOnLocalOnMouseLeave = () => {
        if (this.props.id === null) {
            return;
        }
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            if (this.props.url === url) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: 'ANNOTATION_DEFOCUS',
                        id: this.props.id,
                    }
                );
            }
        });
    }

    handleExternalAnchor(url) {
        chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: url });
    }

    render() {
        const { currentUrl, collapsed, url, anchorContent } = this.props;
        return (
            <div
                className={classNames({
                    AnchorContainer: true,
                    Truncated: collapsed
                })}
                onMouseEnter={this.handleOnLocalOnMouseEnter}
                onMouseLeave={this.handleOnLocalOnMouseLeave}
            >
                <div className="AnchorIconContainer">
                    {currentUrl === url ? (
                        <FaFont className="AnchorIcon" onClick={this.handleOnLocalOnClick} />
                    ) : (<FaExternalLinkAlt className="AnchorIcon" onClick={_ => this.handleExternalAnchor(url)} />)}
                </div>
                {currentUrl === url ? (
                    <div className="AnchorTextContainer">
                        {anchorContent}
                    </div>
                ) : (
                        <div className="AnchorTextContainer">
                            {anchorContent}
                            <div className="AnchorUrlContainer" onClick={_ => this.handleExternalAnchor(url)}>
                                {url}
                            </div>
                        </div>

                    )}
            </div>
        );
    }
}

export default Anchor;