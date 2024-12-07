import firebase from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
  // Your Firebase configuration goes here
};

firebase.initializeApp(firebaseConfig);

const emailInput = document.getElementById('email-input');
const emailForm = document.getElementById('email-form');
const appContainer = document.getElementById('app');
const emailContainer = document.getElementById('email-container');

// Handle user state changes
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, show the app container
    emailContainer.style.display = 'none';
    appContainer.style.display = 'block';
  } else {
    // User is signed out, show the email container
    emailContainer.style.display = 'block';
    appContainer.style.display = 'none';
  }
});

emailForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value;

  const actionCodeSettings = {
    url: 'https://your-github-io-site.github.io',
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.example.ios'
    },
    android: {
      packageName: 'com.example.android',
      installApp: true,
      minimumVersion: '12'
    },
    dynamicLinkDomain: 'example.page.link'
  };

  try {
    await firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    alert('Sign-in link sent to your email. Please check your inbox.');
  } catch (error) {
    alert('Failed to send sign-in link. Please try again.');
  }
});

if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    email = window.prompt('Please provide your email for confirmation');
  }

  try {
    await firebase.auth().signInWithEmailLink(email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    // User is now signed in
  } catch (error) {
    alert('Failed to complete sign-in. Please try again.');
  }
}
