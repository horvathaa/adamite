import React, { useState, useEffect } from 'react';
import './FilterSummary.css';
import { AiFillClockCircle, AiOutlineCheck, AiOutlineCloseCircle, AiOutlineUsergroupAdd } from 'react-icons/ai';
import { BsChatSquareDots, BsXCircle } from 'react-icons/bs';
import { BiSort } from 'react-icons/bi';
import { GiCancel } from 'react-icons/gi';
import classNames from 'classnames';
import tag from '../../../../assets/img/SVGs/tag.svg';
import { Dropdown } from 'react-bootstrap';
import GroupMultiSelect from './MultiSelect/MultiSelect'
import Tooltip from '@material-ui/core/Tooltip';
import expand from '../../../../assets/img/SVGs/expand.svg';


/** assumes array elements are primitive types
* check whether 2 arrays are equal sets.
* @param  {} a1 is an array
* @param  {} a2 is an array
*/
function areArraysEqualSets(a1, a2) {
    const superSet = {};
    for (const i of a1) {
        const e = i + typeof i;
        superSet[e] = 1;
    }

    for (const i of a2) {
        const e = i + typeof i;
        if (!superSet[e]) {
            return false;
        }
        superSet[e] = 2;
    }

    for (let e in superSet) {
        if (superSet[e] === 1) {
            return false;
        }
    }

    return true;
}

class FilterSummary extends React.Component {

    state = {
        hoverText: "",
        showTagFilter: false,
        tagSelect: false
    }

    selection = {
        siteScope: ['onPage'],
        userScope: ['public'],
        annoType: ['default', 'to-do', 'question', 'highlight', 'issue'],
        timeRange: 'all',
        archive: null,
        tags: []
    }

    tagSet = {}

    componentDidMount() {
        let tagSet = {};
        this.props.getFilteredAnnotations().forEach(annotation => {
            annotation.tags.forEach(tag => {
                if (tagSet.hasOwnProperty(tag)) {
                    tagSet[tag] += 1;
                }
                else {
                    tagSet[tag] = 1;
                }
            });
        })
        this.tagSet = tagSet;
    }

    async handleTagSelect() {
        await this.getTags();
        this.setState({ tagSelect: !this.state.tagSelect })
    }

    async getTags() {
        let tagSet = {};
        await this.props.getFilteredAnnotations().forEach(annotation => {
            annotation.tags.forEach(tag => {
                if (tagSet.hasOwnProperty(tag)) {
                    tagSet[tag] += 1;
                }
                else {
                    tagSet[tag] = 1;
                }
            });
        })
        this.tagSet = tagSet;
    }

    async handleTagClick(event) {
        console.log('in handleTagClick', event)
        let tagName = event.target.value;
        if (this.selection.tags.includes(tagName)) {
            this.selection.tags = this.selection.tags.filter(e => e !== tagName);
        }
        else {
            this.selection.tags.push(tagName);
        }
        this.props.applyFilter(this.selection);
    }

    updateTimeRange = (eventKey, event) => {
        this.selection.timeRange = event.target.getAttribute('data-value');
        this.props.applyFilter(this.selection);
    }

    updateUserScope = (eventKey, event) => {
        this.selection.userScope = [event.target.getAttribute('data-value')];
        this.props.applyFilter(this.selection);
    }

    translateTime = (codedTime) => {
        return codedTime === 'all' ?
            "All Time" :
            "Past " + codedTime.charAt(0).toUpperCase() + codedTime.slice(1);
    }

    updateAnnoType = (eventKey, event) => {
        let choice = event.target.getAttribute('data-value');
        if (choice === 'all') {
            this.selection.annoType = ['default', 'to-do', 'question', 'highlight', 'issue'];
        }
        else if (choice !== 'all' && areArraysEqualSets(this.selection.annoType, ['default', 'to-do', 'question', 'highlight', 'issue'])) {
            this.selection.annoType = [choice];
        }
        else {
            this.selection.annoType.push(choice);
        }
        this.props.applyFilter(this.selection);
    }

    addNewGroup = () => {
        chrome.runtime.sendMessage({
            msg: 'SHOW_GROUP',
            from: 'content',
            payload: {
                uid: this.props.uid,
                // name: groupName
            }
        })
        // const groupName = prompt('Please Enter Your New Group\'s Name', 'example');
        // if (groupName === null || groupName === '') {
        //     return;
        // }
        // else {
        //     console.log(groupName);
        //     chrome.runtime.sendMessage({
        //         msg: 'ADD_NEW_GROUP',
        //         from: 'content',
        //         payload: {
        //             uid: this.props.uid,
        //             name: groupName
        //         }
        //     })
        // }
    }

