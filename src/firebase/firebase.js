import * as firebase from 'firebase/app';
//import { config } from './secrets.js';
import 'firebase/firestore';
import 'firebase/auth';


firebase.initializeApp({
    apiKey: "AIzaSyBr2aTirEIFZcJlP6Lbmh33jjPRT8HTViE",
    authDomain: "mhci2021-dev.firebaseapp.com",
    databaseURL: "https://mhci2021-dev.firebaseio.com",
    projectId: "mhci2021-dev",
    storageBucket: "mhci2021-dev.appspot.com",
    messagingSenderId: "779499217559",
    appId: "1:779499217559:web:9ef7b801718001cddd7fd2",
    measurementId: "G-LWSGDPPLDW"
});
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

export default firebase;
