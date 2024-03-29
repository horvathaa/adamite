import React from 'react'
import Autosuggest from 'react-autosuggest'
import { debounce } from 'throttle-debounce'
import { Dropdown } from 'react-bootstrap';
import '../../../../assets/img/SVGs/search.svg';
import './SearchBar.css';
import '../../../../assets/img/SVGs/Default.svg';
import '../../../../assets/img/SVGs/Highlight.svg';
import '../../../../assets/img/SVGs/Todo.svg';
import '../../../../assets/img/SVGs/Question.svg';
import '../../../../assets/img/SVGs/Issue.svg';
import '../../../../assets/img/SVGs/location.svg';
import Highlighter from "react-highlight-words";
import { AiOutlineSearch, AiOutlineCloseCircle } from 'react-icons/ai';
import { BiWorld, BiWindow, BiLayer } from 'react-icons/bi';
import { Text } from 'slate';
import Tooltip from '@material-ui/core/Tooltip';
import { BiComment, BiTask, BiAnchor } from 'react-icons/bi';
import { AiOutlineQuestionCircle, AiOutlineExclamationCircle } from 'react-icons/ai';
import { FaHighlighter } from 'react-icons/fa';
import { string } from 'prop-types';
import loading from '../../../../assets/img/iframe-background.gif';

const annoTypes = ['default', 'question', 'to-do', 'highlight', 'issue'];

const isJson = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


const IconSelector = ({ type }) => {

    if (type === undefined || !annoTypes.includes(type.toLowerCase())) {
        return (<BiComment />);
    }
    if (type.toLowerCase() === 'default') return (<BiComment />);
    if (type.toLowerCase() === 'question') return (<AiOutlineQuestionCircle />);
    if (type.toLowerCase() === 'to-do') return (<BiTask />);
    if (type.toLowerCase() === 'highlight') return (<FaHighlighter />);
    if (type.toLowerCase() === 'issue') return (<AiOutlineExclamationCircle />);
}


