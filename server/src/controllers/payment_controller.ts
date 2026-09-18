import { Request, Response } from "express";
import crypto from "crypto";
import { createClerkClient } from "@clerk/backend";
import { getPool, memoryOrders, memoryPayments, memoryUsers } from "../config/db.js";
import { getRazorpayInstance, isRazorpayConfigured, PRICING_CONFIG } from "../config/razorpay.js";
import type {
  AuthRequest,
  BillingCycle,
  PaymentOrder,
  PaymentTransaction,
} from "../types/index.js";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerk =
  clerkSecretKey && !clerkSecretKey.includes("sk_test_...")
    ? createClerkClient({ secretKey: clerkSecretKey })
    : null;

/**
 * Helper to upgrade a user to premium across Neon PostgreSQL, memory store, and Clerk
 */
async function upgradeUserToPremium(userId: string): Promise<void> {
  const pool = getPool();

  // 1. Update in memory store
  const memUser = memoryUsers.get(userId);
  if (memUser) {
    memUser.plan = "premium";
    memoryUsers.set(userId, memUser);
  } else {
    // If not in memory, populate default
    memoryUsers.set(userId, {
      id: userId,
      email: "",
      fullName: "User",
      avatarUrl: "",
      plan: "premium",
      createdAt: new Date().toISOString(),
    });
  }

  // 2. Update in PostgreSQL
  if (pool) {
    try {
      await pool.query("UPDATE users SET plan = 'premium' WHERE id = $1", [userId]);
      console.log(`[Payment] Database user ${userId} upgraded to premium.`);
    } catch (dbErr) {
      console.error(`[Payment DB Error] Failed to update user ${userId} plan in Postgres:`, dbErr);
    }
  }

  // 3. Sync to Clerk user publicMetadata if Clerk is active
  if (clerk) {
    try {
      await clerk.users.updateUser(userId, {
        publicMetadata: {
          plan: "premium",
          upgradedAt: new Date().toISOString(),
        },
      });
      console.log(`[Payment] Clerk publicMetadata updated for ${userId} -> plan: premium`);
    } catch (clerkErr: any) {
      console.warn(
        `[Payment] Notice: Clerk metadata sync skipped (${clerkErr?.message || clerkErr})`
      );
    }
  }
}

