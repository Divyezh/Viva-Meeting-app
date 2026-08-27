// ─── Type Definitions for Meetup / VIVA Real-Time Video App ───

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

export interface ChatMessage {
  id: string;
  meetingId: string;
  userId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  createdAt: string;
}

export interface SessionDetail {
  meeting: Meeting;
  participants: MeetingParticipant[];
  messages: ChatMessage[];
}

export interface PeerStream {
  peerId: string; // Socket ID
  stream: MediaStream | null;
  userId: string;
  userName: string;
  avatarUrl: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
}
