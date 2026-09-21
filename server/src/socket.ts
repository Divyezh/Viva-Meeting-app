import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { memoryMessages, memoryMeetings, getPool } from "./config/db.js";
import type { SocketParticipant, MeetingMessage } from "./types/index.js";

// Active room participants map: roomId -> Map(socketId -> SocketParticipant)
const roomParticipants = new Map<string, Map<string, SocketParticipant>>();
// Socket to room mapping: socketId -> { roomId, userId, userName, isHost?: boolean }
const socketToRoom = new Map<
  string,
  { roomId: string; userId: string; userName: string; isHost?: boolean }
>();
// Room host mapping: roomId -> { socketId: string; userId: string; userName: string }
const roomHosts = new Map<string, { socketId: string; userId: string; userName: string }>();
// Track meetings that were explicitly closed/ended by the host
const closedMeetings = new Set<string>();

interface PendingJoinRequest {
  requesterSocketId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  roomId: string;
}
// Pending join requests waiting for host admission or for host to arrive: roomId -> Map(socketId -> PendingJoinRequest)
const pendingJoinRequests = new Map<string, Map<string, PendingJoinRequest>>();

export const setupSocket = (server: HttpServer): Server => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // ─── 0. REQUEST TO JOIN (Waiting Room / Admission Request) ─
    socket.on(
      "request-join",
      async ({
        roomId,
        userId,
        userName,
        avatarUrl = "",
        isHost = false,
      }: {
        roomId: string;
        userId: string;
        userName: string;
        avatarUrl?: string;
        isHost?: boolean;
      }) => {
        if (!roomId) {
          socket.emit("join-response", { approved: false, reason: "Invalid Room ID" });
          return;
        }

        // 1. If the user is the HOST:
        if (isHost) {
          // Reopen meeting in case it was previously closed
          closedMeetings.delete(roomId);

          const memMeeting = memoryMeetings.get(roomId);
          if (memMeeting) {
            memMeeting.status = "active";
            memMeeting.endedAt = null;
          }

          const pool = getPool();
          if (pool) {
            try {
              await pool.query(
                "UPDATE meetings SET status = 'active', ended_at = NULL WHERE id = $1",
                [roomId]
              );
            } catch (err) {
              console.warn("[Database] Could not reopen meeting in DB:", err);
            }
          }

          roomHosts.set(roomId, { socketId: socket.id, userId, userName });
          socket.emit("join-response", { approved: true, isHost: true, roomId });

          // Forward any pending join requests from guests who knocked earlier
          const pending = pendingJoinRequests.get(roomId);
          if (pending && pending.size > 0) {
            pending.forEach((req) => {
              socket.emit("join-request-received", req);
            });
          }
          return;
        }

        // 2. If the user is a GUEST:
        // Check if meeting has been explicitly closed by the host
        if (closedMeetings.has(roomId)) {
          console.log(`[Join Denied] Room "${roomId}" was already closed by the host.`);
          socket.emit("join-response", {
            approved: false,
            meetingClosed: true,
            reason: "Host closed the meeting",
          });
          return;
        }

        const host = roomHosts.get(roomId);

        // Check in-memory meeting status (only mark closed if no active host is present)
        const memMeeting = memoryMeetings.get(roomId);
        if (memMeeting && memMeeting.status === "ended" && !host) {
          closedMeetings.add(roomId);
          socket.emit("join-response", {
            approved: false,
            meetingClosed: true,
            reason: "Host closed the meeting",
          });
          return;
        }

        // Check DB meeting status if PostgreSQL is connected
        const pool = getPool();
        if (pool && !host) {
          try {
            const dbRes = await pool.query("SELECT status FROM meetings WHERE id = $1", [roomId]);
            if (dbRes.rows.length > 0 && dbRes.rows[0].status === "ended") {
              closedMeetings.add(roomId);
              socket.emit("join-response", {
                approved: false,
                meetingClosed: true,
                reason: "Host closed the meeting",
              });
              return;
            }
          } catch (dbErr) {
            console.warn("[Database] Check meeting status error:", dbErr);
          }
        }

        // 3. Queue the join request
        const reqItem: PendingJoinRequest = {
          requesterSocketId: socket.id,
          userId,
          userName,
          avatarUrl,
          roomId,
        };

        if (!pendingJoinRequests.has(roomId)) {
          pendingJoinRequests.set(roomId, new Map());
        }
        pendingJoinRequests.get(roomId)!.set(socket.id, reqItem);

        // If host has not yet entered the room, keep guest in waiting room
        if (!host) {
          console.log(
            `[Waiting Room] Guest "${userName}" (${socket.id}) waiting for host in room "${roomId}"`
          );
          socket.emit("join-response", {
            approved: false,
            waitingForHost: true,
            reason: "Waiting for the host to join...",
          });
          return;
        }

        // Host is present: forward admission request to the host
        console.log(`[Join Request] "${userName}" (${socket.id}) requested to join "${roomId}"`);
        io.to(host.socketId).emit("join-request-received", reqItem);

        // Also broadcast to the room so co-hosts can see
        socket.to(roomId).emit("join-request-received", reqItem);
      }
    );

    // ─── 0.1 HOST APPROVES / REJECTS JOIN REQUEST ─────────────
    socket.on(
      "approve-join-request",
      ({
        requesterSocketId,
        approved,
        roomId,
      }: {
        requesterSocketId: string;
        approved: boolean;
        roomId: string;
      }) => {
        console.log(
          `[Join Decision] Host responded for requester (${requesterSocketId}): ${
            approved ? "APPROVED" : "DENIED"
          }`
        );

        // Remove from pending join requests
        pendingJoinRequests.get(roomId)?.delete(requesterSocketId);

        io.to(requesterSocketId).emit("join-response", {
          approved,
          roomId,
          reason: approved ? undefined : "The meeting host declined your request to join.",
        });
      }
    );

    // ─── 1. JOIN ROOM ─────────────────────────────────────────
    socket.on(
      "join-room",
      async ({
        roomId,
        userId,
        userName,
        avatarUrl = "",
        isMuted = false,
        isCameraOff = false,
        isHost = false,
      }: {
        roomId: string;
        userId?: string;
        userName?: string;
        avatarUrl?: string;
        isMuted?: boolean;
        isCameraOff?: boolean;
        isHost?: boolean;
      }) => {
        if (!roomId) return;

        // If this user is the host:
        if (isHost) {
          // Re-open room if it was previously closed
          closedMeetings.delete(roomId);

          const memMeeting = memoryMeetings.get(roomId);
          if (memMeeting) {
            memMeeting.status = "active";
            memMeeting.endedAt = null;
          }

          const pool = getPool();
          if (pool) {
            try {
              await pool.query(
                "UPDATE meetings SET status = 'active', ended_at = NULL WHERE id = $1",
                [roomId]
              );
            } catch (dbErr) {
              console.warn("[Database] Could not update meeting status to active:", dbErr);
            }
          }

          roomHosts.set(roomId, {
            socketId: socket.id,
            userId: userId || `user_${Date.now()}`,
            userName: userName || "Host",
          });

          // Forward any pending join requests to this newly active host
          const pending = pendingJoinRequests.get(roomId);
          if (pending && pending.size > 0) {
            pending.forEach((req) => {
              socket.emit("join-request-received", req);
            });
          }
        } else {
          // Non-host: If the meeting was closed by the host, reject immediately
          if (closedMeetings.has(roomId)) {
            socket.emit("meeting-ended-by-host", {
              roomId,
              reason: "Host closed the meeting",
            });
            return;
          }
        }

        socket.join(roomId);

        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, new Map<string, SocketParticipant>());
        }

        const roomMap = roomParticipants.get(roomId)!;

        // Ensure host is recorded if not set
        if (isHost && !roomHosts.has(roomId)) {
          roomHosts.set(roomId, {
            socketId: socket.id,
            userId: userId || `user_${Date.now()}`,
            userName: userName || "Host",
          });
        }

        // Collect existing participants in this room to return to the new joiner
        const existingUsers: SocketParticipant[] = [];
        roomMap.forEach((user, existingSocketId) => {
          if (existingSocketId !== socket.id) {
            existingUsers.push(user);
          }
        });

        const newUser: SocketParticipant = {
          socketId: socket.id,
          userId: userId || `user_${Date.now()}`,
          userName: userName || "Participant",
          avatarUrl,
          isMuted,
          isCameraOff,
          joinedAt: new Date().toISOString(),
        };

        roomMap.set(socket.id, newUser);
        socketToRoom.set(socket.id, {
          roomId,
          userId: newUser.userId,
          userName: newUser.userName,
          isHost: isHost || roomHosts.get(roomId)?.socketId === socket.id,
        });

        console.log(
          `[Room Joined] "${newUser.userName}" (${socket.id}) entered "${roomId}". Total participants: ${roomMap.size}`
        );

        // 1. Send all already connected participants in the room to the newly joined peer
        socket.emit("existing-users", existingUsers);

        // 2. Broadcast to everyone else in the room that this new peer has joined
        socket.to(roomId).emit("user-joined", newUser);
      }
    );

    // ─── 1.1 HOST EXPLICITLY CLOSES / ENDS MEETING FOR ALL ───────
    socket.on("host-close-meeting", async ({ roomId }: { roomId: string }) => {
      console.log(`[Host Closed Meeting] Room: ${roomId} closed by host ${socket.id}`);
      closedMeetings.add(roomId);

      const memMeeting = memoryMeetings.get(roomId);
      if (memMeeting) {
        memMeeting.status = "ended";
        memMeeting.endedAt = new Date().toISOString();
      }

      const pool = getPool();
      if (pool) {
        try {
          await pool.query(
            "UPDATE meetings SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = $1",
            [roomId]
          );
        } catch (dbErr) {
          console.warn("[Database] Could not mark meeting as ended in DB:", dbErr);
        }
      }

      // Broadcast to all participants in the room (guests)
      socket.to(roomId).emit("meeting-ended-by-host", {
        roomId,
        reason: "Host closed the meeting",
      });

      // Also notify any pending knockers that the meeting was closed
      const pending = pendingJoinRequests.get(roomId);
      if (pending) {
        pending.forEach((req) => {
          io.to(req.requesterSocketId).emit("join-response", {
            approved: false,
            meetingClosed: true,
            reason: "Host closed the meeting",
          });
        });
        pendingJoinRequests.delete(roomId);
      }

      roomParticipants.delete(roomId);
      roomHosts.delete(roomId);
    });

    // ─── 2. WEBRTC SIGNALING: OFFER ───────────────────────────
    socket.on(
      "webrtc-offer",
      ({
        targetSocketId,
        offer,
        callerInfo,
      }: {
        targetSocketId: string;
        offer: any;
        callerInfo: {
          userId: string;
          userName: string;
          avatarUrl?: string;
          isMuted?: boolean;
          isCameraOff?: boolean;
        };
      }) => {
        io.to(targetSocketId).emit("webrtc-offer", {
          callerSocketId: socket.id,
          offer,
          callerInfo,
        });
      }
    );

    // ─── 3. WEBRTC SIGNALING: ANSWER ──────────────────────────
    socket.on(
      "webrtc-answer",
      ({ targetSocketId, answer }: { targetSocketId: string; answer: any }) => {
        io.to(targetSocketId).emit("webrtc-answer", {
          responderSocketId: socket.id,
          answer,
        });
      }
    );

    // ─── 4. WEBRTC SIGNALING: ICE CANDIDATE ───────────────────
    socket.on(
      "ice-candidate",
      ({ targetSocketId, candidate }: { targetSocketId: string; candidate: any }) => {
        io.to(targetSocketId).emit("ice-candidate", {
          senderSocketId: socket.id,
          candidate,
        });
      }
    );

    // ─── 5. MEDIA STATE TOGGLE (MUTE / CAMERA) ────────────────
    socket.on(
      "toggle-media",
      ({
        roomId,
        isMuted,
        isCameraOff,
      }: {
        roomId: string;
        isMuted?: boolean;
        isCameraOff?: boolean;
      }) => {
        const roomMap = roomParticipants.get(roomId);
        if (roomMap && roomMap.has(socket.id)) {
          const user = roomMap.get(socket.id)!;
          if (typeof isMuted === "boolean") user.isMuted = isMuted;
          if (typeof isCameraOff === "boolean") user.isCameraOff = isCameraOff;
          roomMap.set(socket.id, user);

          socket.to(roomId).emit("user-media-toggled", {
            socketId: socket.id,
            userId: user.userId,
            isMuted: user.isMuted,
            isCameraOff: user.isCameraOff,
          });
        }
      }
    );

    // ─── 6. REAL-TIME CHAT MESSAGING ──────────────────────────
    socket.on(
      "send-chat-message",
      async ({
        roomId,
        message,
      }: {
        roomId: string;
        message: {
          id?: string;
          userId: string;
          senderName: string;
          senderAvatar?: string;
          message: string;
          createdAt?: string;
        };
      }) => {
        if (!roomId || !message) return;

        const formattedMsg: MeetingMessage = {
          id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          meetingId: roomId,
          userId: message.userId,
          senderName: message.senderName,
          senderAvatar: message.senderAvatar || "",
          message: message.message,
          createdAt: message.createdAt || new Date().toISOString(),
        };

        // Cache in memory
        if (!memoryMessages.has(roomId)) {
          memoryMessages.set(roomId, []);
        }
        memoryMessages.get(roomId)?.push(formattedMsg);

        // Persist to PostgreSQL if configured
        const pool = getPool();
        if (pool) {
          try {
            await pool.query(
              "INSERT INTO meeting_messages (id, meeting_id, user_id, message) VALUES ($1, $2, $3, $4)",
              [formattedMsg.id, formattedMsg.meetingId, formattedMsg.userId, formattedMsg.message]
            );
          } catch (dbErr) {
            console.warn("[Database] Could not persist message to PostgreSQL:", dbErr);
          }
        }

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit("new-chat-message", formattedMsg);
      }
    );

    // ─── 7. DISCONNECT & LEAVE ROOM ───────────────────────────
    const handleLeave = async () => {
      // Remove any pending join request by this socket
      for (const reqs of pendingJoinRequests.values()) {
        if (reqs.has(socket.id)) {
          reqs.delete(socket.id);
        }
      }

      const userMeta = socketToRoom.get(socket.id);
      if (!userMeta) return;

      const { roomId, userId, userName, isHost } = userMeta;
      const roomMap = roomParticipants.get(roomId);
      const host = roomHosts.get(roomId);

      if (roomMap) {
        roomMap.delete(socket.id);
        console.log(
          `[Room Left] "${userName}" (${socket.id}) exited "${roomId}". Remaining: ${roomMap.size}`
        );

        if (roomMap.size === 0) {
          roomParticipants.delete(roomId);
        } else {
          socket.to(roomId).emit("user-disconnected", {
            socketId: socket.id,
            userId,
          });
        }
      }

      // If the user who disconnected was the host:
      // Note: We DO NOT permanently close the meeting or set closedMeetings on simple disconnect!
      // The host may be refreshing or experiencing a transient socket reconnect.
      // Only the explicit "host-close-meeting" event permanently ends the meeting.
      if (isHost || (host && host.socketId === socket.id)) {
        console.log(
          `[Host Disconnected] "${userName}" socket disconnected from room "${roomId}". Room remains valid.`
        );
        if (host && host.socketId === socket.id) {
          roomHosts.delete(roomId);
        }
      }

      socketToRoom.delete(socket.id);
    };

    socket.on("leave-room", handleLeave);
    socket.on("disconnect", handleLeave);
  });

  return io;
};
