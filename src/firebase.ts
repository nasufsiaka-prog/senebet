import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYWnO8utSkGYKFOFvo-W-l-IlZbdroHFo",
  authDomain: "senebet-b33d0.firebaseapp.com",
  projectId: "senebet-b33d0",
  storageBucket: "senebet-b33d0.firebasestorage.app",
  messagingSenderId: "669710438127",
  appId: "1:669710438127:web:82c48c5ced3abe5e8b951a"
};

export const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
