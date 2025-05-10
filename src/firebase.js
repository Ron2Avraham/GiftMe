import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAEdXXMRTR6gcbVRpYdTSnXtagAf7O2N1g",
  authDomain: "giftme-94370.firebaseapp.com",
  projectId: "giftme-94370",
  storageBucket: "giftme-94370.firebasestorage.app",
  messagingSenderId: "257741744238",
  appId: "1:257741744238:web:f50ee2f16e11bb20a19e7f",
  measurementId: "G-RTBZCY17WJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider(); 