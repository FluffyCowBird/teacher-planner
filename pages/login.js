// Import statements
import { initializeApp } from "firebase/app";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBg2AtYUN_QXiUr-SxfNmda9DZwoh8HJ9g",
  authDomain: "teacher-planner-3e51a.firebaseapp.com",
  projectId: "teacher-planner-3e51a",
  storageBucket: "teacher-planner-3e51a.firebasestorage.app",
  messagingSenderId: "52595844350",
  appId: "1:52595844350:web:1de975e598d5ce70a131af",
  measurementId: "G-YHX3LGFLEL"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const authorizedEmail = 'nbeuttenmueller@sau29.org';
const emailInput = document.getElementById('email-input');
const emailForm = document.getElementById('email-form');
const appContainer = document.getElementById('app');
const emailContainer = document.getElementById('email-container');

onAuthStateChanged(auth, (user) => {
  if (user) {
    emailContainer.style.display = 'none';
    appContainer.style.display = 'block';
  } else {
    emailContainer.style.display = 'block';
    appContainer.style.display = 'none';
  }
});

emailForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = emailInput.value;
  
  if (email === authorizedEmail) {
    const actionCodeSettings = {
      url: 'https://fluffycowbird.github.io/teacher-planner/',
      handleCodeInApp: true
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      alert('Sign-in link sent to your email. Please check your inbox.');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send sign-in link. Please try again.');
    }
  } else {
    alert('Sorry, this sign-in option is only available for your authorized email.');
  }
});

if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email || email !== authorizedEmail) {
    email = window.prompt('Please provide your authorized email for confirmation');
  }

  if (email) {
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to complete sign-in. Please try again.');
    }
  }
}