/**
 * 1. Create a Razorpay Order
 * POST /api/payment/create-order
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const billingCycle: BillingCycle = req.body.billingCycle === "yearly" ? "yearly" : "monthly";
    const pricing = PRICING_CONFIG[billingCycle];

    const receipt = `rcpt_${Date.now()}_${userId.slice(-6)}`;
    const razorpay = getRazorpayInstance();

    let orderId: string;
    let orderAmount = pricing.amount;
    let orderCurrency = pricing.currency;

    if (razorpay) {
      // Create real order in Razorpay
      const rzpOrder = await razorpay.orders.create({
        amount: pricing.amount,
        currency: pricing.currency,
        receipt,
        notes: {
          userId,
          plan: "premium",
          billingCycle,
        },
      });
      orderId = rzpOrder.id;
      orderAmount = Number(rzpOrder.amount);
      orderCurrency = rzpOrder.currency;
    } else {
      // Mock mode when credentials are not configured yet
      orderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[Payment] Razorpay credentials not configured. Created mock order: ${orderId}`);
    }

    // Persist order in local memory
    const newOrder: PaymentOrder = {
      id: orderId,
      userId,
      amount: orderAmount,
      currency: orderCurrency,
      receipt,
      status: "created",
      plan: "premium",
      billingCycle,
      createdAt: new Date().toISOString(),
    };
    memoryOrders.set(orderId, newOrder);

    // Persist in Neon DB
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO orders (id, user_id, amount, currency, receipt, status, plan, billing_cycle)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP`,
          [
            newOrder.id,
            newOrder.userId,
            newOrder.amount,
            newOrder.currency,
            newOrder.receipt,
            newOrder.status,
            newOrder.plan,
            newOrder.billingCycle,
          ]
        );
      } catch (dbErr) {
        console.warn("[Payment DB] Error saving order to PostgreSQL:", dbErr);
      }
    }

    res.status(201).json({
      success: true,
      orderId,
      amount: orderAmount,
      currency: orderCurrency,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      plan: "premium",
      billingCycle,
      isMock: !isRazorpayConfigured(),
    });
  } catch (error: any) {
    console.error("[Payment] Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    });
  }
};

/**
 * 2. Client-Side Payment Signature Verification
 * POST /api/payment/verify
 */
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        message: "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature",
      });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isConfigured = isRazorpayConfigured();

    if (isConfigured && keySecret) {
      // Validate cryptographic HMAC-SHA256 signature
      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isSignatureValid =
        expectedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "utf-8"),
          Buffer.from(razorpay_signature, "utf-8")
        );

      if (!isSignatureValid) {
        console.warn(`[Payment] Tampered signature detected for order ${razorpay_order_id}`);
        res.status(400).json({
          success: false,
          message: "Payment verification failed: Invalid signature",
        });
        return;
      }
    } else {
      console.log(`[Payment] Mock verification accepted for order: ${razorpay_order_id}`);
    }

    // Retrieve order details
    let order = memoryOrders.get(razorpay_order_id);
    const pool = getPool();

    if (!order && pool) {
      const dbRes = await pool.query("SELECT * FROM orders WHERE id = $1", [razorpay_order_id]);
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        order = {
          id: row.id,
          userId: row.user_id,
          amount: row.amount,
          currency: row.currency,
          receipt: row.receipt,
          status: row.status,
          plan: row.plan,
          billingCycle: row.billing_cycle,
          createdAt: row.created_at,
        };
      }
    }

    // Update order status to paid
    if (order) {
      order.status = "paid";
      order.updatedAt = new Date().toISOString();
      memoryOrders.set(order.id, order);
    }

    if (pool) {
      await pool.query(
        "UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [razorpay_order_id]
      );
    }

    // Record payment record
    const paymentRecord: PaymentTransaction = {
      id: razorpay_payment_id,
      orderId: razorpay_order_id,
      userId,
      amount: order?.amount || 49900,
      currency: order?.currency || "INR",
      status: "captured",
      signature: razorpay_signature,
      createdAt: new Date().toISOString(),
    };
    memoryPayments.set(razorpay_payment_id, paymentRecord);

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO payments (id, order_id, user_id, amount, currency, status, signature)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
          [
            paymentRecord.id,
            paymentRecord.orderId,
            paymentRecord.userId,
            paymentRecord.amount,
            paymentRecord.currency,
            paymentRecord.status,
            paymentRecord.signature,
          ]
        );
      } catch (payDbErr) {
        console.warn("[Payment DB] Error recording payment transaction:", payDbErr);
      }
    }

    // Upgrade user tier
    await upgradeUserToPremium(userId);

    res.status(200).json({
      success: true,
      message: "Payment successfully verified! Your account is now Premium.",
      plan: "premium",
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("[Payment] Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during payment verification",
      error: error.message,
    });
  }
};

/**
 * 3. Razorpay Asynchronous Webhook
 * POST /api/payment/webhook
 * Handled with raw request body signature validation for guaranteed safe payments
 */