class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
    }

    deserializeJsonIntoPlainText = (node) => {
        if (Text.isText(node)) {
            let string = node.text;
            if (node.bold && node.italic && string !== "") {
                string = `***${string}***`
            }
            else if (node.bold && string !== "") {
                string = `**${string}**`
            }
            else if (node.italic && string !== "") {
                string = `*${string}*`
            }
            if (node.code) {
                string = `\`${string}\``
            }

            return string
        }
        if (!node.children) {
            return string;
        }
        const children = node.children.map(n => this.deserializeJsonIntoPlainText(n)).join('');
        switch (node.type) {
            case 'paragraph':
                return `\n${children}\n`
            case 'link':
                return `[${children}](${escapeHtml(node.url)})`
            case 'code': {
                return `\t${children}\n`
            }
            default:
                return children
        }
    }

    state = {
        value: '',
        suggestions: [],
        dropDownValue: 'Global',
        hits: 0,
        isLoading: true
    }
    highlightSearchWords = (sentence, baseContent) => {
        sentence = Array.isArray(sentence) ? sentence[0] : sentence;
        return typeof sentence === "undefined" || typeof sentence !== 'string' ? baseContent : sentence.match(new RegExp('(?<=<em>)(.*?)(?=<\/em>)', 'g'));
    }

    componentDidMount() {
        this.onSuggestionsFetchRequested = debounce(
            300,
            this.onSuggestionsFetchRequested
        )
    }

    renderSuggestion = suggestion => {
        var searchAnchorContent = this.state.value.split(" ");
        var anchorContent = suggestion.childAnchor[0].anchor;
        var searchContent = this.state.value.split(" ");
        var content = isJson(suggestion.content) ? this.deserializeJsonIntoPlainText(JSON.parse(suggestion.content)) : suggestion.content;

        if (suggestion.hasOwnProperty("highlight")) {
            if (suggestion.highlight.hasOwnProperty("childAnchor.anchor")) {
                searchAnchorContent = this.highlightSearchWords(suggestion.highlight["childAnchor.anchor"][0], searchAnchorContent);
                anchorContent = suggestion.highlight.hasOwnProperty("childAnchor.anchor") ? suggestion.highlight["childAnchor.anchor"][0].replace(new RegExp('(<em>)|(<\/em>)', 'g'), '') : anchorContent;
            }
            if (suggestion.highlight.content !== undefined) {
                if (isJson(suggestion.highlight.content) && searchContent.includes(JSON.parse(suggestion.highlight.content).language.replace(new RegExp('(<em>)|(<\/em>)', 'g'), ''))) {
                    content = content;
                }
                else if (isJson(suggestion.highlight.content)) {
                    searchContent = this.highlightSearchWords(this.deserializeJsonIntoPlainText(suggestion.highlight.content), searchContent);
                    content = content;
                }
                else {
                    searchContent = this.highlightSearchWords(suggestion.highlight.content, searchContent);
                    content = suggestion.highlight.content !== undefined ? suggestion.highlight.content[0].replace(new RegExp('(<em>)|(<\/em>)', 'g'), '') : content;
                }
            }
        }

        if (!("tags" in suggestion)) {
            suggestion.tags = [];
        }
        return (
            <React.Fragment>
                <div className="autosuggest-row">
                    <div className="autosuggest-col-6">
                        <Tooltip title={"Author"} aria-label="Author">
                            <div className="Tag TypeTag TypeAuthor">{suggestion.author}</div>
                        </Tooltip>

                        <Tooltip title={"Annotation Type"} aria-label="Annotation Type">
                            <div className="Tag TypeTag">
                                {suggestion.type}&nbsp;
                                <IconSelector type={suggestion.type} />
                            </div>
                        </Tooltip>


                        <div className="autosuggest-row-inner AnchorContainer">
                            <div className="autosuggest-col-6-icon">
                                <BiAnchor className="react-autosuggest__anchor-content-icon" />
                            </div>
                            <div className="autosuggest-col-6 AnchorSuggestContent">
                                <Highlighter
                                    highlightClassName="highlight-adamite-search-suggest"
                                    searchWords={searchAnchorContent}
                                    autoEscape={true}
                                    textToHighlight={suggestion.hasOwnProperty("highlight") && suggestion.highlight.hasOwnProperty("childAnchor.anchor") ? suggestion.highlight["childAnchor.anchor"][0].replace(new RegExp('(<em>)|(<\/em>)', 'g'), '') : anchorContent}
                                />
                            </div>
                        </div>
                        <div className="react-autosuggest__user-content">
                            <Highlighter
                                highlightClassName="YourHighlightClass"
                                searchWords={searchContent}
                                autoEscape={true}
                                textToHighlight={content}
                            />
                        </div>
                        <div className="react-autosuggest__tags">
                            {"tags" in suggestion && (
                                suggestion.tags.map((items, idx) => {
                                    return <div key={idx} className="Tag">#{items}</div>
                                })
                            )}
                        </div>

                    </div>
                </div>
            </React.Fragment >
        )
    }

    onChange = (event, { newValue, suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
        if (method !== 'click' && method !== 'enter') {
            this.setState({ value: newValue })
        }
        if (newValue === "") {
            this.setState({ isLoading: true })
        }
    }

    onKeyDown = (event) => {
        const input = event.target
        /* enter */
        if (event.keyCode === 13 && input.value.length > 0) {
            event.preventDefault();
            event.stopPropagation();

            this.inputRef.current.blur();
            this.ElasticSearch2(input.value)
                .then(res => {
                    this.setState({ hits: res.hits, isLoading: false})
                    this.props.searchedSearchCount(res.hit);
                    this.props.handleSearchBarInputText({ suggestion: res.results, searchState: true, hits: res.hits })
                })
        }
        else if(event.keyCode === 8 && input.value.length > 0){
            this.setState({ isLoading: true})
        }
        /* Backspace clear search */
        else if (event.keyCode === 8 && input.value.length <= 1) {
            this.closeButton();
        }
    };

    onClick = () => {
        // console.log("this on click")
    }

    onSuggestionSelected = (event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
        this.props.searchedSearchCount(1);
        this.removeSearchCache();
        this.props.handleSearchBarInputText({ suggestion: [suggestion], searchState: false })

    }


    ElasticSearch2 = (inputText) => {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                let url = tabs[0].url;
                // use `url` here inside the callback because it's asynchronous!
                // console.log("THIS IS THE WINDOW", new URL(tabs[0].url), tabs[0])
                chrome.runtime.sendMessage({
                    msg: 'SEARCH_ELASTIC',
                    pageVisibility: this.state.dropDownValue,
                    url: url,
                    hostname: new URL(tabs[0].url).hostname,
                    userSearch: inputText
                },
                    response => {
                        resolve(response.response);
                    });
            });
        });
    }

    onSuggestionsFetchRequested = ({ value }) => {
        this.ElasticSearch2(value)
            .then(res => {
                // this.setState({ suggestions: res.results, hits: res.hits })
                this.setState({ suggestions: res.results, hits: res.hits, isLoading: false })
            })
    }

    onSuggestionsClearRequested = () => {
        this.setState({ suggestions: [], hits: 0, isLoading: true })
    }

    removeSearchCache = () => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
            let url = tabs[0].url;
            chrome.runtime.sendMessage({
                msg: 'REMOVE_PAGINATION_SEARCH_CACHE',
                url: url,
            });
        });
    }

    closeButton = () => {
        this.setState({ suggestions: [], value: '', hits: 0, isLoading: true });
        this.removeSearchCache();
        this.props.resetView();
    }

    changeValue = (text) => {
        this.setState({ dropDownValue: text })
    }

    renderInputComponent = inputProps => {
        const { value, suggestions, dropDownValue, isLoading } = this.state
        let clearButton;
        if (value.length > 0) {
            clearButton = (
                <AiOutlineCloseCircle
                    className="close-icon"
                    onClick={this.closeButton}
                />
            );
        }

        let icon;
        if (dropDownValue === 'Global') {
            icon = <BiWorld className="SearchIcon" />;
        }
        else if (dropDownValue === 'Across Site') {
            icon = <BiLayer className="SearchIcon" />;
        }
        else if (dropDownValue === 'On Page') {
            icon = <BiWindow className="SearchIcon" />;
        }

        return (
            <React.Fragment >
                <div className={`SearchBarContainer ${suggestions.length === 0 || value.length === 0 ? '' : 'SearchBarContainer--open'}`} >
                    <div>
                        {isLoading && value !== "" ?
                            <img className="loading-icon" src={loading} alt="loading..." />
                            : <AiOutlineSearch />
                        }
                    </div>
                    <input {...inputProps} />
                    <div className="close-icon-container">
                        {clearButton}
                    </div>
                    <div className="vertical-bar"></div>
                    <Dropdown alignRight>
                        <Dropdown.Toggle id="dropdown-basic" title={dropDownValue} className="SearchBar--Dropdown">
                            {icon}
                            {dropDownValue}


                        </Dropdown.Toggle>
                        <Dropdown.Menu >
                            <Dropdown.Item className="DropdownItemOverwrite">
                                <div onClick={(e) => this.changeValue(e.target.textContent)}>
                                    <BiWorld className="SearchIcon" />
                                    Global

                                </div>
                            </Dropdown.Item>
                            <Dropdown.Item className="DropdownItemOverwrite">
                                <div onClick={(e) => this.changeValue(e.target.textContent)}>
                                    <BiWindow className="SearchIcon" />
                                    On Page
                                </div>
                            </Dropdown.Item>
                            <Dropdown.Item className="DropdownItemOverwrite">
                                <div onClick={(e) => this.changeValue(e.target.textContent)}>
                                    <BiLayer className="SearchIcon" />
                                    Across Site
                                </div>

                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </React.Fragment >
        );
    };

    render() {
        const { value, suggestions, isLoading } = this.state

        const inputProps = {
            ref: this.inputRef,
            placeholder: 'Search annotations',
            value,
            width: '500000px',
            onKeyDown: this.onKeyDown,
            onChange: this.onChange
        }


        return (
            <React.Fragment >
                <div className="AutosuggestSearchBar">
                    <Autosuggest
                        suggestions={suggestions}
                        renderInputComponent={this.renderInputComponent}
                        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                        onSuggestionSelected={this.onSuggestionSelected}
                        getSuggestionValue={suggestion => suggestion.content}
                        renderSuggestion={this.renderSuggestion}
                        inputProps={inputProps}
                    />
                </div>
            </React.Fragment >

        )
    }
}

export default SearchBar;