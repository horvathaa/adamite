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
        selected: "",
    }

    editModal = (gid) => {
        console.log("gid!", gid)
        let group = this.props.groups.find(e => e.gid === gid);

        console.log("gonna edit this modal!", group)
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
                emails: [],
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
        this.setState({
            selected: selection
        })
        // console.log('selection', selection, selected);
        this.props.handleNotifySidebar(selection);
        // console.log('calling function', handleNotifySidebar);
    }

    render() {

        const { groups, selected } = this.state;

        console.log("this is the passed in groups", this.props.groups, this.state.uid)
        let options = this.props.groups.map(group => {
            return { label: group.name, value: group.gid, owner: group.owner };
        });

        return (
            <React.Fragment>
                <div className="filterDropDown">
                    <div className="FilterIconContainer2">
                        <AiOutlineUsergroupAdd className="filterReactIcon" onClick={_ => this.props.addNewGroup()} />
                    </div>
                </div>
                <div className="multi-select-wrapper">
                    <MultiSelect
                        options={options}
                        value={selected}
                        onChange={this.handleSelection}
                        labelledBy={"Select"}
                        ClearIcon={<AiOutlineCloseCircle />}
                        ClearSelectedIcon={<AiOutlineCloseCircle />}
                        ItemRenderer={this.DefaultItemRenderer}
                    />
                </div>

            </React.Fragment>
        )
    }
    // const [selected, setSelected] = useState(null);
}
// export const GroupMultiSelect = ({ groups, handleNotifySidebar, addNewGroup }) => {



//     const [selected, setSelected] = useState(null);
//     // console.log('function', updateSidebarGroup);
//     let options = groups.map(group => {
//         return { label: group.name, value: group.gid };
//     });

//     function handleSelection(selection) {
//         setSelected(selection);
//         // console.log('selection', selection, selected);
//         handleNotifySidebar(selection);
//         // console.log('calling function', handleNotifySidebar);
//     }

//     return (
//         <React.Fragment>
//             <div className="FilterIconContainer">
//                 <BiGroup className="filterReactIcon" />
//             </div>
//             <div className="multi-select-wrapper">
//                 <MultiSelect
//                     options={options}
//                     value={selected}
//                     onChange={handleSelection}
//                     labelledBy={"Select"}
//                     ClearIcon={<AiOutlineCloseCircle />}
//                     ClearSelectedIcon={<AiOutlineCloseCircle />}
//                     ItemRenderer={DefaultItemRenderer}
//                 />
//             </div>
//             <div className="filterDropDown">
//                 <div className="FilterIconContainer">
//                     <AiOutlineUsergroupAdd className="filterReactIcon" onClick={_ => this.addNewGroup()} />
//                 </div>
//             </div>
//         </React.Fragment>
//     )
// }

export default GroupMultiSelect;