export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes("whsec_...")) {
    console.log("[Payment Webhook] Webhook secret not configured, processing in sandbox mode.");
  } else {
    const receivedSignature = req.headers["x-razorpay-signature"] as string;

    if (!receivedSignature) {
      console.warn("[Payment Webhook] Missing x-razorpay-signature header");
      res.status(400).json({ success: false, message: "Missing x-razorpay-signature" });
      return;
    }

    // Use rawBody buffer captured by express.json({ verify })
    const rawPayload = (req as any).rawBody
      ? (req as any).rawBody.toString("utf-8")
      : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawPayload)
      .digest("hex");

    const isSignatureValid =
      receivedSignature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(receivedSignature, "utf-8"),
        Buffer.from(expectedSignature, "utf-8")
      );

    if (!isSignatureValid) {
      console.error("[Payment Webhook] Cryptographic signature mismatch!");
      res.status(400).json({ success: false, message: "Invalid webhook signature" });
      return;
    }
  }

  const payload = req.body;
  const event = payload?.event;
  console.log(`[Payment Webhook] Verified event received: ${event}`);

  try {
    const pool = getPool();

    switch (event) {
      case "payment.captured":
      case "order.paid": {
        const paymentEntity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
        const orderId = paymentEntity?.order_id || paymentEntity?.id;
        const paymentId = paymentEntity?.id;
        const amount = paymentEntity?.amount;
        const currency = paymentEntity?.currency || "INR";
        const method = paymentEntity?.method || "unknown";

        // Retrieve user ID from notes or existing order
        let targetUserId = paymentEntity?.notes?.userId;

        if (!targetUserId && orderId) {
          const cachedOrder = memoryOrders.get(orderId);
          if (cachedOrder) {
            targetUserId = cachedOrder.userId;
          } else if (pool) {
            const dbRes = await pool.query("SELECT user_id FROM orders WHERE id = $1", [orderId]);
            if (dbRes.rows.length > 0) {
              targetUserId = dbRes.rows[0].user_id;
            }
          }
        }

        if (orderId) {
          // Update order status
          const existingOrder = memoryOrders.get(orderId);
          if (existingOrder) {
            existingOrder.status = "paid";
            existingOrder.updatedAt = new Date().toISOString();
          }

          if (pool) {
            await pool.query(
              "UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
              [orderId]
            );
          }
        }

        if (paymentId && targetUserId) {
          // Record payment transaction
          const paymentTx: PaymentTransaction = {
            id: paymentId,
            orderId: orderId || "",
            userId: targetUserId,
            amount: amount || 49900,
            currency,
            status: "captured",
            method,
            createdAt: new Date().toISOString(),
          };
          memoryPayments.set(paymentId, paymentTx);

          if (pool) {
            await pool.query(
              `INSERT INTO payments (id, order_id, user_id, amount, currency, status, method)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, method = EXCLUDED.method`,
              [
                paymentTx.id,
                paymentTx.orderId || null,
                paymentTx.userId,
                paymentTx.amount,
                paymentTx.currency,
                paymentTx.status,
                paymentTx.method,
              ]
            );
          }

          // Upgrade user to premium
          await upgradeUserToPremium(targetUserId);
          console.log(`[Payment Webhook] User ${targetUserId} safely upgraded via webhook.`);
        }
        break;
      }

      case "payment.failed": {
        const paymentEntity = payload.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;

        if (orderId) {
          const ord = memoryOrders.get(orderId);
          if (ord) ord.status = "failed";

          if (pool) {
            await pool.query(
              "UPDATE orders SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
              [orderId]
            );
          }
        }
        console.warn(`[Payment Webhook] Payment failed for order ${orderId}, payment ${paymentId}`);
        break;
      }

      default:
        console.log(`[Payment Webhook] Unhandled event: ${event}`);
    }

    res.status(200).json({ status: "ok", receivedEvent: event });
  } catch (err: any) {
    console.error("[Payment Webhook Error]", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

/**
 * 4. Get Current User Plan & Subscription Status
 * GET /api/payment/status
 */
export const getPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const pool = getPool();
    let currentPlan = req.user?.plan || "free";

    // Fetch latest user data
    if (pool) {
      const userRes = await pool.query("SELECT plan FROM users WHERE id = $1", [userId]);
      if (userRes.rows.length > 0) {
        currentPlan = userRes.rows[0].plan;
      }
    } else {
      const mem = memoryUsers.get(userId);
      if (mem) currentPlan = mem.plan;
    }

    // Fetch latest order
    let latestOrder: PaymentOrder | null = null;
    if (pool) {
      const orderRes = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      if (orderRes.rows.length > 0) {
        const row = orderRes.rows[0];
        latestOrder = {
          id: row.id,
          userId: row.user_id,
          amount: row.amount,
          currency: row.currency,
          receipt: row.receipt,
          status: row.status,
          plan: row.plan,
          billingCycle: row.billing_cycle,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } else {
      const userOrders = Array.from(memoryOrders.values()).filter((o) => o.userId === userId);
      if (userOrders.length > 0) {
        latestOrder = userOrders[userOrders.length - 1];
      }
    }

    res.status(200).json({
      success: true,
      plan: currentPlan,
      isPremium: currentPlan === "premium",
      latestOrder,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. Get Payment & Invoice History
 * GET /api/payment/history
 */
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const pool = getPool();
    let orders: PaymentOrder[] = [];
    let payments: PaymentTransaction[] = [];

    if (pool) {
      const orderRes = await pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      orders = orderRes.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        amount: row.amount,
        currency: row.currency,
        receipt: row.receipt,
        status: row.status,
        plan: row.plan,
        billingCycle: row.billing_cycle,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const payRes = await pool.query(
        "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      payments = payRes.rows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        userId: row.user_id,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        method: row.method,
        createdAt: row.created_at,
      }));
    } else {
      orders = Array.from(memoryOrders.values())
        .filter((o) => o.userId === userId)
        .reverse();
      payments = Array.from(memoryPayments.values())
        .filter((p) => p.userId === userId)
        .reverse();
    }

    res.status(200).json({
      success: true,
      orders,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
