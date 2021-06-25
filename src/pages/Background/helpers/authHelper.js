import {
  auth,
  updateUserProfile,
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  getElasticApiKey
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

export function userGoogleSignIn(request, sender, sendResponse) {
  signInWithGoogle()
  .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;

      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      console.log("FINISHED", user, token, credential)
      // ...
    }).catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      console.log(errorMessage);
      sendResponse({ errorMessage, error: true });
    });
}

export function githubUserSignIn(request, sender, sendResponse) {
  signInWithGithub()
  .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;

      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      console.log("FINISHED", user, token, credential)
      // ...
    }).catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      console.log(errorMessage);
      sendResponse({ errorMessage, error: true });
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