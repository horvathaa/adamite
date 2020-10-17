import React, { useState, useEffect } from 'react';
import './MultiSelect.css';
import { AiFillClockCircle, AiOutlineCheck, AiOutlineCloseCircle, AiOutlineUsergroupAdd } from 'react-icons/ai';
import { BiAnchor, BiPlusCircle, BiGroup } from 'react-icons/bi';
import MultiSelect from 'react-multi-select-component';

class GroupMultiSelect extends React.Component {

    state = {
        groups: this.props.groups,
        selected: "",

    }

    componentDidMount() {
        console.log("it did mount", this.props.groups)
    }

    DefaultItemRenderer = ({
        checked,
        option,
        onClick,
        disabled,
    }) => {
        return (
            <div onClick={onClick}
            // className={`"disabled"}`}
            >
                { checked ?
                    <div className="multi-select-check-wrapper">
                        <AiOutlineCheck
                            checked={checked}
                            tabIndex={-1}
                            disabled={disabled}
                        />
                    </div> : null
                }
                <span>{option.label}</span>
            </div>
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

        console.log("this is the passed in groups", this.props.groups)

        let options = this.props.groups.map(group => {
            return { label: group.name, value: group.gid };
        });

        return (
            <React.Fragment>
                <div className="FilterIconContainer">
                    <BiGroup className="filterReactIcon" />
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
                <div className="filterDropDown">
                    <div className="FilterIconContainer">
                        <AiOutlineUsergroupAdd className="filterReactIcon" onClick={_ => this.props.addNewGroup()} />
                    </div>
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