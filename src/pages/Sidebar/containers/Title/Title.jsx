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

import './Title.css';

const addAnnotationToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}><BsFilePlus className="profile" />
    {children}
  </a>
));


export default class Title extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.state = {
      dropdownOpen: false,
      newAnnotationDropDownOpen: false
    };
    this.currentUser = this.props.currentUser;
  }

  createDropDown = (args) => {
    console.log('arrr', args);
    const listItems = args.items.map((option, idx) => {
      // let active = args.activeFilter.indexOf(option.visible) > -1 ? true : false
      return <Dropdown.Item key={idx} onSelect={args.updateFunction} > {option.name} </Dropdown.Item>
    });

    return (
      <React.Fragment>
        <Dropdown>
          <Dropdown.Toggle title={args.header} className="titleDropDown">
            <div className="FilterIconContainer">
              <args.Icon className="filterReactIcon" />
            </div>
            &nbsp; {args.activeGroup}
          </Dropdown.Toggle>
          <Dropdown.Menu >
            <Dropdown.Header>{args.header}</Dropdown.Header>
            {listItems}
          </Dropdown.Menu>
        </Dropdown>
      </React.Fragment>
    );
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
    const { currentUser, groups } = this.props;

    return (

      <div className="TitleContainer">
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="Header">
                <img className="TitleIcon" src={chrome.extension.getURL('Adamite.png')} alt="Adamite logo"></img>
                <div className="Title">{APP_NAME_FULL}</div>
                <div className="titleDropDown">
                  {this.createDropDown({
                    Icon: RiGroupLine,
                    activeGroup: "Public", // need actual logic here
                    header: "Group",
                    updateFunction: this.props.updateSidebarGroup,
                    items: groups
                  })}
                </div>
              </div>
            </div>
            {currentUser !== null && (
              <div className="col">
                <div className="row2">
                  <div className="col2 ">
                    <div className="NewAnnotationButtonContainer">
                      <Dropdown className="Filter" >
                        <Dropdown.Toggle as={addAnnotationToggle} id="dropdown-basic">

                        </Dropdown.Toggle>
                        <Dropdown.Menu >
                          <Dropdown.Item as="button" onSelect={this.props.handleShowAnnotatePage}>
                            Add Page Annotation
                        </Dropdown.Item>
                          <Dropdown.Item as="button" onSelect={this.props.handleUnanchoredAnnotation}>
                            Add Unanchored Annotation
                        </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    <Dropdown onMouseOver={this.onMouseEnter} onMouseLeave={this.onMouseLeave} show={this.state.dropdownOpen} toggle={this.toggle.toString()}>
                      <Dropdown.Toggle id="dropdown-menu" className="vertical-center">
                        <img src={profile} alt="profile" className="profile" />
                      </Dropdown.Toggle>
                      <Dropdown.Menu >
                        <Dropdown.Item onClick={this.signOutClickedHandler}>
                          Sign Out
                          </Dropdown.Item>
                      </Dropdown.Menu>

                    </Dropdown>


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

