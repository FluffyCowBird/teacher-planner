console.log('login.js is loaded and running');

// Get the user input from the login form
console.log('username input and password input success');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Sanitize the user input
console.log('sanitized username and password success');
const sanitizedUsername = new DOMParser().parseFromString(usernameInput.value, 'text/html').documentElement.textContent;
const sanitizedPassword = new DOMParser().parseFromString(passwordInput.value, 'text/html').documentElement.textContent;

// Add the login form submission event listener and sanitization
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const sanitizedUsername = new DOMParser().parseFromString(usernameInput.value, 'text/html').documentElement.textContent;
  const sanitizedPassword = new DOMParser().parseFromString(passwordInput.value, 'text/html').documentElement.textContent;

  // Use sanitizedUsername and sanitizedPassword in your login logic
});
