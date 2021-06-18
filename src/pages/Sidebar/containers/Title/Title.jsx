import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { APP_NAME_FULL } from '../../../../shared/constants';
import ADAMITE from '../../../../assets/img/Adamite.png';
import { GiHamburgerMenu } from 'react-icons/gi';
import { BiFileBlank, BiHorizontalCenter, BiBookBookmark, BiCog, BiExit, BiGroup, BiUserPlus, BiBug } from 'react-icons/bi';
import { AiOutlineCheck, AiOutlineUser } from 'react-icons/ai';


import './Title.css';

export default class Title extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseEnterAdd = this.onMouseEnterAdd.bind(this);
    this.onMouseLeaveAdd = this.onMouseLeaveAdd.bind(this);
    this.state = {
      dropdownOpen: false,
      dropdownOpenAdd: false,
      newAnnotationDropDownOpen: false
    };
    this.currentUser = this.props.currentUser;
  }

  __generateGroups = (groups) => {
    let options = []

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

    options = options.concat(groups.map(group => {
      return { label: group.name, value: group.gid, owner: group.owner };
    }));

    return options;
  }


  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen,
      dropdownOpenAdd: !prevState.dropdownOpenAdd
    }));
  }

  onMouseEnter() {
    this.setState({ dropdownOpen: true });
  }

  onMouseLeave() {
    setTimeout(() => {
      this.setState({ dropdownOpen: false });
    }, 300)
  }

  onMouseEnterAdd() {
    this.setState({ dropdownOpenAdd: true });
  }

  onMouseLeaveAdd() {
    setTimeout(() => {
      this.setState({ dropdownOpenAdd: false });
    }, 300)

  }

  signOutClickedHandler = e => {
    e.preventDefault();
    chrome.runtime.sendMessage({ msg: 'USER_SIGNOUT' });
  };

  createDropDown = (args) => {
    const listItems = args.items.map((option, idx) => {
      const currentGroup = Array.isArray(args.activeFilter) ? args.activeFilter[0] : args.activeFilter;
        let active = currentGroup === option.label ? true : false
        return <Dropdown.Item key={idx} onSelect={(e) => args.updateFunction([option], e)} data-value={option.label}> {active ? <AiOutlineCheck /> : ""} {option.label} </Dropdown.Item>
    });

    return (
        <React.Fragment>
            <Dropdown className={args.className} style={{margin: 'auto'}}>
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
    const { currentUser, groups } = this.props;
    let userName;
    if (currentUser === null) {
      userName = ""
    }
    else {
      userName = currentUser.email.substring(0, currentUser.email.indexOf('@'));
    }
    return (

      <div className="TitleContainer">
        <div className="container">
          <div className="row">
            <div className="col col-7 col-md-7">
              <div className="Header">
                <div className="TitleIcon">
                  <img className="TitleIcon" src={ADAMITE} alt='Adamite logo' />
                </div>
                <div className="Title">{APP_NAME_FULL}</div>
              </div>
            </div>
            {currentUser !== null && (
              <React.Fragment>
                <div className="col col-5 col-sm-5">
                  <div className="TitleRight"> 
                  {this.createDropDown({
                            Icon: BiGroup,
                            className: 'FilterDropDownSearch NewAnnotationButtonContainer',
                            activeFilter: this.props.currentGroup.length ? this.props.currentGroup : 'Public',
                            header: "My Groups",
                            updateFunction: this.props.updateSidebarGroup,
                            items: this.__generateGroups(groups)
                        })}
                  {/* <div className="row2">
                    <div className="col2 "> */}
                      <div className="SandwichTopBar NewAnnotationButtonContainer ">
                        <Dropdown onClick={this.onMouseEnterAdd} onBlur={this.onMouseLeaveAdd} show={this.state.dropdownOpenAdd} toggle={this.toggle.toString()} >
                          <Dropdown.Toggle id="dropdown-basic" className="vertical-center">
                            <GiHamburgerMenu alt="Hamburger menu" className="profile" />
                          </Dropdown.Toggle>
                          <Dropdown.Menu >
                            <Dropdown.Item className="OptionLineBreak" >
                              <div className="container">
                                <div className="row">
                                  <div className="col OptionCol">
                                    <div className="OptionProfileContainer profileContainer">
                                      <AiOutlineUser alt="profile" className="userProfile" />
                                      {/* <img src={profile} alt="profile" className="profile" /> */}
                                    </div>
                                  </div>
                                  <div className="col">

                                    <div>
                                      {userName.toUpperCase()}
                                    </div>
                                    <div className="EmailNameSection">
                                      {currentUser.email}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Dropdown.Item>
                            <Dropdown.Item className="OptionLineBreak">
                              <hr></hr>
                            </Dropdown.Item>
                            <Dropdown.Item onClick={this.props.handleShowAnnotatePage} className="DropdownItemOverwrite">
                              <div className="DropdownIconsWrapper"><BiFileBlank className="DropdownIcons" /></div>
                              Add Page Annotation
                          </Dropdown.Item>
                          <Dropdown.Item onClick={this.props.addNewGroup} className="DropdownItemOverwrite">
                              <div className="DropdownIconsWrapper"><BiUserPlus className="DropdownIcons" /></div>
                              Create New Group
                          </Dropdown.Item>
                            <Dropdown.Item onClick={this.props.closeSidebar} className="DropdownItemOverwrite">
                              <div className="DropdownIconsWrapper"><BiHorizontalCenter className="DropdownIcons" /></div>
                              Close Sidebar
                          </Dropdown.Item>
                            <Dropdown.Item onClick={this.props.openOptions} className="DropdownItemOverwrite">
                              <div className="DropdownIconsWrapper"><BiCog className="DropdownIcons" /></div>
                              Options
                          </Dropdown.Item>
                            <Dropdown.Item onClick={this.props.openDocumentation} className="DropdownItemOverwrite">
                              <div className="DropdownIconsWrapper"><BiBookBookmark className="DropdownIcons" /></div>
                              View Adamite Documentation
                          </Dropdown.Item>
                          <Dropdown.Item onClick={this.props.openBugForm} className="DropdownItemOverwrite">
                              <div className="DropdownIconsWrapper"><BiBug className="DropdownIcons" /></div>
                              Submit a Bug
                          </Dropdown.Item>
                            <Dropdown.Item onClick={this.signOutClickedHandler} className="DropdownItemOverwrite">
                              <div className="DropdownIconsWrapper"><BiExit className="DropdownIcons" /></div>
                              Sign Out
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                  </div>
                </div>
              </React.Fragment>
            )}

          </div>
        </div>
      </div >

    );
  }
}

