import React from 'react';
import ReactDOM from 'react-dom';
import './Filter.css';
import { Dropdown } from 'react-bootstrap';
import { FaCheck, FaFilter } from 'react-icons/fa';
import { trashAnnotationById } from '../../../../firebase';

const filterToggle = React.forwardRef(({ children, onClick }, ref) => (
    <a ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}><FaFilter />
        {children}
    </a>
));



class Filter extends React.Component {
    selection = {
        siteScope: ['onPage'],
        userScope: ['public'],
        annoType: ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'],
        timeRange: 'all',
        archive: null,
        tags: []
    }

    componentDidMount() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.msg === 'TAGS_SELECTED' && request.from === 'background') {
                this.selection.tags = request.payload.tags;
                this.props.applyFilter(this.selection);
                return;
            }
        });
    }

    async updateSelected(eventKey) {
        if (eventKey === 'setDefault') {
            this.selection.siteScope = ['onPage'];
            this.selection.userScope = ['public'];
            this.selection.annoType = ['default', 'to-do', 'question', 'highlight', 'navigation', 'issue'];
            this.selection.timeRange = 'all';
            this.selection.tags = [];
            this.props.applyFilter(this.selection);
            return;
        }
        if (eventKey === 'filterByTag') {
            chrome.runtime.sendMessage({
                msg: 'FILTER_BY_TAG',
                payload: this.selection,
            });
        }
        if (eventKey.includes('siteScope')) {
            let choice = eventKey.substring(eventKey.indexOf(':') + 1, eventKey.length)
            if (this.selection.siteScope.includes(choice)) {
                this.selection.siteScope = this.selection.siteScope.filter(e => e !== choice);
            } else {
                this.selection.siteScope.push(choice);
            }
            // this.selection.siteScope = eventKey.substring(eventKey.indexOf(':') + 1, eventKey.length);
        }
        else if (eventKey.includes('userScope')) {
            let choice = eventKey.substring(eventKey.indexOf(':') + 1, eventKey.length)
            if (this.selection.userScope.includes(choice)) {
                this.selection.userScope = this.selection.userScope.filter(e => e !== choice);
            } else {
                this.selection.userScope.push(choice);
            }
        }
        else if (eventKey.includes('annoType')) {
            let choice = eventKey.substring(eventKey.indexOf(':') + 1, eventKey.length)
            if (this.selection.annoType.includes(choice) || this.selection.annoType.includes('all')) {
                this.selection.annoType = this.selection.annoType.filter(e => e !== choice);
            } else {
                this.selection.annoType.push(choice);
            }
        }
        else if (eventKey.includes('timeRange')) {
            this.selection.timeRange = eventKey.substring(eventKey.indexOf(':') + 1, eventKey.length)
        }
        this.props.applyFilter(this.selection);

    }

    render() {
        return (
            <div className="col2">
                <Dropdown className="Filter">
                    <Dropdown.Toggle as={filterToggle} id="dropdown-basic">

                    </Dropdown.Toggle>
                    <Dropdown.Menu >
                        &nbsp;{this.props.filterAnnotationLength()} annotations
                    <Dropdown.Divider />
                    &nbsp;Site scope
                    <Dropdown.Item as="button" eventKey="siteScope:onPage" onSelect={eventKey => this.updateSelected(eventKey)}>
                            On page {this.selection.siteScope.includes('onPage') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="siteScope:anchorToPage" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Anchored to Page {this.selection.siteScope.includes('anchorToPage') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="siteScope:acrossWholeSite" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Across whole site {this.selection.siteScope.includes('acrossWholeSite') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="siteScope:anchorToAllSitePages" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Anchored to All Site Pages {this.selection.siteScope.includes('anchorToAllSitePages') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                     &nbsp; User view
                    <Dropdown.Item as="button" eventKey="userScope:onlyMe" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Only me {this.selection.userScope.includes('onlyMe') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="userScope:public" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Public {this.selection.userScope.includes('public') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                    &nbsp;Type of Annotation
                    <Dropdown.Item as="button" eventKey="annoType:default" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Default {this.selection.annoType.includes('default') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="annoType:to-do" onSelect={eventKey => this.updateSelected(eventKey)}>
                            To-do {this.selection.annoType.includes('to-do') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="annoType:question" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Question/Answer {this.selection.annoType.includes('question') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="annoType:highlight" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Highlight {this.selection.annoType.includes('highlight') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="annoType:navigation" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Navigation {this.selection.annoType.includes('navigation') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="annoType:issue" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Issue {this.selection.annoType.includes('issue') ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                    &nbsp;Time Range
                    <Dropdown.Item as="button" eventKey="timeRange:day" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Past Day {this.selection.timeRange === 'day' ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="timeRange:week" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Past Week {this.selection.timeRange === 'week' ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="timeRange:month" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Past Month {this.selection.timeRange === 'month' ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="timeRange:6months" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Past 6 Months {this.selection.timeRange === '6months' ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="timeRange:year" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Past Year {this.selection.timeRange === 'year' ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Item as="button" eventKey="timeRange:all" onSelect={eventKey => this.updateSelected(eventKey)}>
                            All Time {this.selection.timeRange === 'all' ? ("✓") : (null)}
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item as="button" eventKey="filterByTag" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Filter by Tag...
                    </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item as="button" eventKey="setDefault" onSelect={eventKey => this.updateSelected(eventKey)}>
                            Revert to Default
                    </Dropdown.Item>
                    </Dropdown.Menu>

                </Dropdown>
            </div>
        )
    }
}

export default Filter;