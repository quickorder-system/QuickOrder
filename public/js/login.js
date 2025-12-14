// Forgot Password Variables
let forgotPasswordUsername = '';

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
    localStorage.setItem('authToken', token);
    console.log('Token saved to localStorage:', localStorage.getItem('authToken'));
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

// ===== FORGOT PASSWORD FUNCTIONS =====

/**
 * Open forgot password modal
 */
function openForgotPasswordModal(e) {
  e.preventDefault();
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) {
    modal.style.display = 'flex';
    resetForgotPasswordForm();
  }
}

/**
 * Close forgot password modal
 */
function closeForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  if (modal) {
    modal.style.display = 'none';
    resetForgotPasswordForm();
  }
}

/**
 * Reset all forgot password form fields
 */
function resetForgotPasswordForm() {
  forgotPasswordUsername = '';
  document.getElementById('forgotUsername').value = '';
  document.getElementById('securityAnswer').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  
  // Show step 1, hide others
  document.getElementById('forgotPasswordStep1').style.display = 'block';
  document.getElementById('forgotPasswordStep2').style.display = 'none';
  document.getElementById('forgotPasswordStep3').style.display = 'none';
  document.getElementById('forgotPasswordSuccess').style.display = 'none';
  
  // Clear errors
  document.getElementById('forgotError1').style.display = 'none';
  document.getElementById('forgotError2').style.display = 'none';
  document.getElementById('forgotError3').style.display = 'none';
}

/**
 * Verify username exists (Step 1)
 */
async function verifyUsernameForReset() {
  const username = document.getElementById('forgotUsername').value.trim();
  const errorDiv = document.getElementById('forgotError1');
  errorDiv.style.display = 'none';

  if (!username) {
    errorDiv.textContent = '❌ Please enter a username';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    const response = await fetch('/api/auth/check-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      throw new Error('Username not found');
    }

    const data = await response.json();
    if (data.exists && (data.role === 'admin' || data.role === 'owner')) {
      forgotPasswordUsername = username;
      // Move to step 2
      document.getElementById('forgotPasswordStep1').style.display = 'none';
      document.getElementById('forgotPasswordStep2').style.display = 'block';
    } else {
      throw new Error('User not found or invalid role');
    }
  } catch (error) {
    errorDiv.textContent = `❌ ${error.message || 'Username verification failed'}`;
    errorDiv.style.display = 'block';
  }
}

/**
 * Verify security question answer (Step 2)
 */
async function verifySecurityQuestion() {
  const answer = document.getElementById('securityAnswer').value;
  const errorDiv = document.getElementById('forgotError2');
  errorDiv.style.display = 'none';

  if (!answer) {
    errorDiv.textContent = '❌ Please enter a date';
    errorDiv.style.display = 'block';
    return;
  }

  // Restaurant opening date: January 1, 2025
  const correctDate = '2025-01-01';
  
  if (answer === correctDate) {
    // Move to step 3
    document.getElementById('forgotPasswordStep2').style.display = 'none';
    document.getElementById('forgotPasswordStep3').style.display = 'block';
  } else {
    errorDiv.textContent = '❌ Incorrect answer. Please try again.';
    errorDiv.style.display = 'block';
  }
}

/**
 * Go back to username step
 */
function backToUsernameStep() {
  document.getElementById('forgotPasswordStep2').style.display = 'none';
  document.getElementById('forgotPasswordStep1').style.display = 'block';
  document.getElementById('forgotError2').style.display = 'none';
}

/**
 * Toggle new password visibility
 */
function toggleNewPassword() {
  const input = document.getElementById('newPassword');
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

/**
 * Toggle confirm password visibility
 */
function toggleConfirmPassword() {
  const input = document.getElementById('confirmPassword');
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

/**
 * Reset password (Step 3)
 */
async function resetPassword() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorDiv = document.getElementById('forgotError3');
  errorDiv.style.display = 'none';

  // Validation
  if (!newPassword || !confirmPassword) {
    errorDiv.textContent = '❌ Please fill in both password fields';
    errorDiv.style.display = 'block';
    return;
  }

  if (newPassword.length < 6) {
    errorDiv.textContent = '❌ Password must be at least 6 characters long';
    errorDiv.style.display = 'block';
    return;
  }

  if (newPassword !== confirmPassword) {
    errorDiv.textContent = '❌ Passwords do not match';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: forgotPasswordUsername,
        newPassword: newPassword
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Password reset failed');
    }

    // Show success step
    document.getElementById('forgotPasswordStep3').style.display = 'none';
    document.getElementById('forgotPasswordSuccess').style.display = 'block';
  } catch (error) {
    errorDiv.textContent = `❌ ${error.message || 'Failed to reset password'}`;
    errorDiv.style.display = 'block';
  }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
  const modal = document.getElementById('forgotPasswordModal');
  if (e.target === modal) {
    closeForgotPasswordModal();
  }
});

// Expose functions to global scope for onclick handlers
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.verifyUsernameForReset = verifyUsernameForReset;
window.verifySecurityQuestion = verifySecurityQuestion;
window.backToUsernameStep = backToUsernameStep;
window.resetPassword = resetPassword;
window.toggleNewPassword = toggleNewPassword;
window.toggleConfirmPassword = toggleConfirmPassword;