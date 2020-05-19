import React from 'react';
import classNames from 'classnames';
import { Dropdown } from 'react-bootstrap';
// import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { APP_NAME_FULL } from '../../../../shared/constants';
import { AiOutlineUser } from 'react-icons/ai';
import '../../../../assets/img/Adamite.png';
// import '../../../Background/test.html';
import { useState } from 'react';

import './Title.css';

export default class Title extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.state = {
      dropdownOpen: false
    };
    this.currentUser = this.props.currentUser;
  }

  toggle() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  onMouseEnter() {
    this.setState({ dropdownOpen: true });
  }

  onMouseLeave() {
    this.setState({ dropdownOpen: false });
  }

  signOutClickedHandler = e => {
    e.preventDefault();
    chrome.runtime.sendMessage({ msg: 'USER_SIGNOUT' });
    //this.currentUser = null;
  };

  render() {
    const { currentUser } = this.props;
    return (

      <div className="TitleContainer">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="Header">
                <img className="TitleIcon" src={chrome.extension.getURL('Adamite.png')}></img>
                <div className="Title">{APP_NAME_FULL}</div>
              </div>
            </div>
            {currentUser !== null && (
              <div className="col">
                <div className="row2">
                  <div className="col2 ">
                    <Dropdown onMouseOver={this.onMouseEnter} onMouseLeave={this.onMouseLeave} show={this.state.dropdownOpen} toggle={this.toggle.toString()}>
                      <Dropdown.Toggle id="dropdown-menu" >
                        <AiOutlineUser className="userIcon" />
                      </Dropdown.Toggle>
                      <Dropdown.Menu >
                        <Dropdown.Item onClick={this.signOutClickedHandler}>
                          sign out
                          </Dropdown.Item>
                      </Dropdown.Menu>

                    </Dropdown>

                    {/* <AiOutlineUser className="userIcon" /> */}
                  </div>
                  {/* <div className="UserEmail">{currentUser.email}</div> */}
                  {/* <button className="UserSignOutButton" onClick={signOutClickedHandler}>
                  Sign Out
                    </button> */}
                </div>
              </div>
            )}

          </div>
        </div>
      </div >

    );
  }
}

