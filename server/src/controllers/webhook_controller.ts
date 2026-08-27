import { Request, Response } from "express";
import { Webhook } from "svix";
import { memoryUsers, getPool } from "../config/db.js";
import type { User } from "../types/index.js";

export const handleClerkWebhook = async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes("whsec_...")) {
    console.log("[Webhook] Received webhook (Webhook secret not configured, processing in mock mode)");
    res.status(200).json({ success: true, message: "Webhook received in mock mode" });
    return;
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ success: false, message: "Missing Svix verification headers" });
    return;
  }

  let event: any;
  try {
    const wh = new Webhook(webhookSecret);
    const payload = (req as any).rawBody || JSON.stringify(req.body);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err: any) {
    console.error("[Webhook Verification Error]", err.message);
    res.status(400).json({ success: false, message: "Invalid webhook signature" });
    return;
  }

  const { type, data } = event;
  const pool = getPool();

  try {
    switch (type) {
      case "user.created": {
        const newUser: User = {
          id: data.id,
          email: data.email_addresses?.[0]?.email_address || "",
          fullName: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          avatarUrl: data.image_url || "",
          plan: "free",
          createdAt: new Date().toISOString(),
        };

        memoryUsers.set(newUser.id, newUser);

        if (pool) {
          await pool.query(
            "INSERT INTO users (id, email, full_name, avatar_url, plan) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
            [newUser.id, newUser.email, newUser.fullName, newUser.avatarUrl, newUser.plan]
          );
        }
        console.log(`[Webhook] Synced new user: ${newUser.fullName} (${newUser.id})`);
        break;
      }

      case "user.updated": {
        const plan = data.public_metadata?.plan === "premium" ? "premium" : "free";
        const existing = memoryUsers.get(data.id);
        const updatedUser: User = {
          id: data.id,
          email: data.email_addresses?.[0]?.email_address || existing?.email || "",
          fullName: `${data.first_name || ""} ${data.last_name || ""}`.trim() || existing?.fullName || "User",
          avatarUrl: data.image_url || existing?.avatarUrl || "",
          plan,
          createdAt: existing?.createdAt || new Date().toISOString(),
        };

        memoryUsers.set(updatedUser.id, updatedUser);

        if (pool) {
          await pool.query(
            "UPDATE users SET email = $1, full_name = $2, avatar_url = $3, plan = $4 WHERE id = $5",
            [updatedUser.email, updatedUser.fullName, updatedUser.avatarUrl, updatedUser.plan, updatedUser.id]
          );
        }
        console.log(`[Webhook] Updated user: ${updatedUser.fullName} (${updatedUser.id}) -> Plan: ${plan}`);
        break;
      }

      case "user.deleted": {
        memoryUsers.delete(data.id);
        if (pool) {
          await pool.query("DELETE FROM users WHERE id = $1", [data.id]);
        }
        console.log(`[Webhook] Deleted user: ${data.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${type}`);
    }

    res.status(200).json({ success: true, event: type });
  } catch (error: any) {
    console.error("[Webhook Processing Error]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
