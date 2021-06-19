import React, { useState, useContext } from 'react';
import classNames from 'classnames';
import { BsFileEarmarkText } from 'react-icons/bs';
import anchorOnPage from '../../../../../../assets/img/SVGs/Anchor_onpage.svg';
import anchorOnOtherPage from '../../../../../../assets/img/SVGs/Anchor_otherpage_1.svg';
import anchorBroken from '../../../../../../assets/img/SVGs/Anchor_broken.svg';
import Tooltip from '@material-ui/core/Tooltip';
import '../Annotation.css';
import './Anchor.module.css';
import TagsInput from 'react-tagsinput';
import AnnotationContext from "../AnnotationContext";
import { BiHash, BiTrash } from 'react-icons/bi';

// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) { return url.split(/[?#]/)[0]; }




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

    const defaultRenderTag = (props) => {
        let { tag, key, disabled, onRemove, classNameRemove, getTagDisplayValue, ...other } = props
        return (
            <span key={key} {...other}>
                {getTagDisplayValue(tag.length > 12 ? tag.slice(0, 12) + "..." : tag)}
                {!disabled &&
                    <a className={classNameRemove} onClick={(e) => onRemove(key)} />
                }
            </span>
        )
    }

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
                        replyId: anchorId,
                    }
                );
            }
        });
        if (message === 'ANNOTATION_FOCUS') setHovering(true);
        else if (message === 'ANNOTATION_DEFOCUS') setHovering(false);
    }

    const handleOnEditDone = () => {
        if (tags !== anchor.tags) { updateAnchorTags({ newTags: tags, anchorId: anchorId }); }
        setEditMode(false);
    }

    const closeTagEdit = () => {
        setTags(anchor.tags);
        setEditMode(false);
    }

    const handleExternalAnchor = async () => {
        await chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: url });
    }

    const AnchorObject = ({ textClass }) => {
        return (
            <React.Fragment>
                <div className={textClass}>
                    {anchorContent}
                </div>
                {currentUrl !== url &&
                    <div className="AnchorUrlContainer" onClick={() => handleExternalAnchor()}>
                        {url}
                    </div>
                }
            </React.Fragment>
        );
    }

    const Anchortags = ({ textClass, tags }) => {

        return (
            <React.Fragment>
                <div className={textClass + " col"}>
                    <AnchorObject textClass={textClass} />
                </div>
                <div className={textClass + " AnchorTagsWrapper"}>
                    {tags &&
                        <div className="AnchorTagMenu">
                            <div className="AnchorTagsList">
                                {tags.map((t) =>
                                    <div className="Tag">
                                        #{t}
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                </div>
            </React.Fragment>
        );

    }

    const EditMode = (textClass) => {
        return (
            <React.Fragment>
                <AnchorObject textClass={textClass} />
                <div className={textClass + " row"}>
                    <div className="AnchorTagInput">
                        <div className="Tag-Container">
                            <div className="TextareaContainer">
                                <TagsInput value={tags ?? []} onChange={(newTags) => setTags(newTags)} renderTag={defaultRenderTag} onlyUnique={true} addOnBlur />
                            </div>
                        </div>

                    </div>
                </div>
                <div className="row">
                    <div className="col-4">
                        <button className="btn AnchorTagButtons AnchorTagButtonCancel" placeholder="Cancel" onClick={() => closeTagEdit()}>
                            Cancel
                        </button>
                    </div>
                    <div className="col-4">
                        <button className="btn AnchorTagButtons AnchorTagButtonSubmit" placeholder="save" onClick={() => handleOnEditDone()}>
                            Add
                        </button>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    const AnchortagsButtons = ({ textClass, id}) => {

        return (
            <React.Fragment>
                <div className={textClass + " col"}>
                    <AnchorObject textClass={textClass} />
                </div>
                {tags &&
                    <React.Fragment>
                        <div className="AnchorTagsList col-2" onClick={() => { setEditMode(true) }}>
                            <Tooltip title={"Edit Anchor Tags"} aria-label="edit tooltip">
                                <div className="AnchorHashTagbutton Tag">
                                    <BiHash alt="edit annotation" className="profile" id="edit" />
                                </div>
                            </Tooltip>
                            {id && ctx.anno.childAnchor.length > 1 &&
                                <Tooltip title={"Delete Anchor Tags"} aria-label="Delete tooltip">
                                    <div className="AnchorHashTagbutton Tag">
                                        <BiTrash alt="delete annotation" className="profile" id="trash" />
                                    </div>
                                </Tooltip>
                            }
                        </div>
                    </React.Fragment>
                }
                <div className={textClass + " AnchorTagsWrapper"}>
                    {tags &&
                        <div className="AnchorTagMenu">
                            <div className="AnchorTagsList">
                                {tags.map((t) =>
                                    <div className="Tag">
                                        #{t}
                                    </div>
                                )}
                            </div>
                        </div>}
                </div>
            </React.Fragment>);
    }

    const AnchorModes = ({textClass}) => {

        if(editMode){
            return ( <EditMode textClass={textClass} /> );
        }
        else if(hovering && isCurrentUser && !collapsed){
            return ( <AnchortagsButtons textClass={textClass} /> );
        }
        else{
            return ( <Anchortags textClass={textClass} /> );
        }
    }

    const BrokenAnchorComponent = ({ anchorContent, anchorIcon, collapsed }) => {
        return (
            <div
                className={classNames({ AnchorContainer: true, Truncated: collapsed })}>
                <Tooltip title={"broken anchor"} aria-label="annotation count">
                    <div className="AnchorIconContainer">
                        {anchorIcon}
                    </div>
                </Tooltip>
                <AnchorObject textClass={textClass} />
            </div>
        )
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
                className={classNames({ AnchorContainer: true, Truncated: collapsed }) + " row"}
                id={anchorId}
                onMouseEnter={() => handleEvent({ isClick: false, isHover: true })}
                onMouseLeave={() => handleEvent({ isClick: false, isHover: false })}
                onClick={() => {
                    ( url !== currentUrl || (pageAnchor && url !== currentUrl )) ? handleExternalAnchor() : handleEvent({ isClick: true, isHover: false })
                }}
            >
                <div className="AnchorIconContainer col-1">
                    {anchorIcon}
                </div>

                <AnchorModes textClass={textClass}/>

            </div>
        );
}
export default Anchor;

