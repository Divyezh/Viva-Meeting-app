/**
 * Single source of truth for guest join preparation.
 * Used by: /join page, dashboard Join modal, and the in-room lobby (shared link flow),
 * so every entry point ends up in exactly the same state before MeetingRoom takes over.
 */

export const extractRoomId = (input: string): string => {
  let cleaned = input.trim();
  if (cleaned.includes("/meeting/")) {
    cleaned = cleaned.split("/meeting/")[1].split("?")[0].split("#")[0];
  }
  return cleaned.replace(/[^a-zA-Z0-9_-]/g, "");
};

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
  localStorage.setItem("meeting_user_name", userName.trim() || "Guest Participant");
  localStorage.setItem("prejoin_muted", muted ? "true" : "false");
  localStorage.setItem("prejoin_camera_off", cameraOff ? "true" : "false");
  sessionStorage.setItem(`prejoin_confirmed_${roomId}`, "true");
  sessionStorage.removeItem(`is_host_${roomId}`);
  localStorage.removeItem(`is_host_${roomId}`);
};
