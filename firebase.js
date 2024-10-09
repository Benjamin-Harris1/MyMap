// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAP6PANIzmzh1iAsYbAn9Y-j1jnfPdTrbo",
  authDomain: "mymap-f2eb3.firebaseapp.com",
  projectId: "mymap-f2eb3",
  storageBucket: "mymap-f2eb3.appspot.com",
  messagingSenderId: "809129746780",
  appId: "1:809129746780:web:b79191f3b89a469b05e199"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
