You are an expert full-stack developer. Build a zoom/Google Meet video conferencing clone named "Meetup" using the PERN Stack (PostgreSQL, Express, React, Node.js use typescript).

### Architectural Core

1. React (Vite) Frontend: Use Tailwind CSS for custom styling, Lucide React for modern UI icons, and React Hot Toast for trigger-based status notifications.
2. Express Backend: Traditional stateful Node.js server. Use CORS and Cookie Parser.
3. Database (Neon Serverless PostgreSQL): Handle relational persistence. Query database tables securely via Neon Serverless Driver template-tagging.
4. Real-Time Communication: Establish peer-to-peer audio/video streaming via Native WebRTC. Use Socket.io on the Express backend as the real-time WebRTC Signaling and Instant Chat Messaging server.
5. User Auth \& Billing: Use Clerk for email and Google OAuth, pre-built profile UI panels, and multi-tier subscription metadata controls (Free plan limited to 30 meetings/month and 10 users; Premium plan supports unlimited meetings and 100 users). Includes billing check logic to synchronize payment updates.

Implement the project exactly according to the following file directory mapping:

meetup/
├── server/
│   ├── config/
│   │   └── db.js                 # Neon PostgreSQL client, pool configuration \& table migrations schema
│   ├── controllers/
│   │   ├── meeting\_controller.js # CRUD operations, monthly usage limit validations \& statistics
│   │   └── webhook\_controller.js # Clerk webhooks handler to sync users, plans \& image metadata
│   ├── middleware/
│   │   └── auth.js               # JWT security interceptor extracting user credentials via Clerk SDK
│   ├── routes/
│   │   └── meeting\_routes.js     # Protected REST endpoints mapping controllers to endpoints
│   ├── .env.example              # Server environment variable templates
│   ├── .gitignore                # Ignoring env, logs, and node modules
│   ├── package.json              # Backend dependencies (Express, Socket.io, Neon-serverless, Svix)
│   ├── socket.js                 # Socket.io signaling server events (offer, answer, candidate, chat)
│   └── server.js                 # App entry point, HTTP server bootstrap \& centralized error handling
│
└── client/
├── public/                   # Static logos, background SVGs, and landing graphics
├── src/
│   ├── assets/
│   │   └── asset.js          # Fallback assets and localized dummy schema data
│   ├── components/
│   │   ├── meeting/
│   │   │   ├── chat\_panel.jsx       # Side-drawer panel displaying synchronized in-meeting chat
│   │   │   ├── control\_bar.jsx      # Sticky bottom panel housing media controllers \& copy URL utilities
│   │   │   ├── participants\_list.jsx# Side-drawer listing active call participants \& device state
│   │   │   ├── video\_grid.jsx       # Responsive grid layout sorting streams dynamically by screen size
│   │   │   └── video\_tile.jsx       # Individual user video player \& device-off camera placeholders
│   │   ├── sessions/
│   │   │   ├── empty\_sessions.jsx   # Fallback layout when historical logs are empty
│   │   │   ├── session\_card.jsx     # Individual list item representing past meeting metrics
│   │   │   ├── session\_chat\_tab.jsx # Segment list detailing message transcripts of selected history
│   │   │   ├── session\_detail\_model.jsx # Modal dashboard toggling between Chat logs \& User list
│   │   │   └── session\_participants\_tab.jsx # Participant presence list matching joining timestamps
│   │   ├── footer.jsx               # Universal application copyright banner
│   │   ├── loader.jsx               # Branded loading spinner layout with pulse text labels
│   │   ├── navbar.jsx               # Header navigation panel displaying active path hooks and UserButton
│   │   ├── protected\_layout.jsx     # Shared layout routing rendering Nav and Footer wrappers
│   │   └── protected\_route.jsx      # Client routing guard validating auth status via useAuth()
│   ├── config/
│   │   ├── api.js            # Axios client with request interceptor capturing Clerk JWT tokens
│   │   └── socket.js         # Socket.io client instance initialization
│   ├── hooks/
│   │   ├── useChat.js        # Socket client hook controlling unread counters and text emitters
│   │   └── useWebRTC.js      # Critical WebRTC hook managing streams, peer connections, and ICE state
│   ├── pages/
│   │   ├── dashboard.jsx     # Landing portal allowing instant meeting creation and joining
│   │   ├── login.jsx         # Sign-In/Sign-Up redirect container implementing Clerk components
│   │   ├── meeting\_room.jsx  # Frame rendering active audio/video grids and panel drawers
│   │   ├── pricing.jsx       # Pricing tiers page outlining commercial feature list tables
│   │   └── sessions.jsx      # Session log histories fetching and modeling historical records
│   ├── App.jsx               # Central Router dividing layouts and mapping path structures
│   ├── index.css             # Tailwind base setups and global body typography configs
│   └── main.jsx              # React mounting root wrapping providers (ClerkProvider, BrowserRouter)
├── .env.example              # Client-side environment variables
├── index.html                # Main index markup mounting DOM target
├── package.json              # Front-end packages (React Router, Axios, Hot Toast, Sockets-Client)
├── postcss.config.js         # PostCSS config file
└── tailwind.config.js        # Tailwind layout theme extent configurations

