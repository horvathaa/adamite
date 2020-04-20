import React, { useEffect, useState } from 'react';
import './Options.css';

const Options = () => {
  const [sidebarOnLeft, setSidebarOnLeft] = useState(true);
  const [sidebarShouldShrinkBody, setSidebarShouldShrinkBody] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get(['sidebarOnLeft'], result => {
      if (result.sidebarOnLeft !== undefined) {
        console.log(result.sidebarOnLeft);
        setSidebarOnLeft(result.sidebarOnLeft);
      }
    });

    chrome.storage.sync.get(['shouldShrinkBody'], result => {
      if (result.shouldShrinkBody !== undefined) {
        setSidebarShouldShrinkBody(result.shouldShrinkBody);
      }
    });

    // // sync settings across tabs
    // chrome.runtime.onMessage.addListener((request, sender, response) => {
    //   if (
    //     request.from === 'background' &&
    //     request.msg === 'UPDATE_SIDEBAR_ON_LEFT_STATUS'
    //   ) {
    //     const { toStatus } = request;
    //     setSidebarOnLeft(toStatus);
    //   } else if (
    //     request.from === 'background' &&
    //     request.msg === 'UPDATE_SHOULD_SHRINK_BODY_STATUS'
    //   ) {
    //     const { toStatus } = request;
    //     setSidebarShouldShrinkBody(toStatus);
    //   }
    // });
  }, []);

  const setSettingSidebarOnLeft = toStatus => {
    if (toStatus === sidebarOnLeft) {
      return;
    }
    console.log(toStatus);

    setSidebarOnLeft(toStatus);
    chrome.runtime.sendMessage({
      from: 'settings',
      msg: 'USER_CHANGE_SIDEBAR_LOCATION',
      toStatus,
    });
  };

  const setSettingSidebarShouldShrinkBody = toStatus => {
    if (toStatus === sidebarShouldShrinkBody) {
      return;
    }

    setSidebarShouldShrinkBody(toStatus);
    chrome.runtime.sendMessage({
      from: 'settings',
      msg: 'USER_CHANGE_SIDEBAR_SHOULD_SHRINK_BODY',
      toStatus,
    });
  };

  return (
    <div className="OptionsContainer">
      <h2>Settings</h2>
      <div className="SettingEntryContainer">
        Sidebar position:&nbsp;
        <input
          type="radio"
          id="sidebarOnLeft"
          name="sidebarOnLeft"
          checked={sidebarOnLeft}
          onChange={() => setSettingSidebarOnLeft(true)}
        />{' '}
        <label htmlFor="sidebarOnLeft">Left</label> &nbsp;&nbsp;
        <input
          type="radio"
          id="sidebarOnRight"
          name="sidebarOnLeft"
          checked={!sidebarOnLeft}
          onChange={() => setSettingSidebarOnLeft(false)}
        />{' '}
        <label htmlFor="sidebarOnRight">Right</label>
      </div>

      <div className="SettingEntryContainer">
        When the sidebar is open, should the webpage shrink:&nbsp;
        <input
          type="radio"
          id="sidebarShouldShrinkBody"
          name="sidebarShouldShrinkBody"
          checked={sidebarShouldShrinkBody}
          onChange={() => setSettingSidebarShouldShrinkBody(true)}
        />{' '}
        <label htmlFor="sidebarShouldShrinkBody">Yes</label> &nbsp;&nbsp;
        <input
          type="radio"
          id="sidebarShouldNotShrinkBody"
          name="sidebarShouldShrinkBody"
          checked={!sidebarShouldShrinkBody}
          onChange={() => setSettingSidebarShouldShrinkBody(false)}
        />{' '}
        <label htmlFor="sidebarShouldNotShrinkBody">No</label>
      </div>
    </div>
  );
};

export default Options;
