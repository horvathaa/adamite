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
  console.log("UPDATING", user)
  db.collection(DB_COLLECTIONS.USERS)
    .doc(user.uid)
    .set(
      { uid: user.uid, 
        email: user.email, 
        githubProfileLink: '', 
        photoURL: user.photoURL, 
        displayName: user.displayName },
      { merge: true }
    );
};
