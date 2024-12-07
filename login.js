import firebase from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
  // Your actual Firebase configuration goes here
};

firebase.initializeApp(firebaseConfig);

const loginForm = document.getElementById('login-form');
const appContainer = document.getElementById('app');
const loginContainer = document.getElementById('login-container');

// Handle user state changes
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is signed in, show the app container
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
  } else {
    // User is signed out, show the login container
    loginContainer.style.display = 'block';
    appContainer.style.display = 'none';
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  try {
    await firebase.auth().signInWithEmailAndPassword(
      usernameInput.value,
      passwordInput.value
    );
  } catch (error) {
    alert('Invalid username or password. Please try again.');
  }
});
