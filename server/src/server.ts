import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import meetingRoutes from "./routes/meeting_routes.js";
import { setupSocket } from "./socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── Middleware ───────────────────────────────────────────────
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000", "*"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health Check & Root Endpoints ────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "VIVA Real-Time WebRTC Backend",
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "VIVA Video Conferencing API",
    version: "1.0.0",
    docs: "/api/meetings",
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/meetings", meetingRoutes);

// ─── Error Handling Middleware ────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── HTTP & WebSockets Server Boot ────────────────────────────
const server = http.createServer(app);
setupSocket(server);

const startServer = async () => {
  await initDB();

  server.listen(PORT, () => {
    console.log(`🚀 VIVA Backend Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebRTC Signaling Socket.io active on port ${PORT}`);
    console.log(`🌐 Allowed Frontend Origin: ${CLIENT_URL}`);
  });
};

startServer();

export default app;
