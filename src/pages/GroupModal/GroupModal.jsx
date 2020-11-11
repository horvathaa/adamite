import React from 'react';
import './GroupModal.css';
import profile from '../../assets/img/SVGs/Profile.svg';
import { AiOutlineUsergroupAdd, AiOutlineDelete } from 'react-icons/ai';
import { ToastContainer, toast } from 'react-toastify';
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
                // console.log("closed called reset state")
                this.setState({
                    ownerUid: initstate.ownerUid,
                    ownerEmail: initstate.ownerEmail,
                    userName: initstate.userName,
                    uids: initstate.uids,
                    groupName: "",
                    groupDescription: "",
                    emails: initstate.emails,
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
                // console.log("edit groups", request)
                let data = request.payload;
                this.setState({
                    ownerUid: data.owner,
                    ownerEmail: data.ownerEmail,
                    userName: data.userName,
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

    onClickCreate = (e) => {
        // console.log("in here", this.state.groupName, this.state.groupName.length)
        if (this.state.groupName.length <= 0) {
            this.setState({ invalidName: "*group name cannot be blank" })
            return;
        }
        let emails = this.state.emails.filter(e => e !== this.props.email)
        // console.log("sending date", this.state.emails, this.props.email, emails)
        chrome.runtime.sendMessage({
            msg: 'ADD_NEW_GROUP',
            from: 'content',
            group: {
                name: this.state.groupName,
                owner: this.state.ownerUid,
                description: this.state.groupDescription,
                emails: emails,
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
                <div className="App">
                    <div>
                        <div className="header">
                            <div className="header-icon-container">
                                <AiOutlineUsergroupAdd className="profile" />
                            </div>
                            <div>
                                <h1 className="title"> {editState ? "Edit" : "Create"} Group </h1>
                            </div>
                        </div>
                        <div>
                            <h3>Name</h3>
                        </div>
                        {invalidName.length > 0 ?
                            <div className="invalid-user">
                                {invalidName}
                            </div>
                            : null
                        }
                        <div className="input-modal">
                            <input value={groupName} onChange={value => this.nameHandleChange(value)} placeholder="Name Me!" className="input" />
                        </div>
                        <div>
                            <h3>Description</h3>
                        </div>
                        <div className="input-modal-description">
                            <textarea placeholder="Give me a Descript!" value={groupDescription} onChange={value => this.groupDescriptionHandleChange(value)} className="input-description" />
                        </div>
                        <div>
                            <h3>Share</h3>
                        </div>
                        {invalidUser.length > 0 ?
                            <div className="invalid-user">
                                {invalidUser}
                            </div>
                            : null
                        }
                        <div className="input-modal">
                            <input type="email" placeholder="Add People to your Group by Email" className="input" onKeyDown={this.onKeyDown} />
                        </div>
                        <table className="table" cellSpacing="0" cellPadding="0">
                            <tbody>
                                {emails.map((items, idx) => {
                                    return <tr key={idx} className="table-row">
                                        <th className="table-icon border-left">
                                            <div>
                                                <div className="profile-container">
                                                    <img src={profile} alt="profile" className="profile" />

                                                </div>
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
                <footer>
                    {editState ?
                        <button className="btn-delete btn" onClick={this.onClickDeletez} >Delete</button>
                        : null
                    }
                    <button className="btn" onClick={this.onClickCreate} >{editState ? "Update" : "Create"}</button>
                </footer>
            </React.Fragment>
        );
    }
}
export default Groups;