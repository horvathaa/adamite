

import React from 'react'
import ReactDOM from 'react-dom'
import Autosuggest from 'react-autosuggest'
import { debounce } from 'throttle-debounce'
import '../../../../assets/img/SVGs/search.svg';
import './SearchBar.css';
import '../../../../assets/img/SVGs/Default.svg';
import '../../../../assets/img/SVGs/Highlight.svg';
import '../../../../assets/img/SVGs/Todo.svg';
import '../../../../assets/img/SVGs/Question.svg';
import '../../../../assets/img/SVGs/Issue.svg';


class SearchBar extends React.Component {
    constructor(props) {
        super(props);
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
        console.log("iconselector", type)
        if (type === undefined) return 'search.svg';
        if (type === 'default') return 'Default.svg';
        if (type === 'question') return 'Question.svg';
        if (type === 'to-do') return 'Todo.svg';
        if (type === 'highlight') return 'Highlight.svg';
        if (type === 'issue') return 'Issue.svg';
        console.log("i got nothing")
    }

    renderSuggestion = suggestion => {
        return (
            <div className="result">
                <div className="autosuggest-row">
                    <div className="autosuggest-col-sm">
                        <img className="react-autosuggest__icon" src={chrome.extension.getURL(this.iconSelector(suggestion.type))} alt="question annnotation" />
                    </div>
                    <div className="autosuggest-col-6">
                        <div>{suggestion.content.length > 50 ? suggestion.content.substring(0, 50) + '...' : suggestion.content}</div>
                    </div>
                    <div className="autosuggest-col-sm">
                        <div className="shortCode">{suggestion.matchedAt}</div>
                    </div>
                </div>
            </div>
        )
    }

    onChange = (event, { newValue }) => {
        this.setState({ value: newValue })
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
            placeholder: 'Search annotation content here',
            value,
            onChange: this.onChange
        }
        const renderInputComponent = inputProps => (
            <div>
                <input {...inputProps} />
                <div>custom stuff</div>
            </div>
        );

        return (
            <div className="SearchBarContainer">
                <Autosuggest
                    suggestions={suggestions}
                    onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                    onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                    getSuggestionValue={suggestion => suggestion.fullName}
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

