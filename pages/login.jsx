import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';

export default function LoginPage() {
  useEffect(() => {
    const initializeFirebase = async () => {
      const { initializeApp } = await import('firebase/app');
      const { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } 
        = await import('firebase/auth');

      const firebaseConfig = {
        apiKey: "AIzaSyBg2AtYUN_QXiUr-SxfNmda9DZwoh8HJ9g",
        authDomain: "teacher-planner-3e51a.firebaseapp.com",
        projectId: "teacher-planner-3e51a",
        storageBucket: "teacher-planner-3e51a.firebasestorage.app",
        messagingSenderId: "52595844350",
        appId: "1:52595844350:web:1de975e598d5ce70a131af",
        measurementId: "G-YHX3LGFLEL"
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const authorizedEmail = 'nbeuttenmueller@sau29.org';

      const emailForm = document.getElementById('email-form');
      emailForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email-input').value;
        
        if (email === authorizedEmail) {
          const actionCodeSettings = {
            url: 'https://fluffycowbird.github.io/teacher-planner/login',
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

      onAuthStateChanged(auth, (user) => {
        const emailContainer = document.getElementById('email-container');
        const appContainer = document.getElementById('app');
        if (user) {
          emailContainer.style.display = 'none';
          appContainer.style.display = 'block';
        } else {
          emailContainer.style.display = 'block';
          appContainer.style.display = 'none';
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
    };

    initializeFirebase();
  }, []);

  return (
    <>
      <Script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js" />
      <Script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js" />
      <div>
        <div id="email-container">
          <h1>Sign in with your email</h1>
          <form id="email-form">
            <label htmlFor="email-input">Email:</label>
            <input type="email" id="email-input" name="email" required />
            <button type="submit">Send Sign-in Link</button>
          </form>
        </div>
        <div id="app" style={{ display: 'none' }}>
          {/* Your existing site content */}
        </div>
      </div>
    </>
  );
}
