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
}
