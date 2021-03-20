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



const Anchor = ({ anchor }) => {
    const ctx = useContext(AnnotationContext);

    //tagsIn, anchorContent, pageAnchor, brokenAnchor
    const id = ctx.anno.id,
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

    const [hovering, setHovering] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [tags, setTags] = useState(anchor.tags ?? []);


    useEffect(() => {
        document.addEventListener('keydown', this.keydown, false);
        if (tags !== tagsIn) setTags(tagsIn);

        return function cleanup() {
            document.removeEventListener('keydown', this.keydown, false);
        };
    });

    const handleEvent = ({ isClick, isHover }) => {
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
                        replyId: replyId,
                    }
                );
            }
        });
        if (message === 'ANNOTATION_FOCUS') setHovering(true);
        else if (message === 'ANNOTATION_DEFOCUS') setHovering(false);
    }

    const handleOnEditDone = () => {
        if (tags !== tagsIn) { ctx.updateAnchorTags({ newTags: tags, anchorId: anchorId }); }
        setEditMode(false);
    }

    const handleExternalAnchor = () => {
        chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: url });
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
                onClick={(pageAnchor || url !== currentUrl) ? handleExternalAnchor : handleEvent({ isClick: true, isHover: false })}
            >
                <div className="AnchorIconContainer">
                    {anchorIcon}
                </div>

                {url.includes(currentUrl) && !pageAnchor ?
                    editMode ?
                        (
                            <div className={textClass}>
                                <div className={textClass}>
                                    {anchorContent}
                                </div>
                                <div className="AnchorTagMenu">
                                    <div className="AnchorTagsList">
                                        <TagsInput value={tags ?? []} onChange={(newTags) => setTags(newTags)} />
                                    </div>
                                    <div className="AnchorTagEdit"
                                        onClick={handleOnEditDone}
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
                                        {this.state.childId && !ctx.isOnlyAnchor &&
                                            <Tooltip title={"Delete Anchor"} aria-label="delete annotation tooltip">
                                                <div className="TopIconContainer" >
                                                    <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={() => ctx.deleteAnchor({ anchorId: anchorId })} />
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
                            <div className="AnchorUrlContainer" onClick={this.handleExternalAnchor}>
                                {url}
                            </div>
                        </div>
                    )}
            </div>
        );
}
export default Anchor;




// class Anchor extends Component {

//     state = {
//         broken: false,
//         hovering: false,
//         editMode: false,
//         tags: this.props.tags !== undefined && this.props.tags.length === 0 ? [] : this.props.tags,
//         isCurrentUser: this.props.isCurrentUser,
//         childId: this.props.replyId !== undefined ? this.props.replyId : null,
//     }

//     updateData = () => {
//         let { tags } = this.props;
//         this.setState({ tags })
//     }
//     componentDidMount() {
//         document.addEventListener('keydown', this.keydown, false);
//         this.updateData();
//     }

//     componentDidUpdate(prevProps) {
//         if (prevProps.tags !== this.props.tags) { this.updateData(); }
//     }
//     componentWillUnmount() {
//         document.removeEventListener('keydown', this.keydown, false);
//     }
//     tagsHandleChange = (newTag) => { this.setState({ tags: newTag }) }
//     handleChange(tags) { this.setState({ tags }) }

//     handleOnLocalOnClick = () => {
//         if (this.props.id === null) {
//             return;
//         }
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             const url = getPathFromUrl(tabs[0].url);
//             if (this.props.url === url) {
//                 chrome.tabs.sendMessage(
//                     tabs[0].id,
//                     {
//                         msg: 'ANNOTATION_FOCUS_ONCLICK',
//                         id: this.props.id,
//                         replyId: this.props.replyId,
//                     }
//                 );
//             }
//         });
//     }

//     handleOnLocalOnMouseEnter = () => {

