import '../../../assets/img/iframe-background.gif';
import { sidebarStatus } from '../backgroundEventListeners';

/**
 * Sidebar open
 */
// chrome.storage.local.get(['sidebarOpen'], (result) => {
//   if (result.sidebarOpen !== undefined) {
//     sidebarOpen = result.sidebarOpen === true;
//   }
// });

// const persistSidebarOpenStatus = (status) => {
//   console.log('persist call', status);
//   chrome.storage.local.set({
//     sidebarOpen: status,
//   });
// };

/**
 * Sidebar on Left
 */
let sidebarOnLeft = false; // left -> true  |  right -> false

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
let shouldShrinkBody = false;

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

export const toggleSidebar = (toStatus = null) => {
  let sidebarOpen;
  if (toStatus === null || toStatus === undefined) {
    sidebarOpen = false;
  } else {
    sidebarOpen = toStatus;
  }
  // persistSidebarOpenStatus(sidebarOpen);
  let sidebarOpenCopy = sidebarOpen;
  chrome.tabs.query(
    {
      currentWindow: true,
      active: true
    },
    function (tab) {

      // tab[0].forEach((tab) => {
      chrome.tabs.sendMessage(tab[0].id, {
        from: 'background',
        msg: 'TOGGLE_SIDEBAR',
        toStatus: sidebarOpenCopy,
      });
      // });
    }
  );
};

export const updateSidebarWidth = (width) => {
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

export async function requestSidebarStatus(request, sender, sendResponse) {
  chrome.tabs.query(({ active: true, currentWindow: true }), tab => {
    let status;
    if (sidebarStatus.length) {
      const i = sidebarStatus.findIndex(t => t.id === tab[0].id);
      status = i > -1 ? sidebarStatus[i].open : false;
    }
    else {
      status = false;
    }
    sendResponse(status);
  })

}

export async function requestToggleSidebar(request, sender, sendResponse) {
  toggleSidebar(request.toStatus);
}

export async function userChangeSidebarLocation(request, sender, sendResponse) {
  const { toStatus } = request;
  sidebarOnLeft = toStatus;
  persistSidebarOnLeftStatus(sidebarOnLeft);
  updateSidebarOnLeftStatus(sidebarOnLeft);
}

export async function userChangeSidebarShouldShrink(request, sender, sendResponse) {
  const { toStatus } = request;
  shouldShrinkBody = toStatus;
  persistShouldShrinkBodyStatus(shouldShrinkBody);
  updateShouldShrinkBodyStatus(shouldShrinkBody);
}

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.from === 'content' && request.msg === 'REQUEST_SIDEBAR_STATUS') {
//     sendResponse({
//       sidebarOpen,
//     });
//   } else if (
//     request.from === 'content' &&
//     request.msg === 'REQUEST_TOGGLE_SIDEBAR'
//   ) {
//     toggleSidebar(request.toStatus);
//   } else if (request.from === 'content' && request.msg === 'WIDTH_CHANGED') {
//     updateSidebarWidth(request.width);
//   } else if (
//     request.from === 'settings' &&
//     request.msg === 'USER_CHANGE_SIDEBAR_LOCATION'
//   ) {
//     const { toStatus } = request;
//     sidebarOnLeft = toStatus;
//     persistSidebarOnLeftStatus(sidebarOnLeft);
//     updateSidebarOnLeftStatus(sidebarOnLeft);
//   } else if (
//     request.from === 'settings' &&
//     request.msg === 'USER_CHANGE_SIDEBAR_SHOULD_SHRINK_BODY'
//   ) {
//     const { toStatus } = request;
//     shouldShrinkBody = toStatus;
//     persistShouldShrinkBodyStatus(shouldShrinkBody);
//     updateShouldShrinkBodyStatus(shouldShrinkBody);
//   }
// });
