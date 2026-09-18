import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrder,
  verifyPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
  getPaymentHistory,
} from "../controllers/payment_controller.js";

const router = Router();

// Create Razorpay Order (Protected)
router.post("/create-order", requireAuth as any, createOrder as any);

// Client-Side Signature Verification & Account Upgrade (Protected)
router.post("/verify", requireAuth as any, verifyPayment as any);

// Razorpay Asynchronous Webhook (Cryptographically verified via rawBody HMAC-SHA256)
router.post("/webhook", handleRazorpayWebhook);

// Check user subscription status (Protected)
router.get("/status", requireAuth as any, getPaymentStatus as any);

// Get past orders and payment receipts (Protected)
router.get("/history", requireAuth as any, getPaymentHistory as any);

export default router;
