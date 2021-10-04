import firebase from '../firebase';


export const searchFirebaseFunction = (userQuery) => {
  return firebase.functions().httpsCallable('search')({ userQuery }).then((result) => { return result });
}