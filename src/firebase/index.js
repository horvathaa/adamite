import firebase from './firebase';
require("firebase/functions")

export const DB_COLLECTIONS = {
  USERS: 'users',
  ANNOTATIONS: 'annotations',
  GROUPS: 'groups'
};

export let db = firebase.firestore();
export let auth = firebase.auth();
export const provider = new firebase.auth.GoogleAuthProvider();
export const getCurrentUser = () => firebase.auth().currentUser;
export const getCurrentUserId = () => {
  let currentUser = getCurrentUser();
  if (currentUser) {
    return currentUser.uid;
  } else {
    return null;
  }
};

export const getElasticApiKey = () => {
  return firebase.functions().httpsCallable('elasticApiAuth')({}).then((result) => { return result });
}

export * from './functions/userFunctions';
export * from './functions/annotationFunctions';
