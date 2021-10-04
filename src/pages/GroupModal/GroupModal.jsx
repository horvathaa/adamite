import React from 'react';
import './GroupModal.css';
import profile from '../../assets/img/SVGs/Profile.svg';
import { AiOutlineUsergroupAdd, AiOutlineDelete, AiOutlineClose, AiOutlineShareAlt, AiOutlineUser } from 'react-icons/ai';
import 'react-toastify/dist/ReactToastify.css';
// import { copySync } from 'fs-extra';


class Groups extends React.Component {

    state = {
        ownerUid: this.props.uid,
        ownerEmail: this.props.email,
        userName: this.props.userName,
        uids: [this.props.uid],
        groupName: "",
        groupDescription: "",
        emails: [this.props.email],
        invalidUser: "",
        invalidName: "",
        editState: false,
        gid: ""
    }

    componentWillUnmount() {
        // console.log("this is being unmounted")
    }

    componentDidMount() {
        var initstate = this.state;

        //reset state when modal closes
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (
                request.from === 'helper' &&
                request.msg === 'GROUP_MODAL_CLOSED'
            ) {
                this.setState({
                    ownerUid: this.props.uid,
                    ownerEmail: this.props.email,
                    userName: initstate.userName,
                    uids: [this.props.uid],
                    groupName: "",
                    groupDescription: "",
                    emails: [this.props.email],
                    invalidUser: "",
                    invalidName: "",
                    editState: false,
                    gid: ""
                });
            }
            else if (
                request.from === 'content' &&
                request.msg === 'EDIT_EXISTING_GROUP'
            ) {
                let data = request.payload;
                this.setState({
                    ownerUid: data.ownerUid,
                    ownerEmail: this.props.email,
                    userName: this.props.email.substring(0, this.props.email.indexOf('@')),
                    uids: data.uids,
                    groupName: data.groupName,
                    groupDescription: data.groupDescription,
                    emails: data.emails,
                    invalidUser: "",
                    invalidName: "",
                    editState: true,
                    gid: data.gid
                });
            }
        });
    }

    /*
     * Checks for a valid email on enter
     */
    onKeyDown = (e) => {
        if (e.key === 'Enter') {
            // console.log('do validate', e.target.value);
            let userInput = e.target.value;
            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (re.test(userInput)) {
                // console.log("Passed")
                if (!this.state.emails.includes(userInput)) {
                    let newEmails = this.state.emails;
                    newEmails.push(userInput)
                    this.setState({ emails: newEmails, invalidUser: "" })
                }
                else {
                    // console.log("failed");
                    this.setState({ invalidUser: "*Email Already Exists in Group" })
                }
            }
            else {
                // console.log("failed");
                this.setState({ invalidUser: "*Invalid Email" })
            }
        }
    }

    /*
     * Deletes an email when trash icon is clicked
     */
    onClickDelete = (email) => {
        // console.log("in delete");
        var results = this.state.emails.filter(function (el) {
            return !el.match(email)
        })
        this.setState({ emails: results, invalidUser: "" })
    }

    onClickCreate = async () => {
        if (this.state.groupName.length <= 0) {
            this.setState({ invalidName: "*group name cannot be blank" })
            return;
        }
        let emails = this.state.emails.filter(e => e !== this.props.email)
        await chrome.runtime.sendMessage({
            msg: 'ADD_NEW_GROUP',
            from: 'content',
            group: {
                name: this.state.groupName,
                owner: this.state.ownerUid,
                description: this.state.groupDescription,
                emails: emails,
                gid: this.state.gid
            },
        });
    }

    onClickDeletez = (e) => {
        // console.log("in here", this.state.groupName, this.state.groupName.length)
        if (this.state.groupName.length <= 0) {
            this.setState({ invalidName: "*group name cannot be blank" })
            return;
        }

        if (window.confirm("Are you sure you want to delete this group?")) {
            // console.log("deleting", this.state.gid)
            chrome.runtime.sendMessage({
                msg: 'DELETE_GROUP',
                from: 'modal',
                gid: this.state.gid
            });
        }
        // document.getElementById("demo").innerHTML = txt;
    }

    nameHandleChange = (e) => {
        // console.log("this is the name", e, e.target.value)
        this.setState({ groupName: e.target.value })
    }

    groupDescriptionHandleChange = (e) => {
        // console.log("this is the descript", e, e.target.value)
        this.setState({ groupDescription: e.target.value })
    }

    render() {
        // console.log("thee are the props", this.state)

        const {
            ownerUid,
            ownerEmail,
            userName,
            uids,
            groupName,
            groupDescription,
            emails,
            invalidUser,
            invalidName,
            editState
        } = this.state;

        return (

            <React.Fragment>
                <div className="newApp">
                    <div className="header">
                        <div className="header-icon-container">
                            <AiOutlineUsergroupAdd className="profile" />
                        </div>
                        <div>
                            <h1 className="title"> {editState ? "Edit" : "Create"} a Group </h1>
                        </div>
                        <div className="header-icon-container-right" onClick={() => {
                            chrome.runtime.sendMessage({
                                msg: 'HIDE_GROUP',
                                from: 'modal'
                            })
                        }}>
                            {/* <AiOutlineClose className="close" /> */}
                        </div>
                    </div>
                    {/* <div>
                            <h3>Name</h3>
                        </div> */}
                    {invalidName.length > 0 ?
                        <div className="invalid-user">
                            {invalidName}
                        </div>
                        : null
                    }
                    <div className="input-modal">
                        <input value={groupName} onChange={value => this.nameHandleChange(value)} type="text" placeholder="" className="input" required />
                        <span className="floating-label">Group Name</span>
                    </div>
                    {/* <div>
                            <h3>Description</h3>
                        </div> */}
                    <div className="input-modal">
                        <input value={groupDescription} onChange={value => this.groupDescriptionHandleChange(value)} className="input" required />
                        <span className="floating-label">Description</span>
                    </div>
                    {/* <div>
                            <h3>Share</h3>
                        </div> */}


                </div>
                <div className="newApp">
                    <div className="header">
                        <div className="header-icon-container">
                            <AiOutlineShareAlt className="profile" />
                        </div>
                        <div>
                            <h1 className="title"> Share </h1>
                        </div>
                    </div>
                    {invalidUser.length > 0 ?
                        <div className="invalid-user">
                            {invalidUser}
                        </div>
                        : null
                    }
                    <div className="input-modal">
                        <input type="email" className="input" onKeyDown={this.onKeyDown} required />
                        <span className="floating-label">Email of User to Add</span>
                    </div>
                    <div className="input-table input-modal">
                    <table className="table" cellSpacing="0" cellPadding="0">
                        <tbody>
                            {emails.map((items, idx) => {
                                return <tr key={idx} className="table-row">
                                    <th className="table-icon border-left">                                     
                                            <div className="table-icon-container">
                                                <AiOutlineUser className="user-profile" />
                                            </div>                                       
                                    </th>
                                    <th >
                                        <div className="table-email">
                                            {items}
                                        </div>
                                    </th>
                                    {items === ownerEmail ?
                                        <th >
                                            <div className="table-owner">
                                                Creator
                                            </div>
                                        </th>
                                        :
                                        <th >
                                            <AiOutlineDelete className="profile trash-icon" onClick={() => this.onClickDelete(items)} />
                                        </th>
                                    }
                                </tr>
                            }
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
                <div className="newApp" style={{paddingBottom: "1em"}}>
                    <div style={{ display: "flow-root"}}>
                    {editState ?
                        <button className="btn-delete btn" onClick={this.onClickDeletez} >Delete Group</button>
                        : null
                    }
                    <button className="btn" onClick={() => this.onClickCreate()} >{editState ? "Update" : "Create"}</button>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}
export default Groups;