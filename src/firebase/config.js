import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB87mpvHRLT1bjn8Tcqor7qzulV-T68vE0",
  authDomain: "chat-40d42.firebaseapp.com",
  databaseURL: "https://chat-40d42-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "chat-40d42",
  storageBucket: "chat-40d42.appspot.com", // ✅ FIXED HERE
  messagingSenderId: "1080730028272",
  appId: "1:1080730028272:web:18a313652e0ee721035a35",
  measurementId: "G-HG8E0J3W2W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
