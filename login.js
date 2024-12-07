import firebase from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
  // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
};

firebase.initializeApp(firebaseConfig);

const authorizedEmail = 'nbeuttenmueller@sau29.org';
const emailInput = document.getElementById('email-input');
const emailForm = document.getElementById('email-form');
const appContainer = document.getElementById('app');
const emailContainer = document.getElementById('email-container');

firebase.auth().onAuthStateChanged((user) => {
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
      handleCodeInApp: true,
      iOS: {
        bundleId: 'com.example.ios'
      },
      android: {
        packageName: 'com.example.android',
        installApp: true,
        minimumVersion: '12'
      },
      dynamicLinkDomain: 'https://fluffycowbird.github.io/teacher-planner/'
    };

    try {
      await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      alert('Sign-in link sent to your email. Please check your inbox.');
    } catch (error) {
      alert('Failed to send sign-in link. Please try again.');
    }
  } else {
    alert('Sorry, this sign-in option is only available for your authorized email.');
  }
});

if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email || email !== authorizedEmail) {
    email = window.prompt('Please provide your authorized email for confirmation');
  }

  try {
    await firebase.auth().signInWithEmailLink(email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    // User is now signed in
  } catch (error) {
    alert('Failed to complete sign-in. Please try again.');
  }
}
