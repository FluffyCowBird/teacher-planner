import firebase from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
  // Your Firebase configuration goes here
};

firebase.initializeApp(firebaseConfig);

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
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

// Login form event listener
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

// Registration form event listener
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');

  try {
    await firebase.auth().createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    alert('Registration successful! You can now log in.');
  } catch (error) {
    alert('Failed to create an account. Please try again.');
  }
});
