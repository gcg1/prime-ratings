const firebaseConfig = {
  apiKey: "AIzaSyCVixr2uuP7DkyioVMSebg7DVZ0zqJIB6w",
  authDomain: "prime-ratings.firebaseapp.com",
  databaseURL: "https://prime-ratings.firebaseio.com",
  projectId: "prime-ratings",
  storageBucket: "prime-ratings.appspot.com",
  messagingSenderId: "975672744263",
  appId: "1:975672744263:web:14e358179c4790b194d462",
  measurementId: "G-YPW428632J",
};

// Initialize Firebase and Firestore
firebase.initializeApp(firebaseConfig);
let db = firebase.firestore();
