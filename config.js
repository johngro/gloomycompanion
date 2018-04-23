import localConfig from './config.local'; // eslint-disable-line

export default {
  useFirebase: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
  },
  ...localConfig,
};
