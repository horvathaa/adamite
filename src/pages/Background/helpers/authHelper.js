import {
  auth,
  updateUserProfile,
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  getElasticApiKey,
} from '../../../firebase/index';

let currentUser = null;



auth.onAuthStateChanged(user => {
  currentUser = user === null ? null : { uid: user.uid, email: user.email };
  broadcastAuthStatus(currentUser);
  if (user !== null) {
    updateUserProfile();
    getElasticApiKey().then(function (e) {
      chrome.storage.sync.set({
        'ElasticAPIKey': e,
      });
      // console.log("set");
    })
  }
  else {
    chrome.storage.sync.set({
      'ElasticAPIKey': '',
    });
  }
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
export function getCurrentUser(request, sender, sendResponse) {
  console.log('in get current user', currentUser);
  sendResponse({ payload: { currentUser } });
}
export function userSignIn(request, sender, sendResponse) {
  const { email, password } = request.payload;
  signInWithEmailAndPassword(email, password)
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
      sendResponse({ ...err, error: true });
    });
}

export function userSignUp(request, sender, sendResponse) {
  const { email, password } = request.payload;
  signUpWithEmailAndPassword(email, password)
    .then(result => {
      console.log(result);
    })
    .catch(err => {
      console.log(err);
      sendResponse({ ...err, error: true });
    });
}
export function userSignOut(request, sender, sendResponse) {
  signOut();
}

export function userForgotPwd(request, sender, sendResponse) {
  const { email } = request.payload;
  auth
    .sendPasswordResetEmail(email)
    .then(result => {
      console.log(result);
      sendResponse({ error: false });
    })
    .catch(err => {
      console.log(err);
      sendResponse({ ...err, error: true });
    });
}



// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.msg === 'GET_CURRENT_USER') {
//     sendResponse({ payload: { currentUser } });
//   } else if (request.msg === 'USER_SIGNUP') {
//     const { email, password } = request.payload;
//     signUpWithEmailAndPassword(email, password)
//       .then(result => {
//         console.log(result);
//       })
//       .catch(err => {
//         console.log(err);
//         sendResponse({ ...err, error: true });
//       });
//   } else if (request.msg === 'USER_SIGNIN') {
//     const { email, password } = request.payload;
//     signInWithEmailAndPassword(email, password)
//       .then(result => {
//         console.log(result);
//       })
//       .catch(err => {
//         console.log(err);
//         sendResponse({ ...err, error: true });
//       });
//   } else if (request.msg === 'USER_SIGNOUT') {
//     signOut();
//   } else if (request.msg === 'USER_FORGET_PWD') {
//     const { email } = request.payload;
//     auth
//       .sendPasswordResetEmail(email)
//       .then(result => {
//         console.log(result);
//         sendResponse({ error: false });
//       })
//       .catch(err => {
//         console.log(err);
//         sendResponse({ ...err, error: true });
//       });
//   }
//   return true;
// });
