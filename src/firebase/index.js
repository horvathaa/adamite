import firebase from './firebase';

export const DB_COLLECTIONS = {
  USERS: 'users',
  ANNOTATIONS: 'annotations',
};

export let db = firebase.firestore();
export let auth = firebase.auth();
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
