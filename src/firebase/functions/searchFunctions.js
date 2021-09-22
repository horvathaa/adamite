import { DB_COLLECTIONS, db, getCurrentUserId } from '../index';
import firebase from '../firebase';


export const searchElastic = (userQuery) => {
    return firebase.functions().httpsCallable('elasticApiAuth')({}).then((result) => { return result });
  }