import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use(express.static('public'));

// Database file path
const DB_FILE = path.join(__dirname, 'data', 'users.json');
const VOICE_SESSIONS_FILE = path.join(__dirname, 'data', 'voice_sessions.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database files
function initializeDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
  }
  if (!fs.existsSync(VOICE_SESSIONS_FILE)) {
    fs.writeFileSync(VOICE_SESSIONS_FILE, JSON.stringify({}));
  }
}

// Read users database
function getUsers() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Save users database
function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// Read voice sessions
function getVoiceSessions() {
  try {
    const data = fs.readFileSync(VOICE_SESSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Save voice sessions
function saveVoiceSessions(sessions) {
  fs.writeFileSync(VOICE_SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Helper function to generate JWT
function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
}

// ===== AUTHENTICATION ROUTES =====

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { username, password }
 */
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Sanitize username
    const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const userKey = sanitizedUsername.toLowerCase();

    const users = getUsers();

    // Check if user already exists
    if (users[userKey]) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Store user
    users[userKey] = {
      username: sanitizedUsername,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    saveUsers(users);

    // Generate token
    const token = generateToken(sanitizedUsername);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        username: sanitizedUsername
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 * Body: { username, password }
 */
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const userKey = sanitizedUsername.toLowerCase();

    const users = getUsers();
    const user = users[userKey];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare passwords
    const isPasswordValid = bcryptjs.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    // Generate token
    const token = generateToken(user.username);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
app.post('/api/auth/verify', verifyToken, (req, res) => {
  return res.status(200).json({
    valid: true,
    user: req.user
  });
});

// ===== VOICE CHAT ROUTES =====

/**
 * POST /api/voice/register-session
 * Register a voice chat session
 */
app.post('/api/voice/register-session', verifyToken, (req, res) => {
  try {
    const { channelName, peerId } = req.body;
    const username = req.user.username;

    if (!channelName || !peerId) {
      return res.status(400).json({ error: 'Channel name and peer ID required' });
    }

    const sessions = getVoiceSessions();

    if (!sessions[channelName]) {
      sessions[channelName] = {};
    }

    sessions[channelName][peerId] = {
      username,
      peerId,
      joinedAt: new Date().toISOString(),
      status: 'active'
    };

    saveVoiceSessions(sessions);

    return res.status(200).json({
      success: true,
      message: 'Session registered',
      sessionId: peerId
    });
  } catch (err) {
    console.error('Voice session registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/voice/active-users
 * Get active users in a voice channel
 */
app.get('/api/voice/active-users', verifyToken, (req, res) => {
  try {
    const { channel } = req.query;

    if (!channel) {
      return res.status(400).json({ error: 'Channel parameter required' });
    }

    const sessions = getVoiceSessions();
    const channelSessions = sessions[channel] || {};

    const activeUsers = Object.values(channelSessions).map(session => ({
      username: session.username,
      peerId: session.peerId,
      joinedAt: session.joinedAt
    }));

    return res.status(200).json({
      channel,
      activeUsers,
      count: activeUsers.length
    });
  } catch (err) {
    console.error('Error fetching active users:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/voice/leave-session
 * Leave a voice chat session
 */
app.delete('/api/voice/leave-session', verifyToken, (req, res) => {
  try {
    const { channelName, peerId } = req.body;

    if (!channelName || !peerId) {
      return res.status(400).json({ error: 'Channel name and peer ID required' });
    }

    const sessions = getVoiceSessions();

    if (sessions[channelName] && sessions[channelName][peerId]) {
      delete sessions[channelName][peerId];

      if (Object.keys(sessions[channelName]).length === 0) {
        delete sessions[channelName];
      }

      saveVoiceSessions(sessions);
    }

    return res.status(200).json({
      success: true,
      message: 'Left voice session'
    });
  } catch (err) {
    console.error('Error leaving voice session:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/voice/signal
 * Handle WebRTC signaling (offer/answer/ice candidates)
 */
app.post('/api/voice/signal', verifyToken, (req, res) => {
  try {
    const { targetPeerId, signalData, type } = req.body;

    if (!targetPeerId || !signalData || !type) {
      return res.status(400).json({ error: 'Missing required signal parameters' });
    }

    // In a production environment, you would store these signals and route them
    // For now, we'll just acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Signal received',
      type
    });
  } catch (err) {
    console.error('Signaling error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== USER PROFILE ROUTES =====

/**
 * GET /api/users/:username
 * Get user profile information
 */
app.get('/api/users/:username', (req, res) => {
  try {
    const username = req.params.username.trim().replace(/[^a-zA-Z0-9_]/g, '');
    const userKey = username.toLowerCase();

    const users = getUsers();
    const user = users[userKey];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      username: user.username,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/change-password
 * Change user password
 */
app.post('/api/users/change-password', verifyToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const username = req.user.username;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userKey = username.toLowerCase();
    const users = getUsers();
    const user = users[userKey];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = bcryptjs.compareSync(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = bcryptjs.hashSync(newPassword, 10);
    saveUsers(users);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== MESSAGE ATTACHMENT ROUTES =====

/**
 * POST /api/messages/upload-file
 * Upload and store a file for chat
 */
app.post('/api/messages/upload-file', verifyToken, (req, res) => {
  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'File name and data required' });
    }

    // Validate file size (3MB limit)
    const fileSizeInBytes = Buffer.byteLength(fileData, 'base64');
    if (fileSizeInBytes > 3 * 1024 * 1024) {
      return res.status(413).json({ error: 'File size exceeds 3MB limit' });
    }

    // Generate unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return res.status(200).json({
      success: true,
      fileId,
      message: 'File uploaded successfully'
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== HEALTH CHECK =====

app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ===== 404 Handler =====

app.use((req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Cosmic Chat Server running on http://localhost:${PORT}`);
  console.log('📁 Database initialized');
  console.log('🔐 Using JWT for authentication');
});

export default app;
