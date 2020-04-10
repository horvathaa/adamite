import '../../../assets/img/iframe-background.gif';

let sidebarOpen = true; // open -> true  |  close -> false

/**
 * Sidebar open
 */
chrome.storage.local.get(['sidebarOpen'], (result) => {
  if (result.sidebarOpen !== undefined) {
    sidebarOpen = result.sidebarOpen === true;
  }
});

const persistSidebarOpenStatus = (status) => {
  chrome.storage.local.set({
    sidebarOpen: status,
  });
};

/**
 * Sidebar on Left
 */
let sidebarOnLeft = true; // left -> true  |  right -> false

chrome.storage.sync.get(['sidebarOnLeft'], (result) => {
  if (result.sidebarOnLeft !== undefined) {
    sidebarOnLeft = result.sidebarOnLeft === true;
  } else {
    persistSidebarOnLeftStatus(true); // default on left
  }
});

const persistSidebarOnLeftStatus = (status) => {
  chrome.storage.sync.set({
    sidebarOnLeft: status,
  });
};

/**
 * Should Shrink Body
 */
let shouldShrinkBody = true;

chrome.storage.sync.get(['shouldShrinkBody'], (result) => {
  if (result.shouldShrinkBody !== undefined) {
    shouldShrinkBody = result.shouldShrinkBody === true;
  } else {
    persistShouldShrinkBodyStatus(true); // default to shrink body
  }
});

const persistShouldShrinkBodyStatus = (status) => {
  chrome.storage.sync.set({
    shouldShrinkBody: status,
  });
};

const toggleSidebar = (toStatus = null) => {
  if (toStatus === null || toStatus === undefined) {
    sidebarOpen = !sidebarOpen;
  } else {
    sidebarOpen = toStatus;
  }
  persistSidebarOpenStatus(sidebarOpen);
  let sidebarOpenCopy = sidebarOpen;
  chrome.tabs.query(
    {
      currentWindow: true,
    },
    function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          from: 'background',
          msg: 'TOGGLE_SIDEBAR',
          toStatus: sidebarOpenCopy,
        });
      });
    }
  );
};

const updateSidebarWidth = (width) => {
  chrome.tabs.query(
    {
      currentWindow: true,
    },
    function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          from: 'background',
          msg: 'UPDATE_SIDEBAR_WIDTH',
          width,
        });
      });
    }
  );
};

const updateSidebarOnLeftStatus = (toStatus) => {
  chrome.tabs.query(
    {
      currentWindow: true,
    },
    function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          from: 'background',
          msg: 'UPDATE_SIDEBAR_ON_LEFT_STATUS',
          toStatus,
        });
      });
    }
  );
};

const updateShouldShrinkBodyStatus = (toStatus) => {
  chrome.tabs.query(
    {
      currentWindow: true,
    },
    function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          from: 'background',
          msg: 'UPDATE_SHOULD_SHRINK_BODY_STATUS',
          toStatus,
        });
      });
    }
  );
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.from === 'content' && request.msg === 'REQUEST_SIDEBAR_STATUS') {
    sendResponse({
      sidebarOpen,
    });
  } else if (
    request.from === 'content' &&
    request.msg === 'REQUEST_TOGGLE_SIDEBAR'
  ) {
    toggleSidebar(request.toStatus);
  } else if (request.from === 'content' && request.msg === 'WIDTH_CHANGED') {
    updateSidebarWidth(request.width);
  } else if (
    request.from === 'settings' &&
    request.msg === 'USER_CHANGE_SIDEBAR_LOCATION'
  ) {
    const { toStatus } = request;
    sidebarOnLeft = toStatus === 'left';
    persistSidebarOnLeftStatus(sidebarOnLeft);
    updateSidebarOnLeftStatus(sidebarOnLeft);
  } else if (
    request.from === 'settings' &&
    request.msg === 'USER_CHANGE_SIDEBAR_SHOULD_SHRINK_BODY'
  ) {
    const { toStatus } = request;
    shouldShrinkBody = toStatus;
    persistShouldShrinkBodyStatus(shouldShrinkBody);
    updateShouldShrinkBodyStatus(shouldShrinkBody);
  }
});
