import {
  DB_COLLECTIONS,
  db,
  auth,
  getCurrentUser,
  getCurrentUserId,
} from '../index';

// https://firebase.google.com/docs/auth/web/password-auth
export const signUpWithEmailAndPassword = (email, password) => {
  auth.createUserWithEmailAndPassword(email, password);
};

export const signInWithEmailAndPassword = (email, password) => {
  auth.signInWithEmailAndPassword(email, password);
};

export const updateUserProfile = () => {
  let user = getCurrentUser();
  db.collection(DB_COLLECTIONS.USERS)
    .doc(getCurrentUserId())
    .set({ ...user }, { merge: true });
};

export const getUserProfileById = uid => {
  return db.collection(DB_COLLECTIONS.USERS).doc(uid);
};
