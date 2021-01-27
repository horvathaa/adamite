import React, { Component } from 'react';
import classNames from 'classnames';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';
import { BsFileEarmarkText } from 'react-icons/bs';
import anchorOnPage from '../../../../../../assets/img/SVGs/Anchor_onpage.svg';
import anchorOnOtherPage from '../../../../../../assets/img/SVGs/Anchor_otherpage_1.svg';
import anchorBroken from '../../../../../../assets/img/SVGs/Anchor_broken.svg';
import Tooltip from '@material-ui/core/Tooltip';
import '../Annotation.css';
import './Anchor.css';

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
}

class Anchor extends Component {

    state = {
        broken: false
    }

    handleOnLocalOnClick = () => {
        if (this.props.id === null) {
            return;
        }
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            const url = getPathFromUrl(tabs[0].url);
            if (this.props.url === url) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: 'ANNOTATION_FOCUS_ONCLICK',
                        id: this.props.id,
                        replyId: this.props.replyId,
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
            const url = getPathFromUrl(tabs[0].url);
            if (this.props.url === url) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: 'ANNOTATION_FOCUS',
                        id: this.props.id,
                        replyId: this.props.replyId
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
            const url = getPathFromUrl(tabs[0].url);
            if (this.props.url === url) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: 'ANNOTATION_DEFOCUS',
                        id: this.props.id,
                        replyId: this.props.replyId
                    }
                );
            }
        });
    }

    // handleOnClick = ()

    handleExternalAnchor = () => {
        chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: this.props.url });
    }

    render() {
        const { currentUrl, collapsed, url, anchorContent, pageAnchor, brokenAnchor } = this.props;

        let anchorIcon;

        if (pageAnchor) {
            anchorIcon =
                (
                    <Tooltip title={"Page level annotation"} aria-label="page level annotation">
                        <BsFileEarmarkText className="AnchorIcon" />
                    </Tooltip >
                )

        }

        else if (brokenAnchor && url === currentUrl) {
            anchorIcon = (
                <Tooltip title={"broken anchor"} aria-label="broken anchor">
                    <img src={anchorBroken} className="AnchorIcon" alt='anchor broken' />
                </Tooltip>)
        }
        else if (url === currentUrl) {
            anchorIcon = (<Tooltip title={'Scroll to annotation on page'} aria-label="annotation anchor on page">
                <img src={anchorOnPage} className="AnchorIcon" alt='anchor on page' />
            </Tooltip>)
        }
        else {
            anchorIcon = (
                <Tooltip title={"Open annotation in new tab"} aria-label="external page annotation anchor">
                    <img src={anchorOnOtherPage} className="AnchorIcon" alt='anchor on other page' />
                </Tooltip>)
        }

        if (brokenAnchor && url === currentUrl && !pageAnchor) {
            return (
                <div
                    className={classNames({
                        AnchorContainer: true,
                        Truncated: collapsed
                    })}

                >
                    <div className="AnchorIconContainer">
                        {anchorIcon}
                    </div>

                    <div className="AnchorTextContainer">
                        {anchorContent}
                    </div>
                </div>
            )
        }
        else {
            return (
                <div
                    className={classNames({
                        AnchorContainer: true,
                        Truncated: collapsed
                    })}
                    onMouseEnter={this.handleOnLocalOnMouseEnter}
                    onMouseLeave={this.handleOnLocalOnMouseLeave}
                    onClick={(pageAnchor || url !== currentUrl) ? this.handleExternalAnchor : this.handleOnLocalOnClick}
                >
                    <div className="AnchorIconContainer">
                        {anchorIcon}
                    </div>
                    {url.includes(currentUrl) && !pageAnchor ? (
                        <div className="AnchorTextContainer">
                            {anchorContent}
                        </div>
                    ) : (

                            <div className="AnchorTextContainer">
                                {anchorContent}
                                <div className="AnchorUrlContainer" onClick={this.handleExternalAnchor}>
                                    {url}
                                </div>
                            </div>
                        )
                    }
                </div >
            );
        }


    }
}

export default Anchor;