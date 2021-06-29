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

import Tooltip from '@material-ui/core/Tooltip';
import { BiComment, BiTask, BiAnchor } from 'react-icons/bi';
import { AiOutlineQuestionCircle, AiOutlineExclamationCircle } from 'react-icons/ai';
import { FaHighlighter } from 'react-icons/fa';


const IconSelector = ({ type }) => {

    if (type === undefined) {
        return (<BiComment />);
    }
    if (type === 'default') return (<BiComment />);
    if (type === 'question') return (<AiOutlineQuestionCircle />);
    if (type === 'to-do') return (<BiTask />);
    if (type === 'highlight') return (<FaHighlighter />);
    if (type === 'issue') return (<AiOutlineExclamationCircle />);
}


class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
    }
    state = {
        value: '',
        suggestions: [],
        dropDownValue: 'Global',
        hits: 0
    }
    highlightSearchWords = (sentence, baseContent) => {
        sentence = Array.isArray(sentence) ? sentence[0] : sentence;
        return typeof sentence === "undefined" ? baseContent : sentence.match(new RegExp('(?<=<em>)(.*?)(?=<\/em>)', 'g'));
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
        var content = suggestion.content;

        if (suggestion.hasOwnProperty("highlight")) {
            if (suggestion.highlight.hasOwnProperty("childAnchor.anchor")) {
                searchAnchorContent = this.highlightSearchWords(suggestion.highlight["childAnchor.anchor"][0], searchAnchorContent);
                anchorContent = suggestion.highlight.hasOwnProperty("childAnchor.anchor") ? suggestion.highlight["childAnchor.anchor"][0].replace(new RegExp('(<em>)|(<\/em>)', 'g'), '') : anchorContent;
            }
            if (suggestion.highlight.content !== undefined) {
                searchContent = this.highlightSearchWords(suggestion.highlight.content, searchContent);
                content = suggestion.highlight.content !== undefined ? suggestion.highlight.content[0].replace(new RegExp('(<em>)|(<\/em>)', 'g'), '') : content;
            }
        }

        console.log("SUGGESTION", suggestion)
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
    }

    onKeyDown = (event) => {
        const input = event.target
        /* enter */
        if (event.keyCode === 13 && input.value.length > 0) {
            event.preventDefault();
            event.stopPropagation();

            // console.log("this was an enter", input.value);
            this.inputRef.current.blur();
            this.ElasticSearch2(input.value)
                .then(res => {
                    const results = res.data.hits.hits.map(h => h._source)
                    this.setState({ hits: res.data.hits.total.value })
                    this.props.searchedSearchCount(res.data.hits.total.value);
                    this.props.handleSearchBarInputText({ suggestion: results, searchState: true })
                })
        }
        /* Backspace clear search */
        else if (event.keyCode === 8 && input.value.length <= 1) {
            // console.log("clearing search result")
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

    doanothersearch = (id) => {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
                let url = tabs[0].url;
                chrome.runtime.sendMessage({
                    msg: 'SEARCH_ELASTIC_BY_ID',
                    id: id,
                    url: url
                },
                    response => {
                        resolve(response.response);
                    });
            });
        });
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
                        // console.log('response is probs messed up', response)
                        resolve(response.response);
                    });
            });
        });
    }

    onSuggestionsFetchRequested = ({ value }) => {
        this.ElasticSearch2(value)
            .then(res => {
                // console.log("THESE RAW REZ", res.data.hits.total.value)
                const results = res.data.hits.hits.map(h => h._source)
                // console.log("THESE RESULTS", results)
                this.setState({ suggestions: results, hits: res.data.hits.total.value })
            })
    }

    onSuggestionsClearRequested = () => {
        this.setState({ suggestions: [], hits: 0 })
        //this.props.searchedSearchCount(0);
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
        this.setState({ suggestions: [], value: '', hits: 0 });
        this.removeSearchCache();
        this.props.resetView();
    }

    changeValue = (text) => {
        this.setState({ dropDownValue: text })
    }

    renderInputComponent = inputProps => {
        const { value, suggestions, dropDownValue } = this.state
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
                        <AiOutlineSearch />
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
        const { value, suggestions } = this.state

        const inputProps = {
            ref: this.inputRef,
            placeholder: 'Search annotations',
            value,
            width: '500000px',
            onKeyDown: this.onKeyDown,
            onChange: this.onChange
        }
        var searchCount = this.state.value.length !== 0 && suggestions.length !== 0 ? this.state.hits : this.props.searchCount;

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