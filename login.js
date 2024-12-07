window.addEventListener('DOMContentLoaded', () => {
  console.log('login.js is loaded and running');
  // Get the user input from the login form
  console.log('username input and password input success');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // Sanitize the user input
  console.log('sanitized username and password success');
  const sanitizedUsername = new DOMParser().parseFromString(usernameInput.value, 'text/html').documentElement.textContent;
  const sanitizedPassword = new DOMParser().parseFromString(passwordInput.value, 'text/html').documentElement.textContent;

  // Now you can use the sanitizedUsername and sanitizedPassword variables instead of the original user input
  // in your login logic
});