//         if (this.props.id === null) {
//             return;
//         }
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             const url = getPathFromUrl(tabs[0].url);
//             if (this.props.url === url) {
//                 chrome.tabs.sendMessage(
//                     tabs[0].id,
//                     {
//                         msg: 'ANNOTATION_FOCUS',
//                         id: this.props.id,
//                         replyId: this.props.replyId
//                     }
//                 );
//             }
//         });
//         this.setState({ hovering: true, });
//         // console.log(this.state.isCurrentUser, !this.props.collapsed, this.state.hovering);
//     }

//     handleOnLocalOnMouseLeave = () => {
//         if (this.props.id === null) {
//             return;
//         }
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             const url = getPathFromUrl(tabs[0].url);
//             if (this.props.url === url) {
//                 chrome.tabs.sendMessage(
//                     tabs[0].id,
//                     {
//                         msg: 'ANNOTATION_DEFOCUS',
//                         id: this.props.id,
//                         replyId: this.props.replyId
//                     }
//                 );
//             }
//         });
//         this.setState({ hovering: false, });
//     }
//     handleOnEditDone = () => {
//         if (this.props.tags !== this.state.tags) {
//             this.props.updateAnchorTags({ newTags: this.state.tags, childId: this.state.childId });
//         }
//         this.setState({ editMode: false });
//     }
//     handleDelete = () => {
//         // Only allow for child anchors to be deleted
//         if (this.state.childId !== null) {
//             this.props.deleteAnchor({ childId: this.state.childId });
//         }
//         //this.setState({ editMode: false });
//     }


//     handleExternalAnchor = () => {
//         chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: this.props.url });
//     }



//     getAnchorIcon() {

//         const { currentUrl, url, pageAnchor, brokenAnchor, } = this.props;

//         if (pageAnchor) {
//             return <BsFileEarmarkText className="AnchorIcon" />;
//         }

//         if (brokenAnchor && url === currentUrl) {
//             return <img src={anchorBroken} className="AnchorIcon" alt='anchor broken' />;
//         }
//         else if (url === currentUrl) {
//             return <img src={anchorOnPage} className="AnchorIcon" alt='anchor on page' />;
//         }
//         else {
//             return <img src={anchorOnOtherPage} className="AnchorIcon" alt='anchor on other page' />;
//         }
//     }
//     getBrokenAnchorComponent(anchorContent, anchorIcon, collapsed) {
//         return (
//             <div
//                 className={classNames({
//                     AnchorContainer: true,
//                     Truncated: collapsed
//                 })}

//             >
//                 <Tooltip title={"broken anchor"} aria-label="annotation count">
//                     <div className="AnchorIconContainer">
//                         {anchorIcon}
//                     </div>
//                 </Tooltip>

//                 <div className="AnchorTextContainer">
//                     {anchorContent}
//                 </div>
//             </div>
//         )
//     }




//     render() {
//         const { currentUrl, collapsed, url, anchorContent, pageAnchor, brokenAnchor } = this.props;
//         const { tags } = this.state;
//         let anchorIcon = this.getAnchorIcon();
//         if (brokenAnchor && url === currentUrl && !pageAnchor) {
//             return this.getBrokenAnchorComponent(anchorContent, anchorIcon, collapsed);
//         }
//         else {
//             let textClass = collapsed ? "AnchorTextContainer" : "AnchorTextContainerExpanded";
//             return (
//                 <div
//                     className={classNames({ AnchorContainer: true, Truncated: collapsed })}
//                     onMouseEnter={this.handleOnLocalOnMouseEnter}
//                     onMouseLeave={this.handleOnLocalOnMouseLeave}
//                     onClick={(pageAnchor || url !== currentUrl) ? this.handleExternalAnchor : this.handleOnLocalOnClick}
//                 >
//                     <div className="AnchorIconContainer">
//                         {anchorIcon}
//                     </div>

