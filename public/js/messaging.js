/**
 * Messaging Module
 * Handles text messages, file attachments, and channel management
 */

// Messaging State
let activeChannel = 'general';
let eventSource = null;
let messageHistory = {};
let customChannels = [];

// Message prefix/suffix for parsing
const PREFIX = "✦COS_USR::";
const SUFFIX = "::MSG✦ ";
const FILE_PREFIX = "✦COS_FILE::";
const FILE_SUFFIX = "::FILE_END✦";

// Default channels configuration
const defaultChannels = {
  general: {
    name: 'general',
    url: 'https://ntfy.sh/cosmic_general_chat',
    symbol: '#',
    description: 'Welcome to the general channel'
  },
  help: {
    name: 'help',
    url: 'https://ntfy.sh/cosmic_help_chat',
    symbol: '#',
    description: 'Get help and support here'
  }
};

// DOM Elements
const messagesContainer = document.getElementById('messages-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const chatHeaderIcon = document.getElementById('chat-header-icon');
const chatHeaderTitle = document.getElementById('chat-header-title');
const chatHeaderDescription = document.getElementById('chat-header-description');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');
const customChannelsContainer = document.getElementById('custom-channels');
const dmListContainer = document.getElementById('dm-list');

/**
 * Initialize messaging system
 */
function initializeMessaging() {
  loadCustomChannels();
  renderCustomChannels();
  renderDMs();
  switchChannel('general');
}

/**
 * Load custom channels from storage
 */
function loadCustomChannels() {
  try {
    const saved = localStorage.getItem(`cosmic_channels_${currentUser.username}`);
    customChannels = saved ? JSON.parse(saved) : [];
  } catch (error) {
    customChannels = [];
  }
}

/**
 * Save custom channels to storage
 */
function saveCustomChannels() {
  localStorage.setItem(`cosmic_channels_${currentUser.username}`, JSON.stringify(customChannels));
}

/**
 * Render custom channels
 */
function renderCustomChannels() {
  customChannelsContainer.innerHTML = '';
  customChannels.forEach(channel => {
    const btn = document.createElement('button');
    btn.className = `channel-btn ${activeChannel === channel.id ? 'active' : ''}`;
    btn.dataset.channel = channel.id;
    btn.onclick = () => switchChannel(channel.id);
    btn.innerHTML = `
      <span class="channel-icon">#</span>
      <span>${channel.name}</span>
    `;
    customChannelsContainer.appendChild(btn);
  });
}

/**
 * Prompt to create new channel
 */
function promptNewChannel() {
  const name = prompt('Enter channel name (lowercase, no spaces):');
  if (!name) return;

  const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanName) {
    alert('Invalid channel name');
    return;
  }

  if (customChannels.some(c => c.name === cleanName)) {
    alert('Channel already exists');
    return;
  }

  const newChannel = {
    id: `custom_${Date.now()}`,
    name: cleanName,
    url: `https://ntfy.sh/cosmic_${cleanName}_${Date.now()}`,
    symbol: '#',
    description: `Channel: ${cleanName}`
  };

  customChannels.push(newChannel);
  saveCustomChannels();
  renderCustomChannels();
  switchChannel(newChannel.id);
}

/**
 * Get channel configuration
 */
function getChannelConfig(channelId) {
  if (defaultChannels[channelId]) {
    return defaultChannels[channelId];
  }

  if (channelId.startsWith('dm_')) {
    const targetUser = channelId.replace('dm_', '');
    const sortedUsers = [currentUser.username.toLowerCase(), targetUser.toLowerCase()].sort().join('_');
    return {
      name: targetUser,
      url: `https://ntfy.sh/cosmic_dm_${sortedUsers}`,
      symbol: '@',
      description: `Direct message with ${targetUser}`
    };
  }

  return customChannels.find(c => c.id === channelId) || defaultChannels.general;
}

/**
 * Switch to a channel
 */
function switchChannel(channelId) {
  activeChannel = channelId;
  const config = getChannelConfig(channelId);

  // Update header
  chatHeaderIcon.textContent = config.symbol;
  chatHeaderTitle.textContent = config.name;
  chatHeaderDescription.textContent = config.description || '';
  messageInput.placeholder = `Message ${config.symbol}${config.name}`;

  // Update active button
  document.querySelectorAll('.channel-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.channel === channelId);
  });

  // Clear messages
  messagesContainer.innerHTML = '';
  messageHistory[channelId] = messageHistory[channelId] || [];

  // Connect to channel
  connectToChannel(config);
}

