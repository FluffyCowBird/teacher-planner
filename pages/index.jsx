import { useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import TeacherPlanner from '../components/TeacherPlanner';
import '../styles/globals.css';

export default function HomePage() {
  const firebaseConfig = {
    apiKey: "AIzaSyBg2AtYUN_QXiUr-SxfNmda9DZwoh8HJ9g",
    authDomain: "teacher-planner-3e51a.firebaseapp.com",
    projectId: "teacher-planner-3e51a",
    storageBucket: "teacher-planner-3e51a.firebasestorage.app",
    messagingSenderId: "52595844350",
    appId: "1:52595844350:web:1de975e598d5ce70a131af",
    measurementId: "G-YHX3LGFLEL"
  };

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    onAuthStateChanged(auth, (user) => {
      if (user) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app').style.display = 'block';
      } else {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('app').style.display = 'none';
      }
    });
  }, []);

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth).catch((error) => {
      console.error('Sign out error:', error);
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      document.getElementById('password-input').value = '';
    } catch (error) {
      console.error('Login error:', error);
      alert('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div id="login-container" className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Teacher Planner</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700">Email:</label>
            <input 
              type="email" 
              id="email-input" 
              defaultValue="nbeuttenmueller@sau29.org" 
              readOnly 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="password-input" className="block text-sm font-medium text-gray-700">Password:</label>
            <input 
              type="password" 
              id="password-input" 
              placeholder="Enter your password" 
              required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
      
      <div id="app" style={{ display: 'none' }} className="min-h-screen">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Teacher Planner</h1>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <TeacherPlanner />
      </div>
    </div>
  );
}
