import React, { useState } from 'react';
import './FilterSummary.css';
import Tooltip from '@material-ui/core/Tooltip';
import { BiHash, BiChevronUp, BiEraser } from 'react-icons/bi';
import { GiCancel } from 'react-icons/gi';
import classNames from 'classnames';
import expand from '../../../../assets/img/SVGs/expand.svg';

const FilterTagsButtonInnerText = ({ selection, filter, applyFilter, showTagFilter }) => {

    if (!filter.tags.length && !showTagFilter || !filter.tags.length && showTagFilter) {
        return (
            <React.Fragment>
                &nbsp; Tags
            </React.Fragment>
        );
    }
    else if (filter.tags.length && !showTagFilter || filter.tags.length && showTagFilter) {
        return (
            <React.Fragment>
                &nbsp;
                <ul className="TagNames" >
                    {filter.tags.map((tag, idx) => {
                        return (<li key={idx} style={{ display: "inline" }}>
                            {tag}{(filter.tags.length - 1) !== idx ? ',' : '' }&nbsp;
                        </li>);
                    })}
                </ul>
                <div style={{ display: "inline" }} className="FilterIconContainer" onClick={(e) => { e.stopPropagation(); selection.tags = []; applyFilter(selection) }}>
                    <GiCancel className="ClearTags" />
                </div>
            </React.Fragment>
        );
    }
    return null
}



const TagFilter = ({ selection, filter, applyFilter, filterTags, tempSearchCount }) => {

    const [showTagFilter, setshowTagFilter] = useState(false);
    const [tagSet, setTagSet] = useState({});

    const changeTagSet = (val) => {
        setTagSet(val);
    }

    const tagFilterHandler = () => {
        setshowTagFilter(prevTagFilter => !prevTagFilter)
    }

    const tagfilterSetFalse = () => {
        setshowTagFilter(false);
    }

    const handleTagClick = (event) => {
        let tagName = event.target.value;
        if (selection.tags.includes(tagName)) {
            selection.tags = selection.tags.filter(e => e !== tagName);
        }
        else {
            selection.tags.push(tagName);
        }
        applyFilter(selection);
    }
    return (
        <React.Fragment>
            <div className="FilterSection" onClick={() => { tagFilterHandler(); changeTagSet(filterTags()) }}>
                <div className="FilterDropDownSearch FilterBoxes dropdown">
                    <button className="filterDropDown dropdown-toggle btn btn-primary">
                        <div className="FilterIconContainer">
                            <BiHash className="filterReactIcon" />
                        </div>
                        <FilterTagsButtonInnerText
                            selection={selection}
                            filter={filter}
                            applyFilter={applyFilter}
                            showTagFilter={showTagFilter}
                        />
                    </button>
                </div>
            </div>
            <Tooltip title={tempSearchCount + " annotations"} aria-label="annotation count">
                <div className="outerSearchBar">
                    <div className="SearchResultsCountContainer">
                        <div
                            className={classNames({
                                SearchResultsCount: true,
                                NoResults: tempSearchCount === 0,
                                Success: tempSearchCount >= 1,
                                //Searching: suggestions.length > 0 && searchCount > 1,
                            })}
                        >
                            {tempSearchCount}
                        </div>
                    </div>
                </div>
            </Tooltip>
            {showTagFilter ? (
                <div className="FilterByTag" >
                    <hr />
                    <div onClick={tagFilterHandler}>
                        Tags
                    </div>
                    <div className="TagListContainer">
                        <div className="TagButtonsWrapper">
                            {selection.tags.length ? (
                                selection.tags.map((tag, idx) => {
                                    return (
                                        <Tooltip title="[Tag] [occurrences of Tag]" aria-label="annotation count">
                                            <div className="TagButtonPad" key={idx}>
                                                <button value={tag}
                                                    className={
                                                        classNames("Tag " + { selected: selection.tags.includes(tag) })}
                                                    onClick={e => { e.stopPropagation(); handleTagClick(e); }}>

                                                    <React.Fragment>
                                                        {tag} &nbsp;
                                                        {tagSet[tag]}
                                                    </React.Fragment>

                                                </button>
                                            </div>
                                        </Tooltip>
                                    );
                                })
                            ) : (null)}
                        </div>

                        <React.Fragment>
                            <div className="TagButtonsWrapper">
                                {Object.entries(tagSet).map((tagCountPair, idx) => {
                                    if (!selection.tags.includes(tagCountPair[0]))
                                        return (
                                            <div key={idx} className="TagButtonPad">
                                                <button value={tagCountPair[0]}
                                                    className={
                                                        classNames("Tag " + { selected: selection.tags.includes(tagCountPair[0]) })
                                                    }
                                                    onClick={e => { e.stopPropagation(); handleTagClick(e) }}>
                                                    {tagCountPair[0]} &nbsp; {tagCountPair[1]}
                                                </button>
                                            </div>);
                                })}
                            </div>
                            <div className="TagControlWrapper">
                                <div className="TagButtonPad">
                                    <Tooltip title="collapse">
                                        <button className="TagButton" style={{ border: 'none', marginRight: '4px' }} onClick={() => { tagfilterSetFalse() }}  >
                                            <BiChevronUp className="filterReactIcon"></BiChevronUp>
                                        </button>
                                    </Tooltip>
                                </div>
                                <div className="TagButtonPad">
                                    <Tooltip title="Clear">
                                        <button className="btn Cancel-Button TagButton" style={{ padding: '0px 10px' }} onClick={(e) => { e.stopPropagation(); selection.tags = []; applyFilter(selection); tagfilterSetFalse() }}>
                                            <BiEraser className="filterReactIcon" />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        </React.Fragment>

                    </div>
                </div>
            ) : (null)}
        </React.Fragment>
    )
}

export default TagFilter;