import * as firebase from 'firebase/app';
import { config } from './secrets.app';
import 'firebase/firestore';
import 'firebase/auth';

firebase.initializeApp(config);

export default firebase;
