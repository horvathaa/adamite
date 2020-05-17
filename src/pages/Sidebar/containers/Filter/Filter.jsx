import React from 'react';
import './Filter.css';
import { Dropdown } from 'react-bootstrap';
import { FaCheck, FaFilter } from 'react-icons/fa';
import { trashAnnotationById } from '../../../../firebase';

const customToggle = React.forwardRef(({ children, onClick }, ref) => (
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
        siteScope: null,
        userScope: [],
        annoType: [],
        timeRange: null,
        archive: null,
        tags: []
    }

    async updateSelected(eventKey) {
        if (eventKey.includes('siteScope')) {
            this.selection.siteScope = eventKey.substring(eventKey.indexOf(':') + 1, eventKey.length);
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
            if (this.selection.annoType.includes(choice)) {
                this.selection.annoType = this.selection.annoType.filter(e => e !== choice);
            } else {
                this.selection.annoType.push(choice);
            }
        }
        this.props.applyFilter(this.selection);

    }

    render() {
        return (
            <Dropdown className="Filter">
                <Dropdown.Toggle as={customToggle} id="dropdown-basic">

                </Dropdown.Toggle>
                <Dropdown.Menu >
                    &nbsp;Site scope
                    <Dropdown.Item as="button" eventKey="siteScope:onPage" onSelect={eventKey => this.updateSelected(eventKey)}>
                        On page {this.selection.siteScope === 'onPage' ? ("•") : (null)}
                    </Dropdown.Item>
                    <Dropdown.Item as="button" eventKey="siteScope:anchorToPage" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Anchored to Page {this.selection.siteScope === 'anchorToPage' ? ("•") : (null)}
                    </Dropdown.Item>
                    <Dropdown.Item as="button" eventKey="siteScope:acrossWholeSite" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Across whole site {this.selection.siteScope === 'acrossWholeSite' ? ("•") : (null)}
                    </Dropdown.Item>
                    <Dropdown.Item as="button" eventKey="siteScope:anchorToAllSitePages" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Anchored to All Site Pages {this.selection.siteScope === 'anchorToAllSitePages' ? ("•") : (null)}
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
                </Dropdown.Menu>

            </Dropdown>
        )
    }
}

export default Filter;