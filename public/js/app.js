/**
 * Main Application Module
 * Orchestrates all application components and handles UI interactions
 */

// DOM Elements
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const settingsUsername = document.getElementById('settings-username');
const settingsModal = document.getElementById('settings-modal');
const passwordModal = document.getElementById('password-modal');
const usersModal = document.getElementById('users-modal');
const passwordForm = document.getElementById('password-form');
const passwordMessage = document.getElementById('password-message');

/**
 * Initialize the application
 */
function initializeApp() {
  // Update user info
  updateUserInfo();

  // Initialize messaging
  initializeMessaging();

  // Setup modal listeners
  setupModalListeners();

  // Setup keyboard shortcuts
  setupKeyboardShortcuts();

  // Log initialization
  console.log('Application initialized');
}

/**
 * Update user info in UI
 */
function updateUserInfo() {
  const initial = currentUser.username.charAt(0).toUpperCase();
  userAvatar.textContent = initial;
  userName.textContent = currentUser.username;
  settingsUsername.textContent = currentUser.username;
}

/**
 * Setup modal event listeners
 */
function setupModalListeners() {
  passwordForm.addEventListener('submit', handleChangePassword);
}

/**
 * Open settings modal
 */
function openSettings() {
  settingsModal.classList.remove('hidden');
}

/**
 * Close settings modal
 */
function closeSettings() {
  settingsModal.classList.add('hidden');
  closeChangePassword();
}

/**
 * Open change password modal
 */
function openChangePassword() {
  passwordModal.classList.remove('hidden');
  settingsModal.classList.add('hidden');
}

/**
 * Close change password modal
 */
function closeChangePassword() {
  passwordModal.classList.add('hidden');
  passwordForm.reset();
  passwordMessage.textContent = '';
  settingsModal.classList.remove('hidden');
}

/**
 * Handle change password
 */
async function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmNewPassword = document.getElementById('confirm-new-password').value;

  // Validation
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    showPasswordMessage('Please fill in all fields', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showPasswordMessage('New password must be at least 6 characters', 'error');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showPasswordMessage('Passwords do not match', 'error');
    return;
  }

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showPasswordMessage(data.error || 'Failed to change password', 'error');
      return;
    }

    showPasswordMessage('Password changed successfully!', 'success');
    setTimeout(() => {
      closeChangePassword();
    }, 1500);

  } catch (error) {
    console.error('Password change error:', error);
    showPasswordMessage('Network error. Please try again.', 'error');
  }
}

/**
 * Show password message
 */
function showPasswordMessage(message, type) {
  passwordMessage.textContent = message;
  passwordMessage.className = `form-message ${type}`;
}

/**
 * Open user list modal
 */
function openUserList() {
  loadAndDisplayUsers();
  usersModal.classList.remove('hidden');
}

/**
 * Close user list modal
 */
function closeUserList() {
  usersModal.classList.add('hidden');
}

/**
 * Load and display users
 */
async function loadAndDisplayUsers() {
  const usersList = document.getElementById('users-list');
  usersList.innerHTML = '<div class="empty-state">Loading members...</div>';

  try {
    // Get active voice users if in voice channel
    let activeUsers = [];
    if (activeVoiceChannel) {
      activeUsers = await getActiveVoiceUsers();
    }

    // For now, show current user and any active voice users
    usersList.innerHTML = '';

    // Show current user
    const currentUserEl = document.createElement('div');
    currentUserEl.className = 'users-list-item';
    currentUserEl.innerHTML = `
      <div class="users-list-item-avatar">${currentUser.username.charAt(0).toUpperCase()}</div>
      <div class="users-list-item-info">
        <div class="users-list-item-name">${currentUser.username}</div>
        <div class="users-list-item-status">You</div>
      </div>
    `;
    usersList.appendChild(currentUserEl);

    // Show active voice users
    if (activeVoiceChannel && activeUsers.length > 0) {
      activeUsers.forEach(user => {
        if (user.username !== currentUser.username) {
          const userEl = document.createElement('div');
          userEl.className = 'users-list-item';
          userEl.innerHTML = `
            <div class="users-list-item-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="users-list-item-info">
              <div class="users-list-item-name">${user.username}</div>
              <div class="users-list-item-status">Voice Chat</div>
            </div>
          `;
          usersList.appendChild(userEl);
        }
      });
    }

    if (usersList.children.length === 1) {
      usersList.innerHTML += '<div class="empty-state">No other members online</div>';
    }

  } catch (error) {
    console.error('Error loading users:', error);
    usersList.innerHTML = '<div class="empty-state">Failed to load members</div>';
  }
}

