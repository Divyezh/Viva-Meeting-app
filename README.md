# Viva-Meeting-app 🎥

A modern, high-performance WebRTC video conferencing and instant meeting platform with real-time chat, screen sharing, host admission waiting room, and Clerk authentication.

![VIVA Meeting App](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-blue)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38bdf8)
![WebRTC](https://img.shields.io/badge/Video-Native%20WebRTC-success)
![Socket.io](https://img.shields.io/badge/Signaling-Socket.io%20v4-black)
![Clerk](https://img.shields.io/badge/Auth-Clerk%20Authentication-6c47ff)

---

## ✨ Features

- **Ultra-Low Latency Peer-to-Peer Video & Audio**: Powered by native WebRTC with Google public STUN servers.
- **Screen Sharing**: Lossless real-time screen capture and stream replacement.
- **Host Admission & Waiting Room ("Ask to Join")**:
  - Guests request admission before entering meetings.
  - Hosts receive interactive admission cards to **Admit** or **Deny** participants.
- **Real-Time Group Chat**: Live in-meeting text messaging via Socket.io.
- **Meeting Sessions History**: Automatically tracks and stores created and past meeting records.
- **Clerk Authentication**: Seamless Google OAuth & email login with a custom olive green and luminous pista theme.
- **Smart Meeting Code Resolution**: Supports entering raw meeting IDs (e.g. `abc-def-ghi`) or pasting full URLs.
- **Audio Activity Detection**: Dynamic speech level analysis and speaking indicators.
- **Glassmorphic UI & Design**: Built with TailwindCSS v4 featuring soft ambient glows and modern micro-interactions.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS v4 + Lucide React Icons
- **Auth**: `@clerk/clerk-react`
- **Networking**: `socket.io-client`, `axios`
- **Feedback**: `react-hot-toast`
- **Routing**: `react-router-dom`

### Backend (`/server`)
- **Runtime**: Node.js + Express + TypeScript
- **Realtime Signaling**: Socket.io
- **Database (Optional)**: PostgreSQL (Neon DB) with In-Memory fallback
- **Auth**: `@clerk/backend`

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Clerk Account](https://clerk.com/) for authentication

---

### 2. Clone the Repository
```bash
git clone https://github.com/Divyezh/Viva-Meeting-app.git
cd Viva-Meeting-app
```

---

### 3. Server Setup (`/server`)

1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
   DATABASE_URL=postgresql://user:password@host/dbname # Optional
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*

---

### 4. Client Setup (`/client`)

1. Open a new terminal, navigate to the client folder and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Clerk Publishable Key:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   *The application will open at `http://localhost:5173`.*

---

## 🔒 Security & Privacy

- **Zero API Key Leaks**: `.env` and `.env.*` files are excluded via `.gitignore`.
- **Peer-to-Peer Media**: Video and audio data streams directly between participants using encrypted WebRTC channels (DTLS/SRTP).
- **Public STUN Only**: Uses Google's public STUN servers (`stun:stun.l.google.com:19302`) with no third-party video SDK fees.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
