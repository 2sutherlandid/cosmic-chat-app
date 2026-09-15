/**
 * Voice Chat Module
 * Handles WebRTC peer-to-peer voice communication
 */

// Voice Chat State
let peer = null;
let localStream = null;
let activeVoiceChannel = null;
let vcEventSource = null;
let peerCalls = {};
let isMuted = false;
let activeVcUsers = new Map();

// DOM Elements
const audioContainer = document.getElementById('audio-container');
const voiceStatusBar = document.getElementById('voice-status-bar');
const voiceStatusChannel = document.getElementById('voice-status-channel');
const muteBtn = document.getElementById('mute-btn');
const vcUsersList = document.getElementById('voice-users-list');
const voiceBadge = document.getElementById('voice-badge');

/**
 * Get unique peer ID for user
 */
function getPeerId(username) {
  return `cosmic_vc_${username.toLowerCase()}`;
}

/**
 * Toggle voice channel join/leave
 */
async function toggleVoiceChannel(channelName) {
  if (activeVoiceChannel === channelName) {
    leaveVoiceChannel();
    return;
  }

  if (activeVoiceChannel) {
    leaveVoiceChannel();
  }

  await joinVoiceChannel(channelName);
}

/**
 * Join a voice channel
 */
async function joinVoiceChannel(channelName) {
  try {
    // Request microphone access
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    activeVoiceChannel = channelName;
    voiceStatusChannel.textContent = channelName;
    voiceStatusBar.classList.remove('hidden');

    // Mark voice button as active
    const voiceBtn = document.querySelector('[data-channel="voice_general"]');
    if (voiceBtn) voiceBtn.classList.add('active');

    // Create peer connection
    const myPeerId = getPeerId(currentUser.username);
    peer = new Peer(myPeerId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    peer.on('open', (id) => {
      console.log('Peer connection established:', id);
      activeVcUsers.set(myPeerId, currentUser.username);
      updateVoiceUserList();
      announcePresence(channelName, 'join');
      listenForVoicePresence(channelName);
    });

    peer.on('call', (call) => {
      console.log('Incoming call from:', call.peer);
      call.answer(localStream);
      handleIncomingCall(call);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'peer-unavailable') {
        console.warn('Peer unavailable:', err.message);
      }
    });

    peer.on('disconnected', () => {
      console.log('Peer disconnected');
    });

  } catch (error) {
    console.error('Microphone access error:', error);
    alert('Microphone access is required to join voice chat. Please check your permissions.');
    leaveVoiceChannel();
  }
}

/**
 * Handle incoming peer call
 */
function handleIncomingCall(call) {
  call.on('stream', (remoteStream) => {
    console.log('Received remote stream from:', call.peer);
    
    let audio = document.getElementById(`audio_${call.peer}`);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `audio_${call.peer}`;
      audio.autoplay = true;
      audio.style.display = 'none';
      audioContainer.appendChild(audio);
    }
    audio.srcObject = remoteStream;
  });

  call.on('close', () => {
    console.log('Call closed:', call.peer);
    removeAudioElement(call.peer);
  });

  call.on('error', (err) => {
    console.error('Call error:', err);
    removeAudioElement(call.peer);
  });

  peerCalls[call.peer] = call;
}

/**
 * Remove audio element for peer
 */
function removeAudioElement(peerId) {
  const audio = document.getElementById(`audio_${peerId}`);
  if (audio) audio.remove();
  if (peerCalls[peerId]) delete peerCalls[peerId];
}

/**
 * Announce presence to voice channel
 */
function announcePresence(channelName, action = 'join') {
  const ntfyUrl = `https://ntfy.sh/cosmicvc_${channelName.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  
  const payload = {
    action,
    user: currentUser.username,
    peerId: getPeerId(currentUser.username),
    timestamp: new Date().toISOString()
  };

  fetch(ntfyUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  }).catch(err => console.error('Failed to announce presence:', err));
}

/**
 * Listen for voice presence announcements
 */
function listenForVoicePresence(channelName) {
  const ntfyUrl = `https://ntfy.sh/cosmicvc_${channelName.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  
  if (vcEventSource) {
    vcEventSource.close();
  }

  try {
    vcEventSource = new EventSource(`${ntfyUrl}/sse?since=5m`);

    vcEventSource.onmessage = (event) => {
      try {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          return;
        }

        if (!data.message) return;

        let payload;
        try {
          payload = JSON.parse(data.message);
        } catch (e) {
          return;
        }

        const myPeerId = getPeerId(currentUser.username);

        if (payload.peerId && payload.peerId !== myPeerId && activeVoiceChannel) {
          if (payload.action === 'join') {
            console.log('User joined:', payload.user);
            activeVcUsers.set(payload.peerId, payload.user);
            updateVoiceUserList();

            // Announce back
            announcePresence(channelName, 'ack');

            // Initiate call to new user
            if (!peerCalls[payload.peerId] && peer) {
              setTimeout(() => {
                try {
                  const call = peer.call(payload.peerId, localStream);
                  if (call) {
                    handleIncomingCall(call);
                  }
                } catch (err) {
                  console.error('Failed to call peer:', err);
                }
              }, 500 + Math.random() * 1000);
            }
          } else if (payload.action === 'ack') {
            console.log('User acknowledged:', payload.user);
            activeVcUsers.set(payload.peerId, payload.user);
            updateVoiceUserList();

            // Call them if we haven't already
            if (!peerCalls[payload.peerId] && peer && localStream) {
              setTimeout(() => {
                try {
                  const call = peer.call(payload.peerId, localStream);
                  if (call) {
                    handleIncomingCall(call);
                  }
                } catch (err) {
                  console.error('Failed to call peer:', err);
                }
              }, 500);
            }
          } else if (payload.action === 'leave') {
            console.log('User left:', payload.user);
            activeVcUsers.delete(payload.peerId);
            updateVoiceUserList();
            removeAudioElement(payload.peerId);
          }
        }
      } catch (error) {
        console.error('Error processing voice presence:', error);
      }
    };

    vcEventSource.onerror = () => {
      console.error('Voice presence connection error');
    };
  } catch (error) {
    console.error('Failed to setup voice presence listener:', error);
  }
}

