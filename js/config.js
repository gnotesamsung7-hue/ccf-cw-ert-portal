// CCF Commonwealth ERT portal settings.
//
// Offline mode: leave firebase as null. Records are saved in this browser only.
// Online mode: paste the config of your Firebase web app below (see README.md).
// The config must include databaseURL.

window.ERT_CONFIG = {
  firebase: null

  /* Example of what to paste (replace the whole "firebase: null" line):
  firebase: {
    apiKey: "AIza...",
    authDomain: "ccf-ert.firebaseapp.com",
    databaseURL: "https://ccf-ert-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ccf-ert",
    storageBucket: "ccf-ert.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef"
  }
  */
};
