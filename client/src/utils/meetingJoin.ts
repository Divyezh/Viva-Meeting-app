import socket from "../config/socket";
import type { NavigateFunction } from "react-router-dom";

/**
 * Timestamped logging helper for admission and join flow performance analysis
 */
export const logJoinTrace = (stage: string, details?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  console.log(`[Join Latency Trace][${timestamp}] ${stage}`, details ? details : "");
};

/**
 * Single source of truth for extracting clean room IDs from links or codes
 */
export const extractRoomId = (input: string): string => {
  let cleaned = input.trim();
  if (cleaned.includes("/meeting/")) {
    cleaned = cleaned.split("/meeting/")[1].split("?")[0].split("#")[0];
  } else if (cleaned.includes("/join/")) {
    cleaned = cleaned.split("/join/")[1].split("?")[0].split("#")[0];
  }
  return cleaned.replace(/[^a-zA-Z0-9_-]/g, "");
};

/**
 * Single source of truth for guest join preparation.
 * Used by: /join page, dashboard Join modal, and the in-room lobby (shared link flow),
 * so every entry point ends up in exactly the same state before MeetingRoom takes over.
 */
export const prepareGuestJoin = ({
  roomId,
  userName,
  muted,
  cameraOff,
}: {
  roomId: string;
  userName: string;
  muted: boolean;
  cameraOff: boolean;
}) => {
  const cleanId = extractRoomId(roomId);
  const finalName = userName.trim() || "Guest Participant";

  logJoinTrace("prepareGuestJoin called", { roomId: cleanId, userName: finalName, muted, cameraOff });

  localStorage.setItem("meeting_user_name", finalName);
  localStorage.setItem("prejoin_muted", muted ? "true" : "false");
  localStorage.setItem("prejoin_camera_off", cameraOff ? "true" : "false");
  sessionStorage.setItem(`prejoin_confirmed_${cleanId}`, "true");
  sessionStorage.removeItem(`is_host_${cleanId}`);
  localStorage.removeItem(`is_host_${cleanId}`);

  // Pre-connect Socket.io immediately so signaling handshake is ready with zero latency
  if (!socket.connected) {
    logJoinTrace("Pre-connecting Socket.io signaling connection");
    socket.connect();
  }
};

/**
 * Unified joinMeeting function called across ALL join entry points:
 * - Direct link (/meeting/:roomId in-room lobby)
 * - Link route (/join/:meetingId)
 * - Manual ID entry (/join)
 * - Dashboard manual ID entry (JoinMeetingModal)
 */
export const joinMeeting = ({
  roomId,
  userName,
  muted,
  cameraOff,
  navigate,
  onClose,
  onSuccess,
}: {
  roomId: string;
  userName: string;
  muted: boolean;
  cameraOff: boolean;
  navigate?: NavigateFunction;
  onClose?: () => void;
  onSuccess?: () => void;
}) => {
  const cleanId = extractRoomId(roomId);
  logJoinTrace("joinMeeting initiated", { cleanId, userName });

  prepareGuestJoin({
    roomId: cleanId,
    userName,
    muted,
    cameraOff,
  });

  if (onClose) onClose();
  if (onSuccess) onSuccess();

  if (navigate) {
    logJoinTrace("Navigating to meeting room", { path: `/meeting/${cleanId}` });
    navigate(`/meeting/${cleanId}`);
  }
};

