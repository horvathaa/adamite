import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { APP_NAME_FULL } from '../../../../shared/constants';
import { AiOutlineUser } from 'react-icons/ai';
import '../../../../assets/img/Adamite.png';
import { GiHamburgerMenu } from 'react-icons/gi';
import { BiFileBlank, BiHorizontalCenter, BiBookBookmark, BiCog, BiExit } from 'react-icons/bi';


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
    //this.currentUser = null;
  };

  render() {
    const { currentUser } = this.props;
    console.log(currentUser)
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
            <div className="col">
              <div className="Header">
                <div className="Title">{APP_NAME_FULL}</div>
              </div>
            </div>
            {currentUser !== null && (
              <div className="col">
                <div className="row2">
                  <div className="col2 ">

                    {/* <Dropdown onMouseOver={this.onMouseEnter} onMouseLeave={this.onMouseLeave} show={this.state.dropdownOpen} toggle={this.toggle.toString()}>

                      <Dropdown.Toggle id="dropdown-menu" className="vertical-center">
                        <div className="UserNameIconContainer">
                          <div className="UserNameSection">
                            {userName.toUpperCase()}
                          </div>
                          <img src={profile} alt="profile" className="profile" />
                        </div>
                      </Dropdown.Toggle>
                      <Dropdown.Menu >
                        <Dropdown.Item onClick={this.signOutClickedHandler}>
                          Sign Out
                          </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown> */}
                    <div className="NewAnnotationButtonContainer">
                      <Dropdown onClick={this.onMouseEnterAdd} onBlur={this.onMouseLeaveAdd} show={this.state.dropdownOpenAdd} toggle={this.toggle.toString()} >
                        <Dropdown.Toggle id="dropdown-basic" className="vertical-center">
                          <GiHamburgerMenu alt="Hamburger menu" className="profile" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item onClick={this.props.handleShowAnnotatePage} className="OptionLineBreak" >
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
                          <Dropdown.Item onClick={this.signOutClickedHandler} className="DropdownItemOverwrite">
                            <div className="DropdownIconsWrapper"><BiExit className="DropdownIcons" /></div>
                            Sign Out
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div >

    );
  }
}

