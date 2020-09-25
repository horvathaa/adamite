import React from 'react';
import './FilterSummary.css';
import classNames from 'classnames';
import { GoEye } from 'react-icons/go';
import { AiFillClockCircle, AiOutlineCheck } from 'react-icons/ai';
import { BiAnchor } from 'react-icons/bi';
import { BsChatSquareDots } from 'react-icons/bs';
import view from '../../../../assets/img/SVGs/view.svg';
import time from '../../../../assets/img/SVGs/time.svg';
import location from '../../../../assets/img/SVGs/location.svg';
import anno_type from '../../../../assets/img/SVGs/anno_type.svg';
import tag from '../../../../assets/img/SVGs/tag.svg';
import { Dropdown } from 'react-bootstrap';


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
        annoType: ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'],
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

    updateAnnoType = (eventKey, event) => {
        let choice = event.target.getAttribute('data-value');
        if (choice === 'all') {
            this.selection.annoType = ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'];
        }
        else if (this.selection.annoType.includes(choice)) {
            this.selection.annoType = this.selection.annoType.filter(e => e !== choice);
        } else {
            this.selection.annoType.push(choice);
        }
        this.props.applyFilter(this.selection);
    }

    createDropDown = (args) => {
        const listItems = args.items.map((option, idx) => {
            let active = option.visible === args.activeFilter ? true : false;
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

    render() {
        const { filter } = this.props;

        const userScope = filter.userScope.includes('public') ? 'Anyone' : 'Only Me';

        let siteScope = "";
        if (filter.siteScope.includes('onPage') && filter.siteScope.includes('acrossWholeSite')) {
            siteScope = "On Page + Across Whole Site";
        }
        else if (filter.siteScope.includes('onPage')) {
            siteScope = "On Page";
        }
        else if (filter.siteScope.includes('acrossWholeSite')) {
            siteScope = "Across Whole Site";
        }

        let timeRange = "";
        if (filter.timeRange === 'day') {
            timeRange = "Past Day";
        }
        else if (filter.timeRange === 'week') {
            timeRange = "Past Week";
        }
        else if (filter.timeRange === 'month') {
            timeRange = "Past Month";
        }
        else if (filter.timeRange === 'year') {
            timeRange = "Past Year";
        }
        else if (filter.timeRange === 'all') {
            timeRange = "All Time";
        }
        else if (filter.timeRange === 'custom') {
            timeRange = "Custom Time Range";
        }

        let annoType = "";
        if (areArraysEqualSets(filter.annoType, ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'])) {
            annoType = "All Types";
        }
        else {
            filter.annoType.map((type, idx) => {
                if (idx !== (filter.annoType.length - 1)) {
                    if (type !== 'question' && type !== 'navigation') {
                        annoType += (type.charAt(0).toUpperCase() + type.slice(1)) + ", ";
                    }
                    else if (type === 'question') {
                        annoType += "Question/Answer, ";
                    }
                }
                else {
                    if (type !== 'question' && type !== 'navigation') {
                        annoType += (type.charAt(0).toUpperCase() + type.slice(1));
                    }
                    else if (type === 'question') {
                        annoType += "Question/Answer";
                    }
                }
            });
        }

        return (
            //onClick={this.props.openFilter}
            <div className="FilterSummaryContainer">
                <div className="FilterSectionRow">
                    <div className="FilterSection">Filters</div>
                    <div className="FilterSection">
                        {this.createDropDown({
                            Icon: GoEye,
                            activeFilter: userScope,
                            header: "Post Type",
                            updateFunction: this.updateUserScope,
                            items: [{ visible: "Anyone", value: 'public' }, { visible: "Only Me", value: 'onlyMe' }]
                        })}

                        {/* <div className="FilterIconContainer">

                            <img src={view} alt="author view icon" />
                        </div>
                        &nbsp; {userScope} */}
                    </div>
                    <div className="FilterSection">
                        {this.createDropDown({
                            Icon: AiFillClockCircle,
                            activeFilter: timeRange,
                            header: "Posted date",
                            updateFunction: this.updateTimeRange,
                            items: [{ visible: "All Time", value: "all" },
                            { visible: "Past Year", value: "year" },
                            { visible: "Past Month", value: "month" },
                            { visible: "Past Week", value: "week" },
                            { visible: "Past Day", value: "day" }]
                        })}
                    </div>
                    {/* <div className="FilterSection">
                        {this.createDropDown({ Icon: BiAnchor, activeFilter: siteScope, header: "Anchor Location", items: ["Global", "On Page", "Across Site"] })}

                </div> */}
                    <div className="FilterSection">
                        {this.createDropDown({
                            Icon: BsChatSquareDots,
                            activeFilter: annoType,
                            header: "Annotation Type",
                            updateFunction: this.updateAnnoType,
                            items: [{ visible: "All Types", value: 'all' },
                            { visible: "Normal", value: 'default' },
                            { visible: "Empty", value: 'highlight' },
                            { visible: "To-do", value: 'to-do' },
                            { visible: "Question", value: 'question' },
                            { visible: "Issue", value: 'issue' }]
                        })}

                        {/* <div className="FilterIconContainer">
                            <img src={anno_type} alt="annotation type icon" />
                        </div>
                        &nbsp; {annoType} */}
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