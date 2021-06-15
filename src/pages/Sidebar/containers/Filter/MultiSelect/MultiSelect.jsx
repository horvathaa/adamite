import React from 'react';
import './MultiSelect.css';
import { AiOutlineCheck, AiOutlineCloseCircle, AiOutlineUsergroupAdd } from 'react-icons/ai';
import { BiGroup } from 'react-icons/bi';
import { BsPencilSquare } from 'react-icons/bs';
import MultiSelect from 'react-multi-select-component';

class GroupMultiSelect extends React.Component {

    state = {
        uid: this.props.uid,
        groups: this.props.groups,
        selected: [],
    }

    editModal = (gid) => {
        // console.log("gid!", gid)
        let group = this.props.groups.find(e => e.gid === gid);

        // console.log("gonna edit this modal!", group)
        chrome.runtime.sendMessage({
            msg: 'EDIT_EXISTING_GROUP',
            from: 'content',
            payload: {
                ownerUid: group.owner,
                ownerEmail: "group.ownerEmail",
                userName: "group.userName",
                uids: group.uids,
                groupName: group.name,
                groupDescription: group.description,
                emails: group.emails,
                gid: gid
            }
        });
        chrome.runtime.sendMessage({
            msg: 'SHOW_GROUP',
            from: 'content',
        })
    }

    DefaultItemRenderer = ({
        checked,
        option,
        onClick,
        disabled,
    }) => {

        return (
            <React.Fragment>
                <div className="item-wrapper">
                    <div className="item-inner-left" onClick={onClick} >
                        {checked ?
                            <div className="multi-select-check-wrapper">
                                <AiOutlineCheck
                                    checked={checked}
                                    tabIndex={-1}
                                    disabled={disabled}
                                />
                            </div> : null
                        }
                        <span className="item-inner-left-span">{option.label}</span>
                    </div>
                    {this.state.uid === option.owner ?
                        <div className="item-inner-right">
                            <BsPencilSquare className="edit-button" onClick={_ => this.editModal(option.value)} />
                        </div>
                        : null
                    }
                </div>
            </React.Fragment>
        );
    };

    handleSelection = (selection) => {
        if (selection.some(g => g.label === "Create Group" && g.value === "creategroup" && g.owner === "")) {
            this.props.addNewGroup();
        }
        else {
            this.setState({
                selected: selection
            })
            this.props.handleNotifySidebar(selection);
        }

        // console.log('calling function', handleNotifySidebar);
    }

    render() {
        const { selected } = this.state;

        let options = [];

        options.push({
            label: "Create Group",
            value: "creategroup",
            owner: ""
        });

        options.push({
            label: "Public",
            value: "public",
            owner: ""
        });

        options.push({
            label: "Private",
            value: "onlyme",
            owner: ""
        });

        options = options.concat(this.props.groups.map(group => {
            return { label: group.name, value: group.gid, owner: group.owner };
        }));

        return (
            <React.Fragment>
                <div className="FilterSectionRow" id="GroupFilterSection">
                    <div className="FilterIconContainer2">
                        <BiGroup className="filterReactIcon" />
                    </div>
                    <div className="FilterSection" id="GroupFilterSectionText">Groups</div>
                    <div className="multi-select-wrapper">
                        <div className="filterDropDown">
                            <MultiSelect
                                options={options}
                                value={selected}
                                onChange={this.handleSelection}
                                labelledBy={"Select"}
                                ClearIcon={<AiOutlineCloseCircle />}
                                ClearSelectedIcon={<AiOutlineCloseCircle />}
                                ItemRenderer={this.DefaultItemRenderer}
                                disableSearch={true}
                            />
                        </div>

                    </div>
                </div>

            </React.Fragment>
        )
    }
}

export default GroupMultiSelect;