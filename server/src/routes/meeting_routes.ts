import { Router } from "express";
import {
  createMeeting,
  joinMeeting,
  getSessions,
  getSessionDetail,
  deleteSession,
} from "../controllers/meeting_controller.js";
import { handleClerkWebhook } from "../controllers/webhook_controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Meeting Protected Endpoints
router.post("/create", requireAuth, createMeeting);
router.post("/join", requireAuth, joinMeeting);
router.get("/sessions", requireAuth, getSessions);
router.get("/sessions/:id", requireAuth, getSessionDetail);
router.delete("/sessions/:id", requireAuth, deleteSession);

// Webhook Endpoints
router.post("/webhooks/clerk", handleClerkWebhook);

export default router;
