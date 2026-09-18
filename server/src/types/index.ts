import { Request } from "express";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  plan: "free" | "premium";
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  hostId: string;
  hostName?: string;
  status: "active" | "ended";
  createdAt: string;
  endedAt?: string | null;
  participantCount?: number;
  duration?: string;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  fullName: string;
  avatarUrl: string;
  joinedAt: string;
  duration?: string;
}

export interface MeetingMessage {
  id: string;
  meetingId: string;
  userId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  createdAt: string;
}

export interface SocketParticipant {
  socketId: string;
  userId: string;
  userName: string;
  avatarUrl: string;
  isMuted: boolean;
  isCameraOff: boolean;
  joinedAt: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
  plan: "free" | "premium";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  rawBody?: Buffer | string;
}

export type BillingCycle = "monthly" | "yearly";
export type OrderStatus = "created" | "paid" | "failed" | "attempted";
export type PaymentStatus = "captured" | "failed" | "refunded";

export interface PaymentOrder {
  id: string; // Razorpay Order ID (e.g. order_xxx)
  userId: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: OrderStatus;
  plan: "free" | "premium";
  billingCycle: BillingCycle;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentTransaction {
  id: string; // Razorpay Payment ID (e.g. pay_xxx)
  orderId: string;
  userId: string;
  amount: number; // in paise
  currency: string;
  status: PaymentStatus;
  method?: string;
  signature?: string;
  createdAt: string;
}

export interface CreateOrderDTO {
  plan?: "premium";
  billingCycle?: BillingCycle;
}

export interface VerifyPaymentDTO {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
