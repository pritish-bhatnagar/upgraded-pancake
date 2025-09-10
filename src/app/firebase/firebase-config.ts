// src/app/firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBculY5hyheQchbl2XmrG-itFET3Qfomvg",
    authDomain: "water-6abd4.firebaseapp.com",
    projectId: "water-6abd4",
    storageBucket: "water-6abd4.firebasestorage.app",
    messagingSenderId: "834863036587",
    appId: "1:834863036587:web:fce1ca1fc3cc6aba1b1fee"
  };

const cloudinary = {
    cloudName: 'your-cloud-name',
    uploadPreset: 'your-upload-preset'
  }
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
  const firestore = getFirestore(app);


export { auth, googleProvider, firebaseConfig, cloudinary, firestore, app };