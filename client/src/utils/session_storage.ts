import type { Meeting } from "../types";

const SESSIONS_STORAGE_KEY = "viva_meeting_sessions";

export const getSavedMeetings = (): Meeting[] => {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load saved meetings:", err);
    return [];
  }
};

export const saveCreatedMeeting = (meeting: Partial<Meeting> & { id: string; title: string }) => {
  try {
    const existing = getSavedMeetings();
    const newMeeting: Meeting = {
      id: meeting.id,
      title: meeting.title || "Product Sync & Standup",
      hostId: meeting.hostId || "user_host",
      status: "active",
      createdAt: new Date().toISOString(),
      endedAt: null,
      participantCount: meeting.participantCount || 1,
      duration: meeting.duration || "Active",
    };

    // Filter out if duplicate ID already exists, then prepend new meeting
    const updated = [newMeeting, ...existing.filter((m) => m.id !== meeting.id)];
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
    return newMeeting;
  } catch (err) {
    console.error("Failed to save created meeting:", err);
  }
};

export const deleteSavedMeeting = (meetingId: string): void => {
  try {
    const existing = getSavedMeetings();
    const updated = existing.filter((m) => m.id !== meetingId);
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete saved meeting:", err);
  }
};

