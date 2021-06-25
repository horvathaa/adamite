import {
  DB_COLLECTIONS,
  db,
  auth,
  getCurrentUser,
  getCurrentUserId,
  provider,
  githubProvider
} from '../index';

// https://firebase.google.com/docs/auth/web/password-auth
export const signUpWithEmailAndPassword = (email, password) => {
  return auth.createUserWithEmailAndPassword(email, password);
};

export const signInWithEmailAndPassword = (email, password) => {
  return auth.signInWithEmailAndPassword(email, password);
};

export const signInWithGoogle = () => {
  return auth.signInWithPopup(provider);
};

export const signInWithGithub = () => {
  return auth.signInWithPopup(githubProvider);
}

export const signOut = () => {
  return auth.signOut();
};

export const updateUserProfile = (user = getCurrentUser()) => {
  db.collection(DB_COLLECTIONS.USERS)
    .doc(user.uid)
    .set(
      { uid: user.uid, email: user.email, githubProfileLink: '' },
      { merge: true }
    );
};

// export const getUserProfileById = uid => {
//   return db.collection(DB_COLLECTIONS.USERS).doc(uid);
// };
