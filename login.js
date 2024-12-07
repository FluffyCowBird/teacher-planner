window.addEventListener('DOMContentLoaded', () => {
  console.log('login.js is loaded and running');

  // Get the user input from the login form
  console.log('Checking username and password input elements...');
  const usernameInput = document.getElementById('username');
  console.log('usernameInput:', usernameInput);
  const passwordInput = document.getElementById('password');
  console.log('passwordInput:', passwordInput);

  if (usernameInput === null || passwordInput === null) {
    console.error('Failed to find username or password input elements!');
  } else {
    console.log('username input and password input success');

    // Sanitize the user input
    console.log('sanitized username and password success');
    const sanitizedUsername = new DOMParser().parseFromString(usernameInput.value, 'text/html').documentElement.textContent;
    const sanitizedPassword = new DOMParser().parseFromString(passwordInput.value, 'text/html').documentElement.textContent;

    // Add the login form submission event listener and sanitization
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Use sanitizedUsername and sanitizedPassword in your login logic
    });
  }
});
