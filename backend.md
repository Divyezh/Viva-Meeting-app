Role: Lead Backend Engineer & System Architect
Use typescript instead of javascript
Task: Design and build a production-grade Express/Node.js backend for "Meetup" (a video-conferencing Zoom/Google Meet clone). Integrate Socket.io for WebRTC signaling/chat, Neon Serverless PostgreSQL for database storage, and Clerk for authentication and subscription tier management.

### 1. Project Directory Mapping & Structure
Generate clean, modular ES module code matching this server structure:
server/
├── config/
│   └── db.js                 # Database configuration, connections, and schema initialization
├── controllers/
│   ├── meeting_controller.js # CRUD for meeting sessions and in-call logs
│   └── webhook_controller.js # Svix-verified Clerk webhooks for users/subscriptions
├── middleware/
│   └── auth.js               # Clerk JWT auth verification and route guards
├── routes/
│   └── meeting_routes.js     # API endpoints mapping
├── socket.js                 # WebRTC signaling and real-time messaging server
├── server.js                 # Main server entry, middleware setup, and bootstrapper
└── package.json              # Main project dependencies

---

### 2. Module Specifications & Logic

#### A. PostgreSQL Configuration & Migrations (config/db.js)
- Configure the serverless database connection pool using the `@neondatabase/serverless` driver.
- Implement an initialization schema function to automatically create the following tables if they do not exist:
  1. `users` Table: `id` (text, primary key matching Clerk ID), `email` (text), `full_name` (text), `avatar_url` (text), `plan` (text: 'free' or 'premium'), `created_at` (timestamp).
  2. `meetings` Table: `id` (uuid, primary key), `title` (text), `host_id` (text, references users.id), `status` (text: 'active' or 'ended'), `created_at` (timestamp), `ended_at` (timestamp, nullable).
  3. `meeting_participants` Table: `id` (uuid), `meeting_id` (uuid, references meetings.id), `user_id` (text, references users.id), `joined_at` (timestamp).
  4. `meeting_messages` Table: `id` (uuid), `meeting_id` (uuid, references meetings.id), `user_id` (text, references users.id), `message` (text), `created_at` (timestamp).

#### B. Clerk Authenticator Middleware (middleware/auth.js)
- Build a route shield middleware that intercepts client headers (`Authorization: Bearer <JWT>`).
- Decrypt and validate the Clerk JWT session token using the Clerk SDK / Node helper library.
- Inject the decoded token payload (`req.user = { id: userId, email, plan }`) into subsequent HTTP requests. Reject unauthorized queries with a `401 Unauthorized` status.

#### C. Clerk & Subscription Billing Webhooks (controllers/webhook_controller.js)
- Set up a highly secure API route (`/api/webhooks/clerk`) that listens to Clerk webhook payloads.
- Use the `svix` package to verify the incoming cryptographic signature headers (`svix-id`, `svix-timestamp`, `svix-signature`) against your local endpoint secret.
- Parse and switch between the following webhooks:
  - `user.created`: Insert the new user's profile metadata into the local PostgreSQL database (defaulting their subscription plan to `free`).
  - `user.updated`: Sync updated profile avatars, full names, or payment-triggered subscription metadata overrides (`plan: 'premium'`).
  - `user.deleted`: Cleanly deactivate/cascade user records upon account deletion.

#### D. Meeting Controllers & API Routes (controllers/meeting_controller.js & routes/meeting_routes.js)
- Implement endpoints protected by your authentication middleware:
  - `POST /api/meetings/create`: 
    - Check the user's active tier plan.
    - If the user is on the `free` plan, query the `meetings` table to count their hosted sessions within the current calendar month. Limit free tier accounts to 30 meetings/month. If the limit is exceeded, return a `403 Forbidden` error outlining plan thresholds.
    - If the check passes, insert a new active meeting session and return the unique Room ID.
  - `POST /api/meetings/join`: Log participant entry times into the `meeting_participants` database.
  - `GET /api/meetings/sessions`: Retrieve the user's historical meeting list (including user role, meeting duration, and participants count).
  - `GET /api/meetings/sessions/:id`: Extract a detailed summary of a past session, pulling the complete attendee list alongside the full chronologically ordered text chat transcripts.

#### E. Socket.io WebRTC Signaling Engine (socket.js)
- Attach Socket.io to the unified HTTP server. Set robust CORS rules to allow secure handshakes only from your frontend domain.
- Map the following real-time, event-driven signaling namespaces:
  1. `join-room`: Map client socket IDs to rooms. Broadcast a `user-connected` event with their identity to other active peers in that room.
  2. `webrtc-offer` / `webrtc-answer` / `ice-candidate`: Instantly route Peer-to-Peer setup signaling structures (SDPs and ICE packets) directly from the sender to target participants.
  3. `toggle-media`: Broadcast microphone/camera state change updates to other attendees (e.g., "User A has muted their microphone").
  4. `send-chat-message`: Intercept text messages, persist them instantly to the PostgreSQL database (`meeting_messages` table), and broadcast the message packet dynamically to everyone in the room via a `new-chat-message` event.
  5. `leave-room` / `disconnect`: Track connection timeouts or explicit page leaves. Clean up local state dictionaries, delete the database participant connection map, and broadcast a `user-disconnected` event to the room. If the host leaves, handle room-closing events.

#### F. Unified Server Entry Point (server.js)
- Initialize the Express application, injecting global middleware (CORS, JSON Parser, Cookie Parser).
- Setup routing hooks and connect to PostgreSQL.
- Wrap the Express app with the native Node.js HTTP server to establish concurrent WebSockets alongside REST paths. Bind the server to your designated PORT.