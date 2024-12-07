import firebase from 'firebase/app';
import 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBg2AtYUN_QXiUr-SxfNmda9DZwoh8HJ9g",
  authDomain: "teacher-planner-3e51a.firebaseapp.com",
  projectId: "teacher-planner-3e51a",
  storageBucket: "teacher-planner-3e51a.firebasestorage.app",
  messagingSenderId: "52595844350",
  appId: "1:52595844350:web:1de975e598d5ce70a131af",
  measurementId: "G-YHX3LGFLEL"
};

firebase.initializeApp(firebaseConfig);

const loginForm = document.getElementById('login-form');
const appContainer = document.getElementById('app');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  try {
    await firebase.auth().signInWithEmailAndPassword(
      usernameInput.value,
      passwordInput.value
    );

    // Login successful, show the app container
    document.getElementById('login-container').style.display = 'none';
    appContainer.style.display = 'block';
  } catch (error) {
    alert('Invalid username or password. Please try again.');
  }
});
