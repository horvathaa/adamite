import React from 'react';
import './Filter.css';
import { Dropdown } from 'react-bootstrap';
import { FaCheck } from 'react-icons/fa';
import { trashAnnotationById } from '../../../../firebase';

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

    }

    async pushSelected() {
        this.props.applyFilter(this.selection);
    }

    render() {
        return (
            <Dropdown className="Filter">
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Filter Menu
                </Dropdown.Toggle>
                <Dropdown.Menu >
                    {' '}Site scope
                    <Dropdown.Item as="button" eventKey="siteScope:onPage" onSelect={eventKey => this.updateSelected(eventKey)}>
                        On page
                    </Dropdown.Item>
                    <Dropdown.Item as="button" eventKey="siteScope:anchorToPage" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Anchored to Page
                    </Dropdown.Item>
                    <Dropdown.Item as="button" eventKey="siteScope:acrossWholeSite" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Across whole site
                    </Dropdown.Item>
                    <Dropdown.Item as="button" eventKey="siteScope:anchorToAllSitePages" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Anchored to All Site Pages
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    {' '} User view
                    <Dropdown.Item as="button" eventKey="userScope:onlyMe" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Only me {this.selection.userScope.includes('onlyMe') ? ("✓") : (null)}
                    </Dropdown.Item>
                    <Dropdown.Item as="button" eventKey="userScope:public" onSelect={eventKey => this.updateSelected(eventKey)}>
                        Public {this.selection.userScope.includes('public') ? ("✓") : (null)}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" eventKey="done" onSelect={eventKey => this.pushSelected()}>
                        Apply filter
                    </Dropdown.Item>
                </Dropdown.Menu>

            </Dropdown>
        )
    }
}

export default Filter;