import { DB_COLLECTIONS, db, getCurrentUserId } from '../index';
import firebase from '../firebase';


export const searchFirebaseFunction = (userQuery) => {
  console.log("HERE!!!")
  // const a = Firebase.functions.httpsCallable("httpsOnCall");
  // a({ a: 1, b: "testing", c: true }).then(result => {
  //   console.log(result);
  // });
    return firebase.functions().httpsCallable('search')({userQuery}).then((result) => { return result });
  }