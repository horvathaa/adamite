import React, { useState, useEffect } from 'react';
import './FilterSummary.css';
import classNames from 'classnames';
import { GoEye } from 'react-icons/go';
import { AiFillClockCircle, AiOutlineCheck } from 'react-icons/ai';
import { RiGroupLine } from 'react-icons/ri';
import { BiAnchor } from 'react-icons/bi';
import { BsChatSquareDots } from 'react-icons/bs';
import view from '../../../../assets/img/SVGs/view.svg';
import time from '../../../../assets/img/SVGs/time.svg';
import location from '../../../../assets/img/SVGs/location.svg';
import anno_type from '../../../../assets/img/SVGs/anno_type.svg';
import tag from '../../../../assets/img/SVGs/tag.svg';
import { Dropdown } from 'react-bootstrap';
import MultiSelect from 'react-multi-select-component';

const GroupMultiSelect = ({ groups, handleNotifySidebar }) => {
    const [selected, setSelected] = useState(null);
    // console.log('function', updateSidebarGroup);
    const options = groups.map(group => {
        return { label: group.name, value: group.gid };
    });

    function handleSelection(selection) {
        setSelected(selection);
        // console.log('selection', selection, selected);
        handleNotifySidebar(selection);
        // console.log('calling function', handleNotifySidebar);
    }

    return (
        <div>
            <MultiSelect
                options={options}
                value={selected}
                onChange={handleSelection}
                labelledBy={"Select"}
            />
        </div>
    )

}

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

    selection = {
        siteScope: ['onPage'],
        userScope: ['public'],
        annoType: ['default', 'to-do', 'question', 'highlight', 'issue'],
        timeRange: 'all',
        archive: null,
        tags: []
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
        else if (this.selection.annoType.includes(choice)) {
            this.selection.annoType = this.selection.annoType.filter(e => e !== choice);
        } else {
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

    createGroupDropDown = (args) => {
        const listItems = args.items.map((option, idx) => {
            // let active = args.activeFilter.indexOf(option.visible) > -1 ? true : false
            return <Dropdown.Item key={idx} onSelect={_ => { args.updateFunction(option) }} > {option.name} </Dropdown.Item>
        });

        return (
            <React.Fragment>
                <Dropdown>
                    <Dropdown.Toggle title={args.header} className="titleDropDown">
                        <div className="FilterIconContainer">
                            <args.Icon className="filterReactIcon" />
                        </div>
                &nbsp; {args.activeGroup}
                    </Dropdown.Toggle>
                    <Dropdown.Menu >
                        <Dropdown.Header>{args.header}</Dropdown.Header>
                        {listItems}
                        <Dropdown.Divider />
                        <Dropdown.Item key={args.items.length} onSelect={this.addNewGroup} > + New Group </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </React.Fragment>
        );
    }

    createDropDown = (args) => {
        const listItems = args.items.map((option, idx) => {
            let active = args.activeFilter.indexOf(option.visible) > -1 ? true : false
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

    handleNotifySidebar = (option) => {
        this.props.updateSidebarGroup(option);
    }

    render() {
        const { filter, groups, activeGroup } = this.props;
        let annoType = "";
        if (areArraysEqualSets(filter.annoType, ['default', 'to-do', 'question', 'highlight', 'issue'])) {
            annoType = "All Types";
        }
        else {
            filter.annoType.map((type, idx) => {
                if (idx !== (filter.annoType.length - 1)) {
                    if (type !== 'question') {
                        annoType += (type.charAt(0).toUpperCase() + type.slice(1)) + ", ";
                    }
                    else if (type === 'question') {
                        annoType += "Question/Answer, ";
                    }
                }
                else {
                    if (type !== 'question') {
                        annoType += (type.charAt(0).toUpperCase() + type.slice(1));
                    }
                    else if (type === 'question') {
                        annoType += "Question/Answer";
                    }
                }
            });
        }

        return (
            <div className="FilterSummaryContainer">
                <div className="FilterSectionRow">
                    <div className="FilterSection">Groups</div>
                    <GroupMultiSelect groups={groups} handleNotifySidebar={this.handleNotifySidebar} />
                    {/* {this.createGroupDropDown({
                        Icon: RiGroupLine,
                        activeGroup: activeGroup, // need actual logic here
                        header: "Group",
                        updateFunction: (option) => this.props.updateSidebarGroup(option),
                        items: groups
                    })} */}
                </div>
                <div className="FilterSectionRow">
                    <div className="FilterSection">Filters</div>
                    <div className="FilterSection">
                        {this.createDropDown({
                            Icon: GoEye,
                            activeFilter: filter.userScope.includes('public') ? 'Anyone' : 'Only Me',
                            header: "Post Type",
                            updateFunction: this.updateUserScope,
                            items: [{ visible: "Anyone", value: 'public' }, { visible: "Only Me", value: 'onlyMe' }]
                        })}
                    </div>
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
                    {filter.tags.length ? (
                        <div className="FilterSection">
                            <div className="FilterIconContainer">
                                <img src={tag} alt="tag icon" />
                            </div>
                        &nbsp; &nbsp; <ul style={{ margin: 0, padding: '0px 0px 0px 0px' }}>
                                {filter.tags.map((tag, idx) => {
                                    if (idx !== (filter.tags.length - 1)) {
                                        return (<li key={idx} style={{ display: "inline" }}>
                                            {tag},&nbsp;
                                        </li>);
                                    }
                                    else {
                                        return (<li key={idx} style={{ display: "inline" }}>
                                            {tag}
                                        </li>);
                                    }
                                })}
                            </ul>
                        </div>
                    ) : (null)}
                </div>
            </div >



        );

    }
}

export default FilterSummary;