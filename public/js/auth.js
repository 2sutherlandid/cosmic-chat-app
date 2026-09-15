/**
 * Authentication Module
 * Handles user login, registration, and token management
 */

// Authentication State
let authToken = null;
let currentUser = null;

// DOM Elements
const authModal = document.getElementById('auth-modal');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');

/**
 * Initialize authentication on page load
 */
function initializeAuth() {
  // Check if user has saved token
  const savedToken = localStorage.getItem('cosmic_token');
  const savedUser = localStorage.getItem('cosmic_user');

  if (savedToken && savedUser) {
    authToken = savedToken;
    currentUser = JSON.parse(savedUser);
    verifyTokenValidity().then((valid) => {
      if (valid) {
        showApp();
      } else {
        clearAuth();
        showAuthModal();
      }
    });
  } else {
    showAuthModal();
  }

  // Setup form listeners
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showLoginMessage('Please fill in all fields', 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showLoginMessage(data.error || 'Login failed', 'error');
      return;
    }

    // Save token and user
    authToken = data.token;
    currentUser = data.user;
    
    localStorage.setItem('cosmic_token', authToken);
    localStorage.setItem('cosmic_user', JSON.stringify(currentUser));

    // Clear form
    loginForm.reset();
    showLoginMessage('Login successful!', 'success');

    // Switch to app after short delay
    setTimeout(() => {
      showApp();
    }, 500);

  } catch (error) {
    console.error('Login error:', error);
    showLoginMessage('Network error. Please try again.', 'error');
  }
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-password-confirm').value;

  // Validation
  if (!username || !password || !confirmPassword) {
    showRegisterMessage('Please fill in all fields', 'error');
    return;
  }

  if (username.length < 3 || username.length > 20) {
    showRegisterMessage('Username must be 3-20 characters', 'error');
    return;
  }

  if (password.length < 6) {
    showRegisterMessage('Password must be at least 6 characters', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showRegisterMessage('Passwords do not match', 'error');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showRegisterMessage(data.error || 'Registration failed', 'error');
      return;
    }

    // Save token and user
    authToken = data.token;
    currentUser = data.user;
    
    localStorage.setItem('cosmic_token', authToken);
    localStorage.setItem('cosmic_user', JSON.stringify(currentUser));

    // Clear form
    registerForm.reset();
    showRegisterMessage('Account created successfully!', 'success');

    // Switch to app after short delay
    setTimeout(() => {
      showApp();
    }, 500);

  } catch (error) {
    console.error('Registration error:', error);
    showRegisterMessage('Network error. Please try again.', 'error');
  }
}

/**
 * Verify token validity with server
 */
async function verifyTokenValidity() {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

/**
 * Show login message
 */
function showLoginMessage(message, type) {
  loginMessage.textContent = message;
  loginMessage.className = `auth-message ${type}`;
}

/**
 * Show register message
 */
function showRegisterMessage(message, type) {
  registerMessage.textContent = message;
  registerMessage.className = `auth-message ${type}`;
}

/**
 * Switch authentication tab
 */
function switchAuthTab(tab) {
  // Update active tab button
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Update active form
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.toggle('active', form.dataset.tab === tab);
  });

  // Clear messages
  loginMessage.textContent = '';
  registerMessage.textContent = '';
}

/**
 * Show auth modal
 */
function showAuthModal() {
  authModal.classList.remove('hidden');
  appLayout.classList.add('hidden');
}

/**
 * Show app
 */
function showApp() {
  authModal.classList.add('hidden');
  appLayout.classList.remove('hidden');
  
  // Initialize app components
  initializeApp();
}

/**
 * Clear authentication data
 */
function clearAuth() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('cosmic_token');
  localStorage.removeItem('cosmic_user');
}

/**
 * Logout user
 */
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    leaveVoiceChannel();
    clearAuth();
    location.reload();
  }
}

/**
 * Get authorization header
 */
function getAuthHeader() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', initializeAuth);
