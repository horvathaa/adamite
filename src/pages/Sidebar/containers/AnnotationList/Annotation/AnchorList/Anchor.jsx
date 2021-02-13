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
import TagsInput from 'react-tagsinput';
import Autosuggest from 'react-autosuggest'


function states() {
    return [
        { abbr: 'AL', name: 'Alabama' },
        { abbr: 'AK', name: 'Alaska' },
        { abbr: 'AZ', name: 'Arizona' },
        { abbr: 'AR', name: 'Arkansas' },
        { abbr: 'CA', name: 'California' },
        { abbr: 'CO', name: 'Colorado' },
        { abbr: 'CT', name: 'Connecticut' },
        { abbr: 'DE', name: 'Delaware' },
        { abbr: 'FL', name: 'Florida' },
        { abbr: 'GA', name: 'Georgia' },
        { abbr: 'HI', name: 'Hawaii' },
        { abbr: 'ID', name: 'Idaho' },
        { abbr: 'IL', name: 'Illinois' },
        { abbr: 'IN', name: 'Indiana' },
        { abbr: 'IA', name: 'Iowa' },
        { abbr: 'KS', name: 'Kansas' },
        { abbr: 'KY', name: 'Kentucky' },
        { abbr: 'LA', name: 'Louisiana' },
        { abbr: 'ME', name: 'Maine' },
        { abbr: 'MD', name: 'Maryland' },
        { abbr: 'MA', name: 'Massachusetts' },
        { abbr: 'MI', name: 'Michigan' },
        { abbr: 'MN', name: 'Minnesota' },
        { abbr: 'MS', name: 'Mississippi' },
        { abbr: 'MO', name: 'Missouri' },
        { abbr: 'MT', name: 'Montana' },
        { abbr: 'NE', name: 'Nebraska' },
        { abbr: 'NV', name: 'Nevada' },
        { abbr: 'NH', name: 'New Hampshire' },
        { abbr: 'NJ', name: 'New Jersey' },
        { abbr: 'NM', name: 'New Mexico' },
        { abbr: 'NY', name: 'New York' },
        { abbr: 'NC', name: 'North Carolina' },
        { abbr: 'ND', name: 'North Dakota' },
        { abbr: 'OH', name: 'Ohio' },
        { abbr: 'OK', name: 'Oklahoma' },
        { abbr: 'OR', name: 'Oregon' },
        { abbr: 'PA', name: 'Pennsylvania' },
        { abbr: 'RI', name: 'Rhode Island' },
        { abbr: 'SC', name: 'South Carolina' },
        { abbr: 'SD', name: 'South Dakota' },
        { abbr: 'TN', name: 'Tennessee' },
        { abbr: 'TX', name: 'Texas' },
        { abbr: 'UT', name: 'Utah' },
        { abbr: 'VT', name: 'Vermont' },
        { abbr: 'VA', name: 'Virginia' },
        { abbr: 'WA', name: 'Washington' },
        { abbr: 'WV', name: 'West Virginia' },
        { abbr: 'WI', name: 'Wisconsin' },
        { abbr: 'WY', name: 'Wyoming' }
    ]
}
// helper method from
// https://stackoverflow.com/questions/2540969/remove-querystring-from-url
function getPathFromUrl(url) {
    return url.split(/[?#]/)[0];
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

class Anchor extends Component {

    state = {
        broken: false,
        hovering: false,
        tags: this.props.tags !== undefined && this.props.tags.length === 0 ? [] : this.props.tags,
        suggestions: [],
    }
    updateData = () => {
        let { tags } = this.props;
        this.setState({ tags })
    }
    componentDidMount() {
        document.addEventListener('keydown', this.keydown, false);
        this.updateData();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.tags !== this.props.tags) { this.updateData(); }
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.keydown, false);
    }
    tagsHandleChange = (newTag) => {
        this.setState({ tags: newTag })
    }
    handleChange(tags) {
        this.setState({ tags })
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
        this.setState({ hovering: true });
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
        this.setState({ hovering: false });
    }

    // handleOnClick = ()

    handleExternalAnchor = () => {
        chrome.runtime.sendMessage({ msg: "LOAD_EXTERNAL_ANCHOR", from: 'content', payload: this.props.url });
    }

    render() {
        const { currentUrl, collapsed, url, anchorContent, pageAnchor, brokenAnchor } = this.props;
        const { tags } = this.state;
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
        let anchorIcon;

        if (pageAnchor) {
            anchorIcon = <BsFileEarmarkText className="AnchorIcon" />;
        }

        else if (brokenAnchor && url === currentUrl) {
            anchorIcon = <img src={anchorBroken} className="AnchorIcon" alt='anchor broken' />;
        }
        else if (url === currentUrl) {
            anchorIcon = <img src={anchorOnPage} className="AnchorIcon" alt='anchor on page' />;
        }
        else {
            anchorIcon = <img src={anchorOnOtherPage} className="AnchorIcon" alt='anchor on other page' />;
        }

        if (brokenAnchor && url === currentUrl && !pageAnchor) {
            return (
                <div
                    className={classNames({
                        AnchorContainer: true,
                        Truncated: collapsed
                    })}

                >
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
        else {
            let textClass = collapsed ? "AnchorTextContainer" : "AnchorTextContainerExpanded";
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
                    {url.includes(currentUrl) && !pageAnchor ? this.state.hovering ? (
                        <div className={textClass}>
                            <div className={textClass}>
                                {anchorContent}
                            </div>
                            <TagsInput renderInput={autocompleteRenderInput} value={tags ?? []} onChange={this.handleChange.bind(this)} />
                        </div>
                    ) : (

                        <div className={textClass}>
                            {anchorContent}
                            {tags && tags[0] &&
                                <div className="AnchorTagMenu">
                                    <div className="AnchorTag">
                                        {tags[0]}
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


    }
}

export default Anchor;

/*
onlyUnique={true}
 {tags ?
:

                                <div className="AnchorTagMenu">
                                    <div className="AnchorTag">
                                        add tag
                                </div>
                                </div>
                            }
 updateData = () => {
        let { tags, annotationContent, annotationType } = this.props;

        this.setState({
            tags, elseContent: annotationContent, annotationType: annotationType === undefined ? "Default" : annotationType
        })
    }
    componentDidMount() {
        document.addEventListener('keydown', this.keydown, false);
        this.updateData();
    }

   componentDidUpdate(prevProps) {
        if (prevProps.tags !== this.props.tags || prevProps.annotationContent !== this.props.annotationContent || prevProps.type !== this.props.type) {
            this.updateData();
        }
    }
   componentWillUnmount() {
        document.removeEventListener('keydown', this.keydown, false);
    }

   annotationTagHandler = event => {

    }
    tagsHandleChange = (newTag) => {
        this.setState({ tags: newTag })
    }
<div className="Tag-Container">
                        <div className="row">
                            <div className="TextareaContainer">
                                <TagsInput value={tags} onChange={this.tagsHandleChange} onlyUnique={true} />
                            </div>
                        </div>
                    </div>
*/