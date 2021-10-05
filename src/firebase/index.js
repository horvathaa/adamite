import firebase from './firebase';
require("firebase/functions")

export const DB_COLLECTIONS = {
  USERS: 'users',
  ANNOTATIONS: 'annotations',
  GROUPS: 'groups'
};

export let emailAuthProvider = firebase.auth.EmailAuthProvider;
export let db = firebase.firestore();
export let auth = firebase.auth();
export const provider = new firebase.auth.GoogleAuthProvider();
export const githubProvider = new firebase.auth.GithubAuthProvider();
export const getCurrentUser = () => firebase.auth().currentUser;
export const getCurrentUserId = () => {
  let currentUser = getCurrentUser();
  if (currentUser) {
    return currentUser.uid;
  } else {
    return null;
  }
};

export * from './functions/userFunctions';
export * from './functions/annotationFunctions';
export * from './functions/searchFunctions';
