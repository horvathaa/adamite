import React from 'react';
import './FilterSummary.css';
import classNames from 'classnames';
import view from '../../../../assets/img/SVGs/view.svg';
import time from '../../../../assets/img/SVGs/time.svg';
import location from '../../../../assets/img/SVGs/location.svg';
import anno_type from '../../../../assets/img/SVGs/anno_type.svg';
import tag from '../../../../assets/img/SVGs/tag.svg';

var arraysMatch = function (arr1, arr2) {

    // Check if the arrays are the same length
    if (arr1.length !== arr2.length) return false;

    // Check if all items exist and are in the same order
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }

    // Otherwise, return true
    return true;

};

class FilterSummary extends React.Component {

    render() {
        const { filter } = this.props;

        const userScope = filter.userScope.includes('public') ? 'Anyone' : 'Only Me';

        let siteScope = "";
        if (filter.siteScope.includes('onPage') && filter.siteScope.includes('acrossWholeSite')) {
            siteScope = "On Page and Across Whole Site";
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
        if (arraysMatch(filter.annoType, ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'])) {
            annoType = "All Annotation Types";
        }
        else {
            filter.annoType.map((type, idx) => {
                console.log('lol', type);
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
            <div className="FilterSummaryContainer">
                <div className="FilterSectionRow" id="Header">
                    Currently Selected Filter
                </div>
                <div className="FilterSectionRow">
                    <div className="FilterSection">
                        <div className="FilterIconContainer">
                            <img src={view} alt="author view icon" />
                        </div>
                        &nbsp; {userScope}
                    </div>
                    <div className="FilterSection">
                        <div className="FilterIconContainer">
                            <img src={time} alt="time icon" />
                        </div>
                        &nbsp; {timeRange}
                    </div>
                    <div className="FilterSection">
                        <div className="FilterIconContainer">
                            <img src={location} alt="location icon" />
                        </div>
                        &nbsp; {siteScope}
                    </div>
                </div>
                <div className="FilterSectionRow">
                    <div className="FilterSection">
                        <div className="FilterIconContainer">
                            <img src={anno_type} alt="annotation type icon" />
                        </div>
                        &nbsp; {annoType}
                    </div>
                </div>
                {filter.tags.length ? (
                    <div className="FilterSectionRow">
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
                    </div>
                ) : (null)}
            </div>



        );

    }
}

export default FilterSummary;