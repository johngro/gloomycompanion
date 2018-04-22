import firebase from 'firebase/app';

import config from './config';

export const useFirebase = config.useFirebase;

// Initialize Firebase
function init() {
  if (useFirebase) {
    return firebase.initializeApp(config.firebase);
  }
  return null;
}

export default init();