//                     {
//                         url.includes(currentUrl) && !pageAnchor ?
//                             this.state.editMode ?
//                                 (
//                                     <div className={textClass}>
//                                         <div className={textClass}>
//                                             {anchorContent}
//                                         </div>
//                                         <div className="AnchorTagMenu">
//                                             <div className="AnchorTagsList">
//                                                 <TagsInput value={tags ?? []} onChange={this.handleChange.bind(this)} />
//                                             </div>
//                                             <div className="AnchorTagEdit"
//                                                 onClick={this.handleOnEditDone}
//                                             >
//                                                 save
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ) : (this.state.hovering && this.state.isCurrentUser && !collapsed) ? (
//                                     <div className={textClass}>
//                                         <div className={textClass}>
//                                             {anchorContent}
//                                         </div>
//                                         {tags &&
//                                             <div className="AnchorTagMenu">
//                                                 <div className="AnchorTagsList">
//                                                     {tags.map((t) =>
//                                                         <div className="AnchorTag">
//                                                             {t}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                                 <Tooltip title={"Edit Anchor Tags"} aria-label="edit tooltip">
//                                                     <div className="TopIconContainer" >
//                                                         <img src={edit} alt="edit annotation" className="profile" id="edit" onClick={() => { this.setState({ editMode: true }) }} />
//                                                     </div>
//                                                 </Tooltip>
//                                                 {this.state.childId && !this.props.isOnlyAnchor &&
//                                                     <Tooltip title={"Delete Anchor"} aria-label="delete annotation tooltip">
//                                                         <div className="TopIconContainer" >
//                                                             <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={this.handleDelete} />
//                                                         </div>
//                                                     </Tooltip>}
//                                             </div>
//                                         }
//                                     </div>
//                                 ) : (
//                                     <div className={textClass}>
//                                         <div className={textClass}>
//                                             {anchorContent}
//                                         </div>
//                                         {tags &&
//                                             <div className="AnchorTagMenu">
//                                                 <div className="AnchorTagsList">
//                                                     {tags.map((t) =>
//                                                         <div className="AnchorTag">
//                                                             {t}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         }
//                                     </div>
//                                 ) : (
//                                 <div className={textClass}>
//                                     {anchorContent}
//                                     <div className="AnchorUrlContainer" onClick={this.handleExternalAnchor}>
//                                         {url}
//                                     </div>
//                                 </div>
//                             )}
//                 </div>
//             );
//         }
//     }
// }


// export default Anchor;

// class Anchor extends Component {

//     state = {
//         broken: false,
//         hovering: false,
//         editMode: false,
//         tags: this.props.tags !== undefined && this.props.tags.length === 0 ? [] : this.props.tags,
//         isCurrentUser: this.props.isCurrentUser,
//         childId: this.props.replyId !== undefined ? this.props.replyId : null,
//     }

//     updateData = () => {
//         let { tags } = this.props;
//         this.setState({ tags })
//     }
//     componentDidMount() {
//         document.addEventListener('keydown', this.keydown, false);
//         this.updateData();
//     }

//     componentDidUpdate(prevProps) {
//         if (prevProps.tags !== this.props.tags) { this.updateData(); }
//     }
//     componentWillUnmount() {
//         document.removeEventListener('keydown', this.keydown, false);
//     }
//     tagsHandleChange = (newTag) => { this.setState({ tags: newTag }) }
//     handleChange(tags) { this.setState({ tags }) }

//     handleOnLocalOnClick = () => {
//         if (this.props.id === null) {
//             return;
//         }
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             const url = getPathFromUrl(tabs[0].url);
//             if (this.props.url === url) {
//                 chrome.tabs.sendMessage(
//                     tabs[0].id,
//                     {
//                         msg: 'ANNOTATION_FOCUS_ONCLICK',
//                         id: this.props.id,
//                         replyId: this.props.replyId,
//                     }
//                 );
//             }
//         });
//     }

//     handleOnLocalOnMouseEnter = () => {

//         if (this.props.id === null) {
//             return;
//         }
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             const url = getPathFromUrl(tabs[0].url);
//             if (this.props.url === url) {
//                 chrome.tabs.sendMessage(
//                     tabs[0].id,
//                     {
//                         msg: 'ANNOTATION_FOCUS',
//                         id: this.props.id,
//                         replyId: this.props.replyId
//                     }
//                 );
//             }
//         });
//         this.setState({ hovering: true, });
//         // console.log(this.state.isCurrentUser, !this.props.collapsed, this.state.hovering);

//     }

//     handleOnLocalOnMouseLeave = () => {
//         if (this.props.id === null) {
//             return;
//         }
//         chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//             const url = getPathFromUrl(tabs[0].url);
//             if (this.props.url === url) {
//                 chrome.tabs.sendMessage(
//                     tabs[0].id,
//                     {
//                         msg: 'ANNOTATION_DEFOCUS',
//                         id: this.props.id,
//                         replyId: this.props.replyId
//                     }
//                 );
//             }
//         });
//         this.setState({ hovering: false, });
//     }
//     handleOnEditDone = () => {
//         if (this.props.tags !== this.state.tags) {
//             this.props.updateAnchorTags({ newTags: this.state.tags, childId: this.state.childId });
//         }
//         this.setState({ editMode: false });
//     }
//     handleDelete = () => {
//         // Only allow for child anchors to be deleted
//         if (this.state.childId !== null) {
//             this.props.deleteAnchor({ childId: this.state.childId });
//         }
//         //this.setState({ editMode: false });
//     }


//     handleExternalAnchor = () => {
//         chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: this.props.url });
//     }



//     getAnchorIcon() {

//         const { currentUrl, url, pageAnchor, brokenAnchor, } = this.props;

//         if (pageAnchor) {
//             return <BsFileEarmarkText className="AnchorIcon" />;
//         }

//         if (brokenAnchor && url === currentUrl) {
//             return <img src={anchorBroken} className="AnchorIcon" alt='anchor broken' />;
//         }
//         else if (url === currentUrl) {
//             return <img src={anchorOnPage} className="AnchorIcon" alt='anchor on page' />;
//         }
//         else {
//             return <img src={anchorOnOtherPage} className="AnchorIcon" alt='anchor on other page' />;
//         }
//     }
//     getBrokenAnchorComponent(anchorContent, anchorIcon, collapsed) {
//         return (
//             <div
//                 className={classNames({
//                     AnchorContainer: true,
//                     Truncated: collapsed
//                 })}

//             >
//                 <Tooltip title={"broken anchor"} aria-label="annotation count">
//                     <div className="AnchorIconContainer">
//                         {anchorIcon}
//                     </div>
//                 </Tooltip>

//                 <div className="AnchorTextContainer">
//                     {anchorContent}
//                 </div>
//             </div>
//         )
//     }




//     render() {
//         const { currentUrl, collapsed, url, anchorContent, pageAnchor, brokenAnchor } = this.props;
//         const { tags } = this.state;
//         let anchorIcon = this.getAnchorIcon();
//         if (brokenAnchor && url === currentUrl && !pageAnchor) {
//             return this.getBrokenAnchorComponent(anchorContent, anchorIcon, collapsed);
//         }
//         else {
//             let textClass = collapsed ? "AnchorTextContainer" : "AnchorTextContainerExpanded";
//             return (
//                 <div
//                     className={classNames({ AnchorContainer: true, Truncated: collapsed })}
//                     onMouseEnter={this.handleOnLocalOnMouseEnter}
//                     onMouseLeave={this.handleOnLocalOnMouseLeave}
//                     onClick={(pageAnchor || url !== currentUrl) ? this.handleExternalAnchor : this.handleOnLocalOnClick}
//                 >
//                     <div className="AnchorIconContainer">
//                         {anchorIcon}
//                     </div>

//                     {
//                         url.includes(currentUrl) && !pageAnchor ?
//                             this.state.editMode ?
//                                 (
//                                     <div className={textClass}>
//                                         <div className={textClass}>
//                                             {anchorContent}
//                                         </div>
//                                         <div className="AnchorTagMenu">
//                                             <div className="AnchorTagsList">
//                                                 <TagsInput value={tags ?? []} onChange={this.handleChange.bind(this)} />
//                                             </div>
//                                             <div className="AnchorTagEdit"
//                                                 onClick={this.handleOnEditDone}
//                                             >
//                                                 save
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ) : (this.state.hovering && this.state.isCurrentUser && !collapsed) ? (
//                                     <div className={textClass}>
//                                         <div className={textClass}>
//                                             {anchorContent}
//                                         </div>
//                                         {tags &&
//                                             <div className="AnchorTagMenu">
//                                                 <div className="AnchorTagsList">
//                                                     {tags.map((t) =>
//                                                         <div className="AnchorTag">
//                                                             {t}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                                 <Tooltip title={"Edit Anchor Tags"} aria-label="edit tooltip">
//                                                     <div className="TopIconContainer" >
//                                                         <img src={edit} alt="edit annotation" className="profile" id="edit" onClick={() => { this.setState({ editMode: true }) }} />
//                                                     </div>
//                                                 </Tooltip>
//                                                 {this.state.childId && !this.props.isOnlyAnchor &&
//                                                     <Tooltip title={"Delete Anchor"} aria-label="delete annotation tooltip">
//                                                         <div className="TopIconContainer" >
//                                                             <img src={trash} alt="delete annotation" className="profile" id="trash" onClick={this.handleDelete} />
//                                                         </div>
//                                                     </Tooltip>}
//                                             </div>
//                                         }
//                                     </div>
//                                 ) : (
//                                     <div className={textClass}>
//                                         <div className={textClass}>
//                                             {anchorContent}
//                                         </div>
//                                         {tags &&
//                                             <div className="AnchorTagMenu">
//                                                 <div className="AnchorTagsList">
//                                                     {tags.map((t) =>
//                                                         <div className="AnchorTag">
//                                                             {t}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </div>
//                                         }
//                                     </div>
//                                 ) : (
//                                 <div className={textClass}>
//                                     {anchorContent}
//                                     <div className="AnchorUrlContainer" onClick={this.handleExternalAnchor}>
//                                         {url}
//                                     </div>
//                                 </div>
//                             )}
//                 </div>
//             );
//         }
//     }
// }


// export default Anchor;




















/*

 function autocompleteRenderInput({ addTag, ...props }) {
            console.log("ppp")
            //console.log(props)
            const handleOnChange = (e, { newValue, method }) => {
                if (method === 'enter') {
                    e.preventDefault()
                } else {
                    props.onChange(e)
                }
            }
            const inputValue = (props.value && props.value.trim().toLowerCase()) || ''
            const inputLength = inputValue.length
            let suggestions = states().filter((state) => {
                return state.name.toLowerCase().slice(0, inputLength) === inputValue;
            })
            suggestions = getSuggestions(inputValue)
            console.log(suggestions);

            return (
                <Autosuggest
                    suggestions={suggestions}
                    shouldRenderSuggestions={(value) => value && value.trim().length > 0}
                    getSuggestionValue={getSuggestionValue}
                    renderSuggestion={renderSuggestion}
                    inputProps={{ ...props, onChange: handleOnChange }}
                    onSuggestionSelected={(e, { suggestion }) => {
                        addTag(suggestion.name)
                    }}
                    onSuggestionsClearRequested={() => { }}
                    onSuggestionsFetchRequested={(value) => {
                        console.log(value)
                        // this.setState({
                        //     suggestions: getSuggestions(value)
                        // })
                    }}
                />
            )
        }
function getSuggestionValue(suggestion) {
    return suggestion.name;
}

function renderSuggestion(suggestion) {
    console.log(suggestion);
    return (
        <span>{suggestion.name}</span>
    );
}
function escapeRegexCharacters(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function getSuggestions(value) {

    const escapedValue = escapeRegexCharacters(value.trim());

    if (escapedValue === '') {
        return [];
    }
    const inputLength = escapedValue.length
    const regex = new RegExp('^' + escapedValue, 'i');
    let suggestions = states().filter((state) => {
        return state.name.toLowerCase().slice(0, inputLength) === escapedValue
    })
    return suggestions;
}
*/