    createDropDown = (args) => {
        const listItems = args.items.map((option, idx) => {
            let active = args.activeFilter.includes(option.visible) ? true : false
            return <Dropdown.Item key={idx} onSelect={args.updateFunction} data-value={option.value}> {active ? <AiOutlineCheck /> : ""} {option.visible} </Dropdown.Item>
        });

        return (
            <React.Fragment>
                <Dropdown>
                    <Dropdown.Toggle title={args.header} className="filterDropDown">
                        <div className="FilterIconContainer">
                            <args.Icon className="filterReactIcon" />
                        </div>
                        &nbsp; {args.activeFilter}
                    </Dropdown.Toggle>
                    <Dropdown.Menu >
                        <Dropdown.Header>{args.header}</Dropdown.Header>
                        {listItems}
                    </Dropdown.Menu>
                </Dropdown>
            </React.Fragment>
        );
    }

    updateSort = (option, event) => {
        let sort = event.target.getAttribute('data-value');
        this.props.notifySidebarSort(sort);
    }

    handleNotifySidebar = (option) => {
        this.props.updateSidebarGroup(option);
    }

    render() {
        const { filter, groups, currentSort, activeGroup } = this.props;
        let annoType = "";
        if (areArraysEqualSets(filter.annoType, ['default', 'to-do', 'question', 'highlight', 'issue'])) {
            annoType = "All Types";
        }
        else {
            filter.annoType.map((type, idx) => {
                if (idx !== (filter.annoType.length - 1)) {
                    if (type !== 'question' && type !== 'default') {
                        annoType += (type.charAt(0).toUpperCase() + type.slice(1)) + ", ";
                    }
                    else if (type === 'default') {
                        annoType += "Normal, ";
                    }
                    else if (type === 'question') {
                        annoType += "Question/Answer, ";
                    }
                }
                else {
                    if (type !== 'question' && type !== 'default') {
                        annoType += (type.charAt(0).toUpperCase() + type.slice(1));
                    }
                    else if (type === 'question') {
                        annoType += "Question/Answer";
                    }
                    else if (type === 'default') {
                        annoType += "Normal";
                    }
                }
            });
        }

        const clear = (
            <div className="FilterSummaryContainer">
                <div className="FilterSectionRow">
                    <div className="FilterSection">Filters</div>
                    <div className="FilterSection" onClick={this.props.clearSelectedAnno}>
                        Showing selected annotation
                        <div className="FilterIconContainer" onClick={this.props.clearSelectedAnno}>
                            <BsXCircle className="filterReactIcon" />
                        </div>
                    </div>
                    <Tooltip title={this.props.tempSearchCount + " annotations"} aria-label="annotation count">
                        <div className="outerSearchBar">
                            <div className="SearchResultsCountContainer">
                                <div
                                    className={classNames({
                                        SearchResultsCount: true,
                                        NoResults: this.props.tempSearchCount === 0,
                                        Success: this.props.tempSearchCount >= 1,
                                        //Searching: suggestions.length > 0 && searchCount > 1,
                                    })}
                                >
                                    {this.props.tempSearchCount}
                                </div>
                            </div>
                        </div>
                    </Tooltip>
                </div >
            </div>

        )

        if (this.props.showingSelectedAnno) {
            return (clear);
        }
        else {
            return (
                <div className="FilterSummaryContainer">
                    <div className="FilterSectionRow" id="GroupFilterSection">
                        <div className="FilterSection" id="GroupFilterSectionText">Groups</div>
                        <GroupMultiSelect
                            uid={this.props.uid}
                            groups={groups}
                            handleNotifySidebar={this.handleNotifySidebar}
                            addNewGroup={this.addNewGroup}
                        />
                    </div>
                    <div className="FilterSectionRow">
                        <div className="FilterSection" id="FilterSectionText">Filters</div>
                        <div className="FilterSection">
                            {this.createDropDown({
                                Icon: AiFillClockCircle,
                                activeFilter: this.translateTime(filter.timeRange),
                                header: "Posted date",
                                updateFunction: this.updateTimeRange,
                                items: [{ visible: "All Time", value: "all" },
                                { visible: "Past Year", value: "year" },
                                { visible: "Past Month", value: "month" },
                                { visible: "Past Week", value: "week" },
                                { visible: "Past Day", value: "day" }]
                            })}
                        </div>
                        <div className="FilterSection">
                            {this.createDropDown({
                                Icon: BsChatSquareDots,
                                activeFilter: annoType,
                                header: "Annotation Type",
                                updateFunction: this.updateAnnoType,
                                items: [{ visible: "All Types", value: 'all' },
                                { visible: "Normal", value: 'default' },
                                { visible: "Highlight", value: 'highlight' },
                                { visible: "To-do", value: 'to-do' },
                                { visible: "Question", value: 'question' },
                                { visible: "Issue", value: 'issue' }]
                            })}
                        </div>
                        <div className="FilterSection">
                            {this.createDropDown({
                                Icon: BiSort,
                                activeFilter: currentSort === 'page' ? "Page" : "Time",
                                header: "Sort By",
                                updateFunction: this.updateSort,
                                items: [{ visible: "Page", value: 'page' },
                                { visible: "Time", value: 'time' }]
                            })}
                        </div>
                        {this.state.showTagFilter ? (
                            <div className="FilterByTag" >
                                <div onClick={() => this.setState({ showTagFilter: false })}>
                                    Filter By Tag
                                </div>
                                <div className="TagListContainer">
                                    {this.selection.tags.length ? (
                                        this.selection.tags.map(tag => {
                                            return (<div className="TagButtonPad">
                                                <button value={tag}
                                                    className={
                                                        classNames({ TagButton: true, selected: this.selection.tags.includes(tag) })}
                                                    onClick={e => { e.stopPropagation(); this.handleTagClick(e); }}>
                                                    {tag} &nbsp; {this.tagSet[tag]}
                                                </button>
                                            </div>);
                                        })
                                    ) : (null)}
                                    <div className="TagButtonPad">
                                        <button value="chooseTag" className="TagButton" onClick={e => this.handleTagSelect(e)}>
                                            Choose tag(s)
                                </button>
                                    </div>
                                    <React.Fragment>
                                        {Object.entries(this.tagSet).map(tagCountPair => {
                                            if (!this.selection.tags.includes(tagCountPair[0]))
                                                return (<div className="TagButtonPad">
                                                    <button value={tagCountPair[0]} className={
                                                        classNames({ TagButton: true, selected: this.selection.tags.includes(tagCountPair[0]) })}
                                                        onClick={e => { e.stopPropagation(); this.handleTagClick(e) }}>
                                                        {tagCountPair[0]} &nbsp; {tagCountPair[1]}
                                                    </button>
                                                </div>);
                                        })}
                                        <div className="TagButtonPad">
                                            <button className="TagButton" >
                                                <img src={expand} alt="collapse tag list" id="collapseTagList" onClick={() => { this.setState({ showTagFilter: false }) }} />
                                            </button>

                                        </div>
                                        <div className="TagButtonPad">
                                            <button className="btn Cancel-Button TagButton" style={{ padding: '0px 10px' }} onClick={(e) => { e.stopPropagation(); this.selection.tags = []; this.props.applyFilter(this.selection) }}>
                                                <GiCancel />
                                            </button>
                                        </div>
                                    </React.Fragment>

                                </div>
                            </div>
                        ) : (null)}

                        {filter.tags.length && !this.state.showTagFilter ? (
                            <div className={classNames({
                                FilterSection: true,
                                tagFilterNotEnabled: !filter.tags.length
                            })} >
                                <div className="FilterIconContainer">
                                    <img src={tag} alt="tag icon" />
                                </div>
                        &nbsp; &nbsp;
                                <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }} >
                                    {filter.tags.length ? (filter.tags.map((tag, idx) => {
                                        if (idx !== (filter.tags.length - 1)) {
                                            return (<li key={idx} style={{ display: "inline" }}>
                                                {tag},&nbsp;
                                            </li>);
                                        }
                                        else {
                                            return (<li key={idx} style={{ display: "inline" }}>
                                                {tag}
                                                <div style={{ display: "inline" }} className="FilterIconContainer" onClick={(e) => { e.stopPropagation(); this.selection.tags = []; this.props.applyFilter(this.selection) }}>
                                                    <GiCancel />
                                                </div>
                                            </li>);
                                        }
                                    })) : (
                                        "Select Tag"
                                    )}

                                </ul>
                            </div>

                        ) : (null)} {
                            !filter.tags.length && !this.state.showTagFilter ? (
                                <div className={classNames({
                                    FilterSection: true,
                                    tagFilterNotEnabled: !filter.tags.length
                                })} onClick={() => { this.setState({ showTagFilter: !this.state.showTagFilter }) }} >
                                    <div className="FilterIconContainer">
                                        <img src={tag} alt="tag icon" />
                                    </div> &nbsp; &nbsp; Select Tag
                                </div>
                            ) : (null)
                        }
                        <Tooltip title={this.props.tempSearchCount + " annotations"} aria-label="annotation count">
                            <div className="outerSearchBar">
                                <div className="SearchResultsCountContainer">
                                    <div
                                        className={classNames({
                                            SearchResultsCount: true,
                                            NoResults: this.props.tempSearchCount === 0,
                                            Success: this.props.tempSearchCount >= 1,
                                            //Searching: suggestions.length > 0 && searchCount > 1,
                                        })}
                                    >
                                        {this.props.tempSearchCount}
                                    </div>
                                </div>
                            </div>
                        </Tooltip>

                    </div>
                </div>
            );
        }
    }
}

export default FilterSummary;
