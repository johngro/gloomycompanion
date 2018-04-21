import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

export const useFirebase = false;

// Initialize Firebase
const config = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
};

function init() {
  if (useFirebase) {
    return firebase.initializeApp(config);
  }
  return null;
}

export default init();