/**
 * Toggle server menu
 */
function toggleServerMenu() {
  alert(`Server: Cosmic Chat\nVersion: 1.0.0\n\nWelcome to Cosmic Chat! 🚀\n\nFeatures:\n- Text Channels\n- Voice Chat\n- Direct Messages\n- File Sharing`);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + K to focus message input
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      messageInput.focus();
    }

    // Ctrl/Cmd + / to show shortcuts
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      showKeyboardShortcuts();
    }

    // Escape to close modals
    if (event.key === 'Escape') {
      closeSettings();
      closeUserList();
      closeChangePassword();
    }
  });
}

/**
 * Show keyboard shortcuts
 */
function showKeyboardShortcuts() {
  alert(`Keyboard Shortcuts:\n\nCtrl/Cmd + K - Focus message input\nCtrl/Cmd + / - Show this help\nEsc - Close modals\n\nVoice:\nM - Toggle mute (when in voice channel)`);
}

/**
 * Handle global mute toggle
 */
document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'm' && activeVoiceChannel && !event.ctrlKey && !event.metaKey) {
    // Only toggle if not typing in input
    if (document.activeElement !== messageInput) {
      toggleMute();
    }
  }
});

/**
 * Show notification
 */
function showNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '✦',
      tag: 'cosmic-chat',
      ...options
    });
  }
}

/**
 * Request notification permission
 */
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Copy to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard');
  } catch (error) {
    console.error('Copy error:', error);
  }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
  const requiredAPIs = [
    { name: 'WebRTC', available: !!window.RTCPeerConnection },
    { name: 'Web Audio', available: !!window.AudioContext },
    { name: 'getUserMedia', available: !!navigator.mediaDevices?.getUserMedia },
    { name: 'EventSource', available: !!window.EventSource },
    { name: 'LocalStorage', available: !!window.localStorage }
  ];

  const incompatible = requiredAPIs.filter(api => !api.available);
  
  if (incompatible.length > 0) {
    console.warn('Missing browser APIs:', incompatible.map(api => api.name).join(', '));
  }

  return incompatible.length === 0;
}

/**
 * Initialize service worker for offline support (if available)
 */
function initializeServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(err => {
      console.log('Service Worker registration failed:', err);
    });
  }
}

/**
 * Handle online/offline events
 */
window.addEventListener('online', () => {
  console.log('Back online');
  updateConnectionStatus('Connected', true);
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
  updateConnectionStatus('Offline', false);
});

/**
 * Periodic health check
 */
async function periodicHealthCheck() {
  setInterval(async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        console.warn('Health check failed');
      }
    } catch (error) {
      console.warn('Server unavailable');
    }
  }, 30000);
}

/**
 * Initialize analytics/logging (optional)
 */
function initializeAnalytics() {
  // Track page view
  console.log(`User ${currentUser.username} logged in at ${new Date().toISOString()}`);
}

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', () => {
  if (activeVoiceChannel) {
    leaveVoiceChannel();
  }
  if (eventSource) {
    eventSource.close();
  }
});

/**
 * Error handler
 */
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

/**
 * Boot sequence
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check browser compatibility
  if (!checkBrowserCompatibility()) {
    console.warn('Browser may not support all features');
  }

  // Request notification permission
  requestNotificationPermission();

  // Initialize service worker
  initializeServiceWorker();

  // Start periodic health check
  periodicHealthCheck();

  // Initialize analytics
  initializeAnalytics();

  // Log that app is ready
  console.log('🚀 Cosmic Chat is ready');
});

/**
 * Dynamic theme support
 */
function initializeThemeSupport() {
  // Check for dark mode preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Listen for theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  }
}

// Initialize theme support
initializeThemeSupport();

/**
 * Export functions for console debugging
 */
window.CosmicChat = {
  getCurrentUser: () => currentUser,
  getActiveChannel: () => activeChannel,
  getActiveVoiceChannel: () => activeVoiceChannel,
  getAuthToken: () => authToken,
  switchChannel,
  toggleVoiceChannel,
  logout,
  toggleMute,
  leaveVoiceChannel,
  showNotification,
  copyToClipboard
};

console.log('Debug: window.CosmicChat available for testing');
