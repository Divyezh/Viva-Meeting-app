import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { memoryMessages, getPool } from "./config/db.js";
import type { SocketParticipant, MeetingMessage } from "./types/index.js";

// Active room participants map: roomId -> Map(socketId -> SocketParticipant)
const roomParticipants = new Map<string, Map<string, SocketParticipant>>();
// Socket to room mapping: socketId -> { roomId, userId, userName }
const socketToRoom = new Map<string, { roomId: string; userId: string; userName: string }>();
// Room host mapping: roomId -> { socketId: string; userId: string; userName: string }
const roomHosts = new Map<string, { socketId: string; userId: string; userName: string }>();

export const setupSocket = (server: HttpServer): Server => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const io = new Server(server, {
    cors: {
      origin: [clientUrl, "http://localhost:5173", "http://localhost:3000", "*"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // ─── 0. REQUEST TO JOIN (Waiting Room / Admission Request) ─
    socket.on(
      "request-join",
      ({
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

        const roomMap = roomParticipants.get(roomId);
        const host = roomHosts.get(roomId);

        // If user is explicitly host, or if room is empty / no active host, auto-admit as host
        if (isHost || !roomMap || roomMap.size === 0 || !host) {
          roomHosts.set(roomId, { socketId: socket.id, userId, userName });
          socket.emit("join-response", { approved: true, isHost: true, roomId });
          return;
        }

        // Forward admission request to the host
        console.log(`[Join Request] "${userName}" (${socket.id}) requested to join "${roomId}"`);
        io.to(host.socketId).emit("join-request-received", {
          requesterSocketId: socket.id,
          userId,
          userName,
          avatarUrl,
          roomId,
        });

        // Also broadcast to the room so co-hosts can see
        socket.to(roomId).emit("join-request-received", {
          requesterSocketId: socket.id,
          userId,
          userName,
          avatarUrl,
          roomId,
        });
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
      ({
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

        socket.join(roomId);

        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, new Map<string, SocketParticipant>());
        }

        const roomMap = roomParticipants.get(roomId)!;

        // If this is the first user or marked host, register as host
        if (isHost || !roomHosts.has(roomId)) {
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
      ({
        targetSocketId,
        answer,
      }: {
        targetSocketId: string;
        answer: any;
      }) => {
        io.to(targetSocketId).emit("webrtc-answer", {
          responderSocketId: socket.id,
          answer,
        });
      }
    );

    // ─── 4. WEBRTC SIGNALING: ICE CANDIDATE ───────────────────
    socket.on(
      "ice-candidate",
      ({
        targetSocketId,
        candidate,
      }: {
        targetSocketId: string;
        candidate: any;
      }) => {
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
    const handleLeave = () => {
      const userMeta = socketToRoom.get(socket.id);
      if (!userMeta) return;

      const { roomId, userId, userName } = userMeta;
      const roomMap = roomParticipants.get(roomId);

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

      socketToRoom.delete(socket.id);
    };

    socket.on("leave-room", handleLeave);
    socket.on("disconnect", handleLeave);
  });

  return io;
};
