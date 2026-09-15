✦ Cosmic Chat - Discord-like Chat Application

# Cosmic Chat

A modern, Discord-like chat application featuring **real-time text messaging**, **WebRTC voice calls**, and **file sharing**. Built with Node.js backend and vanilla JavaScript frontend, powered by ntfy.sh for instant messaging and PeerJS for peer-to-peer voice communication.

## 🌟 Features

### Text Messaging
- **Real-time Chat**: Instant message delivery using ntfy.sh SSE
- **Multiple Channels**: Pre-configured general/help channels + create custom channels
- **Direct Messages**: Private 1-on-1 conversations
- **File Sharing**: Share images and files (up to 3MB)
- **Message History**: View recent messages in each channel
- **Auto-cleanup**: Automatically removes messages older than 30 minutes

### Voice Chat
- **WebRTC P2P Calls**: Direct peer-to-peer voice communication via PeerJS
- **Multiple Voice Channels**: Join voice rooms with other users
- **Mute Control**: Toggle microphone on/off (shortcut: M key)
- **Real-time User List**: See who's in your voice channel
- **STUN Servers**: Uses Google's STUN servers for NAT traversal

### User Management
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Registration**: Create accounts with username validation
- **Account Settings**: View profile and manage account
- **Password Management**: Change password securely
- **Session Persistence**: Stay logged in with local token storage

### UI/UX
- **Discord-like Design**: Dark theme inspired by Discord
- **Responsive Layout**: Works on desktop and mobile
- **Modal Dialogs**: Settings, user list, password change modals
- **Real-time Status**: Connection status indicator
- **Keyboard Shortcuts**: Ctrl+K for message input, M for mute, Esc for modals

## 🏗️ Architecture

```
Cosmic Chat
├── Backend (Node.js + Express)
│   ├── Authentication API
│   ├── User Management
│   ├── Voice Session Management
│   └── File Upload Handling
│
├── Frontend (Vanilla JavaScript)
│   ├── auth.js - Authentication & login
│   ├── messaging.js - Text chat via ntfy.sh
│   ├── voicechat.js - WebRTC voice communication
│   ├── app.js - Main orchestration
│   ├── styles.css - UI styling
│   └── index.html - HTML structure
│
└── External Services
    ├── ntfy.sh - Real-time messaging backend
    └── PeerJS - WebRTC peer connection signaling
```

## 📋 Prerequisites

- **Node.js** 16+ (for backend)
- **Modern Browser** supporting:
  - WebRTC (for voice chat)
  - EventSource/SSE (for real-time messaging)
  - Web Audio API
  - LocalStorage
  - Fetch API
- **Internet Connection** (for ntfy.sh and PeerJS)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/2sutherlandid/cosmic-chat-app.git
cd cosmic-chat-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (optional - defaults are fine for development)
```

### 4. Start the Server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will start on **http://localhost:3000**

### 5. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## 🔐 Authentication

### Register a New Account
1. Click the **Register** tab
2. Enter a username (3-20 characters, alphanumeric + underscore)
3. Create a password (6+ characters)
4. Confirm password and submit

### Login
1. Click the **Login** tab
2. Enter your username and password
3. Click Login

Your session is saved in browser storage, so you'll stay logged in even after closing the browser.

### Change Password
1. Click ⚙️ (Settings) in the user panel
2. Click **Change Password**
3. Enter current password and new password
4. Submit to update

## 💬 Text Messaging

### Channels
- **#general** - Main chat channel
- **#help** - Support and help channel
- **Custom Channels** - Create your own (click + next to "Text Channels")

### Sending Messages
1. Select a channel from the sidebar
2. Type your message in the input box
3. Press Enter or click Send (📤)

### Sharing Files
1. Click the attachment button (📎)
2. Select an image or file (max 3MB)
3. File will be sent to the current channel

### Direct Messages
1. Click + next to "Direct Messages"
2. Enter the username to message
3. Start chatting!

## 🎙️ Voice Chat

### Joining a Voice Channel
1. Locate "Voice Channels" in the sidebar
2. Click **general-voice** to join
3. Allow microphone access when prompted
4. You'll see other users in the voice channel

### Voice Controls
- **🎤 Mute Toggle**: Click to mute/unmute your microphone (or press M)
- **✕ Leave**: Click to disconnect from voice chat
- **User List**: See who's talking in the channel

### Troubleshooting Voice Chat
- **No microphone permission**: Check browser settings and allow microphone access
- **Can't hear others**: Ensure speakers are enabled in your system
- **Poor audio quality**: Close other apps using your microphone
- **Connection issues**: Check your internet connection

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus message input |
| `Ctrl/Cmd + /` | Show help/shortcuts |
| `M` | Toggle microphone mute (in voice chat) |
| `Esc` | Close open modals |
| `Enter` | Send message |

## 🗂️ Project Structure

```
cosmic-chat-app/
├── server.js                 # Express server & API endpoints
├── package.json             # Dependencies & scripts
├── .env.example             # Environment template
├── public/
│   ├── index.html           # Main HTML file
│   ├── css/
│   │   └── styles.css       # All styling (Discord-like theme)
│   └── js/
│       ├── auth.js          # Authentication module
│       ├── messaging.js     # Text messaging via ntfy.sh
│       ├── voicechat.js     # WebRTC voice communication
│       └── app.js           # Main application orchestration
├── data/
│   ├── users.json          # User database (created at runtime)
│   └── voice_sessions.json # Voice session tracking (created at runtime)
└── README.md               # This file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/:username` - Get user profile
- `POST /api/users/change-password` - Change password

