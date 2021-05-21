import React, { Component, useState, useContext, useEffect } from 'react';
import classNames from 'classnames';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';
import { BsFileEarmarkText } from 'react-icons/bs';
import anchorOnPage from '../../../../../../assets/img/SVGs/Anchor_onpage.svg';
import anchorOnOtherPage from '../../../../../../assets/img/SVGs/Anchor_otherpage_1.svg';
import anchorBroken from '../../../../../../assets/img/SVGs/Anchor_broken.svg';
import edit from '../../../../../../assets/img/SVGs/edit.svg';
import trash from '../../../../../../assets/img/SVGs/delet.svg';
import Tooltip from '@material-ui/core/Tooltip';
import '../Annotation.css';
import './Anchor.module.css';
import TagsInput from 'react-tagsinput';
import Autosuggest from 'react-autosuggest'
import AnnotationContext from "../AnnotationContext";




/*
updateAnchorTags

id = ctx.anno.id,
url = ctx.anno.url,
currentUrl = ctx.currentUrl,
collapsed = ctx.collapsed,
isCurrentUser = ctx.isCurrentUser,
replyId = ctx.anno.replyId,
anchorContent = anchor.content,
anchorId = anchor.id,
pageAnchor = anchor.xpath === null,
isOnlyAnchor = ctx.anno.childAnchor.length === 1,
brokenAnchor = ctx.brokenChild.includes(anchor.id);

*/

