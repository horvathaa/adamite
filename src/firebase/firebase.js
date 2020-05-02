import * as firebase from 'firebase/app';
import { config } from './secrets.app';
import 'firebase/firestore';
import 'firebase/auth';

firebase.initializeApp(config);

firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

export default firebase;
