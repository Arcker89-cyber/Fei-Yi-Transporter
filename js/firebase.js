// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAq1Ky538uCIjrPIcZb4wtEFaDfAN_X9n8",
  authDomain: "fei-yi-transporter.firebaseapp.com",
  projectId: "fei-yi-transporter",
  storageBucket: "fei-yi-transporter.firebasestorage.app",
  messagingSenderId: "441085276652",
  appId: "1:441085276652:web:4b04f2cc974d0b4e4290c9",
  measurementId: "G-C4W31MNNNV"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
