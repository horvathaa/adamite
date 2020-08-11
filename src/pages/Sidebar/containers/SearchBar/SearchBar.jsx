import React from 'react'
import Autosuggest from 'react-autosuggest'
import { debounce } from 'throttle-debounce'
import '../../../../assets/img/SVGs/search.svg';
import './SearchBar.css';
import '../../../../assets/img/SVGs/Default.svg';
import '../../../../assets/img/SVGs/Highlight.svg';
import '../../../../assets/img/SVGs/Todo.svg';
import '../../../../assets/img/SVGs/Question.svg';
import '../../../../assets/img/SVGs/Issue.svg';
import '../../../../assets/img/SVGs/location.svg';
import Highlighter from "react-highlight-words";


class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
    }
    state = {
        value: '',
        suggestions: []
    }

    // const SearchBar = ({
    //     searchCount,
    //     searchBarInputText,
    //     handleSearchBarInputText,
    // }) => {

    componentWillMount() {
        this.onSuggestionsFetchRequested = debounce(
            500,
            this.onSuggestionsFetchRequested
        )
    }

    iconSelector = (type) => {
        if (type === undefined) return 'search.svg';
        if (type === 'default') return 'Default.svg';
        if (type === 'question') return 'Question.svg';
        if (type === 'to-do') return 'Todo.svg';
        if (type === 'highlight') return 'Highlight.svg';
        if (type === 'issue') return 'Issue.svg';
    }

    renderSuggestion = suggestion => {

        return (
            <React.Fragment>
                <div className="result">
                    <div className="autosuggest-row">
                        <div className="autosuggest-col-sm">
                            <img className="react-autosuggest__icon" src={chrome.extension.getURL(this.iconSelector(suggestion.type))} alt="question annnotation" />
                        </div>
                        <div className="vr">&nbsp;</div>
                        <div className="autosuggest-col-6">
                            <div className="autosuggest-row-inner">
                                <div className="autosuggest-col-6-icon">
                                    <img className="react-autosuggest__anchor-content-icon" src={chrome.extension.getURL("location.svg")} alt="question annnotation" />
                                </div>
                                <div className="autosuggest-col-6">
                                    <em>

                                        <Highlighter
                                            highlightClassName="YourHighlightClass"
                                            searchWords={this.state.value.split(" ")}
                                            autoEscape={true}
                                            textToHighlight={suggestion.anchorContent}
                                        />
                                    </em>
                                </div>
                            </div>
                            <div className="react-autosuggest__user-content">
                                <Highlighter
                                    highlightClassName="YourHighlightClass"
                                    searchWords={this.state.value.split(" ")}
                                    autoEscape={true}
                                    textToHighlight={suggestion.content}
                                />
                            </div>
                            <div className="react-autosuggest__tags">
                                {suggestion.tags.map((items) => {
                                    return <div className="shortCode">{items}</div>
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment >
        )
    }

    onChange = (event, { newValue, suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
        // console.log("this is the event", event.typeArg, method)
        // if (method === 'click') {

        //     console.log("THERE IS THE CLICK!", suggestion, suggestionValue, suggestionIndex, sectionIndex, method)
        // }
        this.setState({ value: newValue })
    }

    onKeyDown = (event) => {
        const input = event.target
        /* enter */
        if (event.keyCode === 13 && input.value.length > 0) {
            event.preventDefault();
            event.stopPropagation();

            console.log("this was an enter", input.value);
            this.inputRef.current.blur();
            this.ElasticSearch2(input.value)
                .then(res => {
                    const results = res.data.hits.hits.map(h => h._source)
                    this.props.handleSearchBarInputText(results)
                    //this.setState({ suggestions: results })
                })
        }
    };

    onClick = () => {
        console.log("this on click")
    }

    onSuggestionSelected = (event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) => {
        console.log("suggestions selected", suggestion, event.target.value, method)
        this.props.handleSearchBarInputText([suggestion])
    }


    ElasticSearch2 = (inputText) => {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                msg: 'SEARCH_ELASTIC',
                userSearch: inputText
            },
                response => {
                    resolve(response.response);
                });
        });
    }

    onSuggestionsFetchRequested = ({ value }) => {
        this.ElasticSearch2(value)
            .then(res => {
                const results = res.data.hits.hits.map(h => h._source)
                console.log("THESE RESULTS", results)
                this.setState({ suggestions: results })
            })
    }

    onSuggestionsClearRequested = () => {
        this.setState({ suggestions: [] })
    }

    render() {
        const { value, suggestions } = this.state

        const inputProps = {
            ref: this.inputRef,
            placeholder: 'Search annotation content here',
            value,
            onKeyDown: this.onKeyDown,
            onChange: this.onChange
        }

        return (
            <div className="SearchBarContainer">
                <Autosuggest
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    onSuggestionSelected={this.onSuggestionSelected}
                    getSuggestionValue={suggestion => suggestion.content}
                    renderSuggestion={this.renderSuggestion}
                    inputProps={inputProps}
                />
            </div>
        )
    }
}

export default SearchBar;


// import React, { useContext } from 'react';
// import classNames from 'classnames';
// import './SearchBar.css';
// import search from '../../../../assets/img/SVGs/search.svg';

// const SearchBar = ({
//     searchCount,
//     searchBarInputText,
//     handleSearchBarInputText,
// }) => {

//     return (
//         <div className="SearchBarContainer">
//             <input
//                 // autoFocus
//                 type="search"
//                 className={classNames({
//                     SearchBarInput: true,
//                 })}
//                 placeholder={'Search annotation content here'}
//                 value={searchBarInputText}
//                 onChange={(e) => handleSearchBarInputText(e)}
//             />
//             <div className="SearchResultsCountContainer">
//                 <div
//                     className={classNames({
//                         SearchResultsCount: true,
//                         NoResults: searchBarInputText.length > 0 && searchCount === 0,
//                         Success: searchBarInputText.length > 0 && searchCount === 1,
//                         Searching: searchBarInputText.length > 0 && searchCount > 1,

//                     })}
//                 >
//                     {searchCount}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default SearchBar;

