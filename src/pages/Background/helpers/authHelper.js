import {
  auth,
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '../../../firebase/index';

let currentUser = null;

auth.onAuthStateChanged(user => {
  // console.log(user);
  currentUser = user === null ? null : { uid: user.uid, email: user.email };
  broadcastAuthStatus(currentUser);
});

const broadcastAuthStatus = user => {
  chrome.runtime.sendMessage({
    from: 'background',
    msg: 'USER_AUTH_STATUS_CHANGED',
    payload: {
      currentUser: user,
    },
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'GET_CURRENT_USER') {
    sendResponse({ payload: { currentUser } });
  } else if (request.msg === 'USER_SIGNUP') {
    const { email, password } = request.payload;
    signUpWithEmailAndPassword(email, password)
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
        sendResponse({ ...err, error: true });
      });
  } else if (request.msg === 'USER_SIGNIN') {
    const { email, password } = request.payload;
    signInWithEmailAndPassword(email, password)
      .then(result => {
        console.log(result);
      })
      .catch(err => {
        console.log(err);
        sendResponse({ ...err, error: true });
      });
  } else if (request.msg === 'USER_SIGNOUT') {
    signOut();
  }

  return true;
});

setTimeout(() => {
  signOut();
}, 3000);
