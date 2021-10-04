import {
  emailAuthProvider,
  getCurrentUser as fbGetCurrentUser,
  auth,
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signInWithGithub,
  signOut,
} from '../../../firebase/index';

let currentUser = null;

auth.onAuthStateChanged(user => {
  currentUser = user === null ? null : { uid: user.uid, email: user.email, photoURL: user.photoURL, displayName: user.displayName };
  broadcastAuthStatus(currentUser);

  if (user !== null) {
    if(!user.emailVerified){
      currentUser = null;
      broadcastAuthStatus(null);
      return;
    }
    // getElasticApiKey().then(function (e) {
    //   chrome.storage.sync.set({
    //     'ElasticAPIKey': e,
    //   });
    // })
  }
  else {
    // chrome.storage.sync.set({
    //   'ElasticAPIKey': '',
    // });
    chrome.storage.local.set({ 'groups': [] });
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

export function handleLinkingAccounts(request, sender, sendResponse) {
  const { email, pass } = request.payload;
  if(email && pass && email !== "" && pass !== "") {
    const credential = emailAuthProvider.credential(email, pass);
    fbGetCurrentUser().linkWithCredential(credential).then((userCred) => {
      console.log('Successfully linked accounrts')
    })
    .catch((error) => {
      console.error('Unable to link accounts', error);
    })
  }
  
}

export function getUser() {
  return currentUser;
}

export function getCurrentUser(request, sender, sendResponse) {
  sendResponse({ payload: { currentUser } });
}
export function userSignIn(request, sender, sendResponse) {
  const { email, password } = request.payload;
  signInWithEmailAndPassword(email, password)
    .then(result => {
      if(!result.user.emailVerified){ 
         alert("Email has not been validated. Cannot sign you in.");
         auth.signOut()
       }

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
      if(result.additionalUserInfo.isNewUser) {
        chrome.runtime.sendMessage({
          msg: 'PROMPT_FOR_EMAIL_PASS',
          from: 'background'
        })
      }

      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = credential.accessToken;
      // The signed-in user info.
      var user = result.user;

      let photoURL = null
      let displayName = null
      let email = null;
      // console.log("FINISHED", user, token, credential)
      user.providerData.forEach((profile) => {
        email = profile.email
        photoURL = profile.photoURL;
        displayName = profile.displayName;
      });

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
      if(result.additionalUserInfo.isNewUser) {
        chrome.runtime.sendMessage({
          msg: 'PROMPT_FOR_EMAIL_PASS',
          from: 'background'
        })
      }

      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      // ...
    }).catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      console.log('error code', error.code);
      if(error.code === 'auth/account-exists-with-different-credential') {
        
      }
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
    .then(userCredential => {
      // send verification mail.
      userCredential.user.sendEmailVerification();
      auth.signOut();
      alert("Email sent With Validation link");
      console.log(userCredential);
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