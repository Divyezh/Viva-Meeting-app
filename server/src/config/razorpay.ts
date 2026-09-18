import Razorpay from "razorpay";
import dotenv from "dotenv";
import type { BillingCycle } from "../types/index.js";

dotenv.config();

// Pricing configuration (amounts in paise: 100 paise = 1 INR)
export const PRICING_CONFIG: Record<
  BillingCycle,
  { amount: number; currency: string; label: string }
> = {
  monthly: {
    amount: 49900, // ₹499
    currency: "INR",
    label: "Viva Premium Monthly",
  },
  yearly: {
    amount: 499900, // ₹4,999 (approx 16% discount)
    currency: "INR",
    label: "Viva Premium Annual",
  },
};

const key_id = process.env.RAZORPAY_KEY_ID || "";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "";

export const isRazorpayConfigured = (): boolean => {
  return Boolean(
    key_id && key_secret && !key_id.includes("rzp_test_...") && !key_secret.includes("your_secret")
  );
};

let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay | null => {
  if (!razorpayInstance && isRazorpayConfigured()) {
    try {
      razorpayInstance = new Razorpay({
        key_id,
        key_secret,
      });
    } catch (err) {
      console.error("[Razorpay] Failed to initialize SDK client:", err);
      return null;
    }
  }
  return razorpayInstance;
};
