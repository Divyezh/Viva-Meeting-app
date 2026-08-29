import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type { AuthRequest, Meeting, MeetingParticipant } from "../types/index.js";
import {
  memoryMeetings,
  memoryParticipants,
  memoryMessages,
  getPool,
} from "../config/db.js";

// ─── POST /api/meetings/create ──────────────────────────────
export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || "user_1";
    const userPlan = req.user?.plan || "free";
    const { title = "Quick Meeting" } = req.body;

    const pool = getPool();

    // Usage check for Free plan: 30 meetings/month limit
    if (userPlan === "free") {
      let count = 0;
      if (pool) {
        const countRes = await pool.query(
          `SELECT COUNT(*) FROM meetings 
           WHERE host_id = $1 
           AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)`,
          [userId]
        );
        count = parseInt(countRes.rows[0].count, 10);
      } else {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        count = Array.from(memoryMeetings.values()).filter((m) => {
          const d = new Date(m.createdAt);
          return m.hostId === userId && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
      }

      if (count >= 30) {
        res.status(403).json({
          success: false,
          message: "Monthly meeting quota reached (30 meetings/month on Free tier). Upgrade to Premium for unlimited meetings.",
          code: "LIMIT_REACHED",
        });
        return;
      }
    }

    const meetingId = uuidv4().slice(0, 11);
    const newMeeting: Meeting = {
      id: meetingId,
      title,
      hostId: userId,
      status: "active",
      createdAt: new Date().toISOString(),
      endedAt: null,
      participantCount: 1,
    };

    memoryMeetings.set(meetingId, newMeeting);

    if (pool) {
      await pool.query(
        "INSERT INTO meetings (id, title, host_id, status) VALUES ($1, $2, $3, $4)",
        [newMeeting.id, newMeeting.title, newMeeting.hostId, newMeeting.status]
      );
    }

    res.status(201).json({
      success: true,
      data: newMeeting,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/meetings/join ────────────────────────────────
export const joinMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || "user_1";
    const { meetingId, fullName = "Participant", avatarUrl = "" } = req.body;

    if (!meetingId) {
      res.status(400).json({ success: false, message: "Meeting ID required" });
      return;
    }

    const participantId = uuidv4();
    const participant: MeetingParticipant = {
      id: participantId,
      meetingId,
      userId,
      fullName,
      avatarUrl,
      joinedAt: new Date().toISOString(),
    };

    if (!memoryParticipants.has(meetingId)) {
      memoryParticipants.set(meetingId, []);
    }
    memoryParticipants.get(meetingId)?.push(participant);

    const pool = getPool();
    if (pool) {
      await pool.query(
        "INSERT INTO meeting_participants (id, meeting_id, user_id, joined_at) VALUES ($1, $2, $3, $4)",
        [participant.id, participant.meetingId, participant.userId, participant.joinedAt]
      );
    }

    res.status(200).json({
      success: true,
      data: participant,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/meetings/sessions ─────────────────────────────
export const getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || "user_1";
    const pool = getPool();

    if (pool) {
      const result = await pool.query(
        `SELECT m.*, 
          COUNT(DISTINCT mp.id) as participant_count,
          CASE WHEN m.host_id = $1 THEN 'Host' ELSE 'Participant' END as user_role
         FROM meetings m
         LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
         WHERE m.host_id = $1 OR mp.user_id = $1
         GROUP BY m.id
         ORDER BY m.created_at DESC`,
        [userId]
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
      return;
    }

    const sessions = Array.from(memoryMeetings.values()).map((m) => {
      const parts = memoryParticipants.get(m.id) || [];
      return {
        ...m,
        participantCount: Math.max(1, parts.length),
        userRole: m.hostId === userId ? "Host" : "Participant",
        duration: m.duration || "45 min",
      };
    });

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/meetings/sessions/:id ─────────────────────────
export const getSessionDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const pool = getPool();

    if (pool) {
      const meetingRes = await pool.query("SELECT * FROM meetings WHERE id = $1", [id]);
      if (meetingRes.rows.length === 0) {
        res.status(404).json({ success: false, message: "Meeting session not found" });
        return;
      }

      const participantsRes = await pool.query(
        `SELECT mp.*, u.full_name, u.avatar_url 
         FROM meeting_participants mp
         LEFT JOIN users u ON u.id = mp.user_id
         WHERE mp.meeting_id = $1
         ORDER BY mp.joined_at ASC`,
        [id]
      );

      const messagesRes = await pool.query(
        `SELECT mm.*, u.full_name as sender_name, u.avatar_url as sender_avatar 
         FROM meeting_messages mm
         LEFT JOIN users u ON u.id = mm.user_id
         WHERE mm.meeting_id = $1
         ORDER BY mm.created_at ASC`,
        [id]
      );

      res.status(200).json({
        success: true,
        data: {
          meeting: meetingRes.rows[0],
          participants: participantsRes.rows,
          messages: messagesRes.rows,
        },
      });
      return;
    }

    const meeting = memoryMeetings.get(id) || {
      id,
      title: "Active Meeting",
      hostId: req.user?.id || "user_1",
      status: "active",
      createdAt: new Date().toISOString(),
      endedAt: null,
      participantCount: 1,
    };

    const participants = memoryParticipants.get(id) || [];
    const messages = memoryMessages.get(id) || [];

    res.status(200).json({
      success: true,
      data: {
        meeting,
        participants,
        messages,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/meetings/sessions/:id ──────────────────────
export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const userId = req.user?.id || "user_1";
    const pool = getPool();

    if (pool) {
      const meetingRes = await pool.query("SELECT * FROM meetings WHERE id = $1", [id]);
      if (meetingRes.rows.length === 0) {
        res.status(404).json({ success: false, message: "Meeting session not found" });
        return;
      }

      const meeting = meetingRes.rows[0];
      if (meeting.host_id === userId) {
        await pool.query("DELETE FROM meetings WHERE id = $1", [id]);
      } else {
        await pool.query("DELETE FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2", [id, userId]);
      }

      res.status(200).json({
        success: true,
        message: "Meeting session deleted successfully",
      });
      return;
    }

    const meeting = memoryMeetings.get(id);
    if (!meeting) {
      res.status(404).json({ success: false, message: "Meeting session not found" });
      return;
    }

    if (meeting.hostId === userId) {
      memoryMeetings.delete(id);
      memoryParticipants.delete(id);
      memoryMessages.delete(id);
    } else {
      const parts = memoryParticipants.get(id) || [];
      const updatedParts = parts.filter((p) => p.userId !== userId);
      memoryParticipants.set(id, updatedParts);
    }

    res.status(200).json({
      success: true,
      message: "Meeting session deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

