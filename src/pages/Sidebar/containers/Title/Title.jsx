import React from 'react';
import classNames from 'classnames';
import { APP_NAME_FULL } from '../../../../shared/constants';

import './Title.css';

const Title = ({ currentUser }) => {
  const signOutClickedHandler = e => {
    e.preventDefault();
    chrome.runtime.sendMessage({ msg: 'USER_SIGNOUT' });
  };

  return (
    <div className="TitleContainer">
      <div className="Title">{APP_NAME_FULL}</div>
      <div style={{ flexGrow: 1 }}></div>
      {currentUser !== null && (
        <div className="UserContainer">
          <div className="UserEmail">{currentUser.email}</div>
          <button className="UserSignOutButton" onClick={signOutClickedHandler}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Title;
