import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import meetingRoutes from "./routes/meeting_routes.js";
import paymentRoutes from "./routes/payment_routes.js";
import { setupSocket } from "./socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── Middleware ───────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
// Store rawBody buffer for cryptographic signature validation in webhooks (Razorpay / Clerk)
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
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

app.get("/googled1a697e54b4ff7a7.html", (_req, res) => {
  res.type("text/html").send("google-site-verification: googled1a697e54b4ff7a7.html");
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/meetings", meetingRoutes);
app.use("/api/payment", paymentRoutes);

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