/**
 * Update voice users list UI
 */
function updateVoiceUserList() {
  vcUsersList.innerHTML = '';
  voiceBadge.textContent = activeVcUsers.size;

  activeVcUsers.forEach((username, peerId) => {
    if (username === currentUser.username) return; // Skip self

    const item = document.createElement('div');
    item.className = 'voice-user-item';

    const avatar = document.createElement('div');
    avatar.className = 'voice-user-avatar';
    avatar.textContent = username.charAt(0).toUpperCase();

    const name = document.createElement('span');
    name.textContent = username;

    const indicator = document.createElement('div');
    indicator.className = 'voice-indicator';

    item.appendChild(avatar);
    item.appendChild(name);
    item.appendChild(indicator);

    vcUsersList.appendChild(item);
  });
}

/**
 * Toggle mute
 */
function toggleMute() {
  if (!localStream) return;

  isMuted = !isMuted;
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !isMuted;
  });

  muteBtn.textContent = isMuted ? '🔇' : '🎤';
  muteBtn.style.opacity = isMuted ? '0.5' : '1';
}

/**
 * Leave voice channel
 */
function leaveVoiceChannel() {
  if (!activeVoiceChannel) return;

  // Announce leave
  if (currentUser && activeVoiceChannel) {
    announcePresence(activeVoiceChannel, 'leave');
  }

  // Close event source
  if (vcEventSource) {
    vcEventSource.close();
    vcEventSource = null;
  }

  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // Close peer connection
  if (peer) {
    peer.destroy();
    peer = null;
  }

  // Close all peer calls
  Object.keys(peerCalls).forEach(peerId => removeAudioElement(peerId));
  peerCalls = {};

  // Clear active users
  activeVcUsers.clear();
  updateVoiceUserList();

  // Update UI
  const voiceBtn = document.querySelector('[data-channel="voice_general"]');
  if (voiceBtn) voiceBtn.classList.remove('active');
  voiceStatusBar.classList.add('hidden');
  activeVoiceChannel = null;
  isMuted = false;
  muteBtn.textContent = '🎤';
  muteBtn.style.opacity = '1';

  console.log('Left voice channel');
}

/**
 * Get active voice users (for API calls)
 */
async function getActiveVoiceUsers() {
  try {
    const response = await fetch(
      `/api/voice/active-users?channel=${activeVoiceChannel}`,
      {
        headers: getAuthHeader()
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.activeUsers || [];
  } catch (error) {
    console.error('Error fetching active voice users:', error);
    return [];
  }
}

/**
 * Register voice session with server
 */
async function registerVoiceSession() {
  if (!activeVoiceChannel || !peer) return;

  try {
    const response = await fetch('/api/voice/register-session', {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        channelName: activeVoiceChannel,
        peerId: getPeerId(currentUser.username)
      })
    });

    if (!response.ok) {
      throw new Error('Failed to register voice session');
    }

    console.log('Voice session registered');
  } catch (error) {
    console.error('Error registering voice session:', error);
  }
}

/**
 * Leave voice session on server
 */
async function leaveVoiceSession() {
  if (!activeVoiceChannel) return;

  try {
    const response = await fetch('/api/voice/leave-session', {
      method: 'DELETE',
      headers: getAuthHeader(),
      body: JSON.stringify({
        channelName: activeVoiceChannel,
        peerId: getPeerId(currentUser.username)
      })
    });

    if (!response.ok) {
      throw new Error('Failed to leave voice session');
    }

    console.log('Voice session ended');
  } catch (error) {
    console.error('Error leaving voice session:', error);
  }
}

// Listen for page unload to clean up
window.addEventListener('beforeunload', () => {
  if (activeVoiceChannel) {
    leaveVoiceChannel();
  }
});
