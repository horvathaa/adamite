import React, { useContext } from 'react';
import classNames from 'classnames';
import './SearchBar.css';

const SearchBar = ({
    searchCount,
    searchBarInputText,
    handleSearchBarInputText,
}) => {

    return (
        <div className="SearchBarContainer">
            <input
                // autoFocus
                type="search"
                className={classNames({
                    SearchBarInput: true,
                })}
                placeholder={'🔍 search annotation content here'}
                value={searchBarInputText}
                onChange={(e) => handleSearchBarInputText(e)}
            />
            <div className="SearchResultsCountContainer">
                <div
                    className={classNames({
                        SearchResultsCount: true,
                        NoResults: searchBarInputText.length > 0 && searchCount === 0,
                        Success: searchBarInputText.length > 0 && searchCount === 1,
                        Searching: searchBarInputText.length > 0 && searchCount > 1,

                    })}
                >
                    {searchCount}
                </div>
            </div>
        </div>
    );
};

export default SearchBar;

