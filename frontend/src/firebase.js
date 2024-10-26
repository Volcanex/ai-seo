import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDwUE2MnJnwzxKL_qYAi-l-kBi6ES9I3pU",
    authDomain: "llmo-4c6f8.firebaseapp.com",
    projectId: "llmo-4c6f8",
    storageBucket: "llmo-4c6f8.appspot.com",
    messagingSenderId: "415622641424",
    appId: "1:415622641424:web:0386ee784b7225c2629795",
    measurementId: "G-N1J2QXNQT8"
  };
  
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);