import { stateService } from './services/state.service.js';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  
  // Hide error message
  errorDiv.classList.remove('show');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Login error response:', errorData);
      throw new Error(errorData.message || 'Invalid credentials');
    }

    const { token, user } = await response.json();
    console.log('Token received:', token);
    localStorage.setItem('token', token);
    console.log('Token saved to localStorage:', localStorage.getItem('token'));
    stateService.setUser(user);

    const btn = document.querySelector('.login-btn');
    btn.innerHTML = '✓ Success! Redirecting...';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

    setTimeout(() => {
      if (user.role === 'owner') {
        window.location.href = 'Owner.html';
      } else {
        window.location.href = 'Admin.html';
      }
    }, 800);

  } catch (error) {
    errorDiv.classList.add('show');
    document.querySelector('.login-box').style.animation = 'none';
    setTimeout(() => {
      document.querySelector('.login-box').style.animation = '';
    }, 10);
  }
});

function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.querySelector('.password-toggle');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
}

// Hide error message when user starts typing
document.querySelectorAll('.login-input').forEach(input => {
  input.addEventListener('input', function() {
    document.getElementById('loginError').classList.remove('show');
  });
});