/**
 * Connect to a channel via ntfy.sh
 */
function connectToChannel(config) {
  if (eventSource) {
    eventSource.close();
  }

  updateConnectionStatus('Connecting...');

  try {
    eventSource = new EventSource(`${config.url}/sse?since=1h`);

    eventSource.onopen = () => {
      updateConnectionStatus('Connected', true);
    };

    eventSource.onerror = () => {
      updateConnectionStatus('Disconnected', false);
      eventSource.close();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event !== 'message') return;

        const parsed = parseIncomingMessage(data.message);
        if (!parsed) return;

        // Filter out messages with links
        if (containsLink(parsed.text)) return;

        const isSelf = parsed.username === currentUser.username;
        addMessageToUI(parsed, isSelf, data.time);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
  } catch (error) {
    console.error('Connection error:', error);
    updateConnectionStatus('Connection failed', false);
  }
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(status, isOnline = null) {
  statusText.textContent = status;
  const dot = connectionStatus.querySelector('.status-dot');
  if (isOnline !== null) {
    dot.classList.toggle('online', isOnline);
  }
}

/**
 * Check if text contains links
 */
function containsLink(text) {
  if (text.includes(FILE_PREFIX)) return false;
  const urlRegex = /(https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|edu|gov|io|co|xyz|dev|app|me|link|info)[^\s]*/i;
  return urlRegex.test(text);
}

/**
 * Parse incoming message
 */
function parseIncomingMessage(rawText) {
  if (!rawText) return null;

  if (rawText.startsWith(PREFIX) && rawText.includes(SUFFIX)) {
    const usernameEnd = rawText.indexOf(SUFFIX);
    const username = rawText.substring(PREFIX.length, usernameEnd);
    const text = rawText.substring(usernameEnd + SUFFIX.length);
    return { username, text };
  }

  return null;
}

/**
 * Format outgoing message
 */
function formatOutgoingMessage(text) {
  return `${PREFIX}${currentUser.username}${SUFFIX}${text}`;
}

/**
 * Add message to UI
 */
function addMessageToUI(parsedData, isSelf, timestamp) {
  const msgTimestamp = timestamp || Math.floor(Date.now() / 1000);
  const now = Math.floor(Date.now() / 1000);

  // Don't show messages older than 30 minutes
  if ((now - msgTimestamp) > 1800) return;

  // Show empty state only if no messages
  const emptyState = messagesContainer.querySelector('.messages-empty');
  if (emptyState) {
    emptyState.remove();
  }

  const messageEl = document.createElement('div');
  messageEl.className = `message ${isSelf ? 'self' : 'other'}`;
  messageEl.dataset.time = msgTimestamp;

  const initial = parsedData.username.charAt(0).toUpperCase();
  const timeStr = getTimeString(msgTimestamp);

  messageEl.innerHTML = `
    <div class="message-avatar">${initial}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">${parsedData.username}</span>
        <span class="message-timestamp">${timeStr}</span>
      </div>
      <div class="message-body"></div>
    </div>
  `;

  const messageBody = messageEl.querySelector('.message-body');

  // Handle file attachments
  if (parsedData.text.startsWith(FILE_PREFIX) && parsedData.text.endsWith(FILE_SUFFIX)) {
    const payload = parsedData.text.slice(FILE_PREFIX.length, -FILE_SUFFIX.length);
    const sepIndex = payload.indexOf('::');

    if (sepIndex !== -1) {
      const fileName = payload.substring(0, sepIndex);
      const fileData = payload.substring(sepIndex + 2);

      if (fileData.startsWith('data:image/')) {
        const img = document.createElement('img');
        img.src = fileData;
        img.alt = fileName;
        img.className = 'message-image';
        img.onclick = () => window.open(fileData);
        messageBody.appendChild(img);
      } else {
        const fileLink = document.createElement('a');
        fileLink.href = fileData;
        fileLink.download = fileName;
        fileLink.className = 'message-file';
        fileLink.innerHTML = `<span class="message-file-icon">📄</span><span>${fileName}</span>`;
        messageBody.appendChild(fileLink);
      }
    }
  } else {
    const textEl = document.createElement('div');
    textEl.className = 'message-text';
    textEl.textContent = parsedData.text;
    messageBody.appendChild(textEl);
  }

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Get time string from timestamp
 */
function getTimeString(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Handle send message
 */
async function handleSendMessage(event) {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text || !currentUser) return;

  if (containsLink(text)) {
    alert('Links are not allowed in messages');
    return;
  }

  messageInput.value = '';

  try {
    const config = getChannelConfig(activeChannel);
    const formatted = formatOutgoingMessage(text);

    const response = await fetch(config.url, {
      method: 'POST',
      body: formatted,
      headers: { 'Content-Type': 'text/plain' }
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Send error:', error);
    alert('Failed to send message. Please try again.');
  }
}

/**
 * Handle file selection
 */
function handleFileSelect() {
  const file = fileInput.files[0];
  if (!file) return;

  // Validate file size (3MB limit)
  if (file.size > 3 * 1024 * 1024) {
    alert('File size must be under 3MB');
    fileInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const fileData = e.target.result;
      const filePayload = `${FILE_PREFIX}${file.name}::${fileData}${FILE_SUFFIX}`;
      
      const config = getChannelConfig(activeChannel);
      const formatted = formatOutgoingMessage(filePayload);

      const response = await fetch(config.url, {
        method: 'POST',
        body: formatted,
        headers: { 'Content-Type': 'text/plain' }
      });

      if (!response.ok) {
        throw new Error('Failed to send file');
      }

      fileInput.value = '';
    } catch (error) {
      console.error('File send error:', error);
      alert('Failed to send file. Please try again.');
    }
  };

  reader.onerror = () => {
    alert('Failed to read file');
  };

  reader.readAsDataURL(file);
}

/**
 * Load DMs from storage
 */
function loadDMs() {
  try {
    const saved = localStorage.getItem(`cosmic_dms_${currentUser.username}`);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Save DMs to storage
 */
function saveDMs(dms) {
  localStorage.setItem(`cosmic_dms_${currentUser.username}`, JSON.stringify(dms));
}

/**
 * Render DMs
 */
function renderDMs() {
  dmListContainer.innerHTML = '';
  const dms = loadDMs();

  dms.forEach(targetUser => {
    const btn = document.createElement('button');
    btn.className = `channel-btn ${activeChannel === `dm_${targetUser}` ? 'active' : ''}`;
    btn.dataset.channel = `dm_${targetUser}`;
    btn.onclick = () => switchChannel(`dm_${targetUser}`);
    btn.innerHTML = `
      <span class="channel-icon">@</span>
      <span>${targetUser}</span>
    `;
    dmListContainer.appendChild(btn);
  });
}

/**
 * Prompt to start new DM
 */
function promptNewDM() {
  const targetUser = prompt('Enter username to message:');
  if (!targetUser) return;

  const cleanTarget = targetUser.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleanTarget) {
    alert('Invalid username');
    return;
  }

  if (cleanTarget.toLowerCase() === currentUser.username.toLowerCase()) {
    alert('You cannot message yourself');
    return;
  }

  const dms = loadDMs();
  if (!dms.includes(cleanTarget)) {
    dms.push(cleanTarget);
    saveDMs(dms);
    renderDMs();
  }

  switchChannel(`dm_${cleanTarget}`);
}

/**
 * Clean up old messages periodically
 */
function cleanupOldMessages() {
  setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const cutoff = 30 * 60; // 30 minutes

    document.querySelectorAll('.message').forEach(msg => {
      const msgTime = parseInt(msg.dataset.time, 10);
      if (msgTime && (now - msgTime) > cutoff) {
        msg.remove();
      }
    });

    // Show empty state if no messages
    if (messagesContainer.children.length === 0) {
      messagesContainer.innerHTML = `
        <div class="messages-empty">
          <div class="empty-icon">💬</div>
          <div class="empty-text">No messages yet. Start the conversation!</div>
        </div>
      `;
    }
  }, 30000);
}

// Set up form listener
messageForm.addEventListener('submit', handleSendMessage);
fileInput.addEventListener('change', handleFileSelect);

// Clean up messages periodically
cleanupOldMessages();