### Voice Chat
- `POST /api/voice/register-session` - Register voice session
- `GET /api/voice/active-users` - Get active voice users
- `DELETE /api/voice/leave-session` - Leave voice session
- `POST /api/voice/signal` - WebRTC signaling

### Health
- `GET /api/health` - Server health check

## 🛠️ Technologies

### Backend
- **Express.js** - Web framework
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No frameworks required
- **PeerJS** - WebRTC wrapper library
- **CSS3** - Modern styling with variables
- **HTML5** - Semantic markup

### External Services
- **ntfy.sh** - Real-time pub/sub messaging
- **PeerJS Servers** - WebRTC signaling (free tier)
- **Google STUN Servers** - NAT traversal

## 📝 Development Guide

### Adding a New Channel
```javascript
// In messaging.js, add to defaultChannels object:
mychannel: {
  name: 'mychannel',
  url: 'https://ntfy.sh/cosmic_mychannel',
  symbol: '#',
  description: 'My custom channel'
}
```

### Customizing Theme
Edit CSS variables in `public/css/styles.css`:
```css
:root {
  --primary: #5865f2;      /* Main color */
  --bg-primary: #36393f;   /* Main background */
  --text-primary: #dcddde; /* Main text color */
  /* ... more variables ... */
}
```

### Adding New API Endpoints
1. Add route in `server.js`
2. Include authentication middleware if needed: `verifyToken`
3. Use `getAuthHeader()` in frontend JavaScript for authenticated requests

## 🔒 Security Considerations

### Implemented
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT token-based authentication (7-day expiry)
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ HTTPS ready (use reverse proxy in production)

### Production Recommendations
1. **Change JWT_SECRET** - Update `.env` with a strong random string
2. **Use HTTPS** - Deploy behind HTTPS reverse proxy
3. **Database** - Migrate from JSON to proper database (MongoDB, PostgreSQL)
4. **Rate Limiting** - Add rate limiting middleware
5. **CORS Origins** - Set specific allowed origins, not wildcard
6. **CSP Headers** - Add Content Security Policy headers
7. **Input Validation** - Add stricter validation on all endpoints

## 🚀 Deployment

### Deploy to Heroku
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET="your-secret-key"

# Deploy
git push heroku main
```

### Deploy to Vercel (Frontend) + Node.js (Backend)
1. Frontend: Deploy `public/` folder to Vercel
2. Backend: Deploy Node.js app to services like Railway, Render, or Heroku
3. Update frontend API URL to point to backend

### Using Docker
```bash
# Build image
docker build -t cosmic-chat .

# Run container
docker run -p 3000:3000 cosmic-chat
```

## 🐛 Troubleshooting

### "Cannot GET /"
- Ensure `public/` directory exists
- Check that Express is serving static files correctly
- Verify file paths in server.js

### WebRTC Connection Issues
- Check if firewall is blocking WebRTC
- Ensure both peers have internet access
- Try refreshing browser and reconnecting

### Messages Not Sending
- Verify ntfy.sh service is online
- Check browser console for errors
- Ensure username doesn't contain special characters

### Microphone Not Working
- Check browser permissions (Settings > Privacy)
- Verify microphone is not in use by another app
- Try restarting browser

### Database Not Persisting
- Ensure `data/` directory is writable
- Check file permissions
- Verify disk space available

## 📊 Database Schema

### users.json
```json
{
  "username_lowercase": {
    "username": "Username",
    "password": "bcrypt_hash",
    "createdAt": "2026-09-15T...",
    "lastLogin": "2026-09-15T..."
  }
}
```

### voice_sessions.json
```json
{
  "channel_name": {
    "peer_id": {
      "username": "Username",
      "peerId": "peer_id",
      "joinedAt": "2026-09-15T...",
      "status": "active"
    }
  }
}
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a pull request

## 🎯 Roadmap

- [ ] Video chat support
- [ ] Message persistence
- [ ] User profiles with avatars
- [ ] Server/Guild system
- [ ] Message reactions & emojis
- [ ] User roles and permissions
- [ ] Channel categories
- [ ] Message editing/deletion
- [ ] User presence status
- [ ] Read receipts
- [ ] Screen sharing
- [ ] Bot API

## 💬 Support

For issues, questions, or suggestions:
1. Open an issue on GitHub
2. Check existing issues for solutions
3. Include error messages and browser console logs

## 👥 Credits

Created by **2sutherlandid**

**Technologies:**
- Built with Express.js and vanilla JavaScript
- Inspired by Discord's UI/UX
- Uses ntfy.sh for real-time messaging
- Uses PeerJS for WebRTC communication

---

**Made with ✦ for real-time communication**

**Version:** 1.0.0  
**Last Updated:** 2026-09-15

## 🔗 Links

- **Repository**: https://github.com/2sutherlandid/cosmic-chat-app
- **ntfy.sh**: https://ntfy.sh
- **PeerJS**: https://peerjs.com
- **MDN Web Docs**: https://developer.mozilla.org
