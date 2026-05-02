// Firebase SDKs loaded via CDN in HTML files before this script
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBl_8sEYBbSvOUxYBEMycjJ9323NxPX1a8",
  authDomain: "coc-voting-platform.firebaseapp.com",
  projectId: "coc-voting-platform",
  storageBucket: "coc-voting-platform.firebasestorage.app",
  messagingSenderId: "929921244331",
  appId: "1:929921244331:web:cf15f28a7dcbc5b42debee",
  measurementId: "G-4NVV73SR6L"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// Backend endpoint used to verify Paystack transactions and record votes securely.
// Replace with your deployed API URL.
const VOTE_API_URL =
  window.VOTE_API_URL ||
  "/api/verify-vote";