// Using autocomplete example from react tags... still not working for some reason
//https://github.com/olahol/react-tagsinput/blob/master/example/components/autocomplete.js

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) { return url.split(/[?#]/)[0]; }

const BrokenAnchorComponent = ({ anchorContent, anchorIcon, collapsed }) => {
    return (
        <div
            className={classNames({ AnchorContainer: true, Truncated: collapsed })}>
            <Tooltip title={"broken anchor"} aria-label="annotation count">
                <div className="AnchorIconContainer">
                    {anchorIcon}
                </div>
            </Tooltip>

            <div className="AnchorTextContainer">
                {anchorContent}
            </div>
        </div>
    )
}



const Anchor = ({ anchor, replyIdProp }) => {
    const ctx = useContext(AnnotationContext);
    //tagsIn, anchorContent, pageAnchor, brokenAnchor
    const id = ctx.anno.id,
        url = anchor.url,
        currentUrl = ctx.currentUrl,
        collapsed = ctx.collapsed,
        isCurrentUser = ctx.isCurrentUser,
        replyId = replyIdProp,
        anchorContent = anchor.anchor,
        anchorId = anchor.id,
        pageAnchor = anchor.xpath == null,
        isOnlyAnchor = ctx.anno.childAnchor.length === 1,
        brokenAnchor = ctx.brokenChild.includes(anchor.id);

    const [hovering, setHovering] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [tags, setTags] = useState(anchor.tags ?? []);

    const updateAnchorTags = ({ newTags, childId = null }) => {
        const childAnch = ctx.anno.childAnchor.map((c) => {
            if (c.id !== anchorId) return c;
            let y = c;
            y.tags = newTags;
            return y;
        });
        ctx.updateAnchors(childAnch);
    }
    const deleteAnchor = ({ anchorId }) => {
        const childAnch = ctx.anno.childAnchor.filter((c) => c.id !== anchorId)
        ctx.updateAnchors(childAnch);
    }
    // useEffect(() => {
    // document.addEventListener('keydown', this.keydown, false);
    // if (tags !== tagsIn) setTags(tagsIn);

    // return function cleanup() {
    //     document.removeEventListener('keydown', this.keydown, false);
    // };
    // });

    const handleEvent = ({ isClick = false, isHover, e }) => {

        let message = isClick ? 'ANNOTATION_FOCUS_ONCLICK' : isHover ? 'ANNOTATION_FOCUS' : 'ANNOTATION_DEFOCUS';
        if (id === null) { return; }
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            const taburl = getPathFromUrl(tabs[0].url);
            if (url === taburl) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        msg: message,
                        id: id,
                        replyId: replyId ? replyId : anchorId,
                    }
                );
            }
        });
        if (message === 'ANNOTATION_FOCUS') setHovering(true);
        else if (message === 'ANNOTATION_DEFOCUS') setHovering(false);
    }

    const handleOnEditDone = () => {
        if (tags !== anchor.tags) { console.log('tags', tags, 'anchor.tags', anchor.tags); updateAnchorTags({ newTags: tags, anchorId: anchorId }); }
        setEditMode(false);
    }

    const handleExternalAnchor = async () => {
        console.log('sending', url)
        await chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: url });
    }

    function getAnchorIcon() {
        return (pageAnchor) ?
            <BsFileEarmarkText className="AnchorIcon" />
            : (brokenAnchor && url === currentUrl) ?
                <img src={anchorBroken} className="AnchorIcon" alt='anchor broken' /> :
                (url === currentUrl) ?
                    <img src={anchorOnPage} className="AnchorIcon" alt='anchor on page' /> :
                    <img src={anchorOnOtherPage} className="AnchorIcon" alt='anchor on other page' />;
    }

    let anchorIcon = getAnchorIcon();
    let textClass = collapsed ? "AnchorTextContainer" : "AnchorTextContainerExpanded";

    return (brokenAnchor && url === currentUrl && !pageAnchor) ?
        (<BrokenAnchorComponent anchorContent={anchorContent} anchorIcon={anchorIcon} collapsed={collapsed} />)
        : (
            <div
                className={classNames({ AnchorContainer: true, Truncated: collapsed })}
                onMouseEnter={() => handleEvent({ isClick: false, isHover: true })}
                onMouseLeave={() => handleEvent({ isClick: false, isHover: false })}
                onClick={() => {
                    (pageAnchor || url !== currentUrl) ? handleExternalAnchor() : handleEvent({ isClick: true, isHover: false })
                }}
            >
                <div className="AnchorIconContainer">
                    {anchorIcon}
                </div>

                {url === currentUrl && !pageAnchor ?
                    editMode ?
                        (
                            <div className={textClass}>
                                <div className={textClass}>
                                    {anchorContent}
                                </div>
                                <div className="AnchorTagMenu">
                                    <div className="AnchorTagsList">
                                        <TagsInput value={tags ?? []} onChange={(newTags) => setTags(newTags)} addOnBlur />
                                    </div>
                                    <div className="AnchorTagEdit"
                                        onClick={() => handleOnEditDone()}
                                    >
                                        save
                                    </div>
                                </div>
                            </div>
                        ) : (hovering && isCurrentUser && !collapsed) ? (
                            <div className={textClass}>
                                <div className={textClass}>
                                    {anchorContent}
                                </div>
                                {tags &&
                                    <div className="AnchorTagMenu">
                                        <div className="AnchorTagsList">
                                            {tags.map((t) =>
                                                <div className="AnchorTag">
                                                    {t}
                                                </div>
                                            )}
                                        </div>
                                        <Tooltip title={"Edit Anchor Tags"} aria-label="edit tooltip">
                                            <div className="TopIconContainer" >
                                                <img src={edit} alt="edit annotation" className="profile" id="edit" onClick={() => { setEditMode(true) }} />
                                            </div>
                                        </Tooltip>
                                        {id && ctx.anno.childAnchor.length > 1 &&
                                            <Tooltip title={"Delete Anchor"} aria-label="delete annotation tooltip">
                                                <div className="TopIconContainer" >
                                                    <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={() => deleteAnchor({ anchorId: anchorId })} />
                                                </div>
                                            </Tooltip>}
                                    </div>
                                }
                            </div>
                        ) : (
                            <div className={textClass}>
                                <div className={textClass}>
                                    {anchorContent}
                                </div>
                                {tags &&
                                    <div className="AnchorTagMenu">
                                        <div className="AnchorTagsList">
                                            {tags.map((t) =>
                                                <div className="AnchorTag">
                                                    {t}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                }
                            </div>
                        ) : (
                        <div className={textClass}>
                            {anchorContent}
                            <div className="AnchorUrlContainer" onClick={() => handleExternalAnchor()}>
                                {url}
                            </div>
                        </div>
                    )}
            </div>
        );
}
export default Anchor;

