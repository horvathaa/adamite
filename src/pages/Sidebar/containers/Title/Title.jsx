import React from 'react';
import classNames from 'classnames';
import { Dropdown } from 'react-bootstrap';
// import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { APP_NAME_FULL } from '../../../../shared/constants';
import { RiGroupLine } from 'react-icons/ri';
import { AiOutlineUser } from 'react-icons/ai';
import '../../../../assets/img/Adamite.png';
import profile from '../../../../assets/img/SVGs/Profile.svg';
import { GoThreeBars } from 'react-icons/go';
// import '../../../Background/test.html';
import { useState } from 'react';
import { BsFilePlus } from 'react-icons/bs';
import addPage from '../../../../assets/img/SVGs/file-add.svg';

import './Title.css';

// const addAnnotationToggle = React.forwardRef(({ children, onClick }, ref) => (
//   <a ref={ref}
//     onClick={(e) => {
//       e.preventDefault();
//       onClick(e);
//     }}><BsFilePlus className="profile" />
//     {children}
//   </a>
// ));


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
                <img className="TitleIcon" src={chrome.extension.getURL('Adamite.png')} alt="Adamite logo"></img>
                <div className="Title">{APP_NAME_FULL}</div>

              </div>
            </div>
            {currentUser !== null && (
              <div className="col">
                <div className="row2">
                  <div className="col2 ">

                    <Dropdown onMouseOver={this.onMouseEnter} onMouseLeave={this.onMouseLeave} show={this.state.dropdownOpen} toggle={this.toggle.toString()}>

                      <Dropdown.Toggle id="dropdown-menu" className="vertical-center">
                        <div className="UserNameIconContainer">
                          <div className="UserNameSection">
                            {userName}
                          </div>
                          <img src={profile} alt="profile" className="profile" />
                        </div>
                      </Dropdown.Toggle>
                      <Dropdown.Menu >
                        <Dropdown.Item onClick={this.signOutClickedHandler}>
                          Sign Out
                          </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <div className="NewAnnotationButtonContainer">
                      <Dropdown onMouseOver={this.onMouseEnterAdd} onMouseLeave={this.onMouseLeaveAdd} show={this.state.dropdownOpenAdd} toggle={this.toggle.toString()} >
                        <Dropdown.Toggle id="dropdown-basic" className="vertical-center">
                          <img src={addPage} alt="profile" className="profile" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item onClick={this.props.handleShowAnnotatePage}>
                            Add Page Annotation
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

