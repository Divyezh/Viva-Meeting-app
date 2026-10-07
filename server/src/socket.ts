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
// Users the host has admitted per room (survives socket reconnects / page refreshes): roomId -> Set(userId)
const admittedUsers = new Map<string, Set<string>>();

const isRoomHostSocket = (roomId: string, socketId: string): boolean =>
  roomHosts.get(roomId)?.socketId === socketId ||
  (socketToRoom.get(socketId)?.roomId === roomId && !!socketToRoom.get(socketId)?.isHost);

// Screen share permission state per room: roomId -> state
interface RoomScreenShareState {
  allAllowed: boolean;
  allowedUserIds: Set<string>;
  allowedSocketIds: Set<string>;
  currentPresenterSocketId?: string;
  currentPresenterUserId?: string;
}
const roomScreenShareState = new Map<string, RoomScreenShareState>();

const getOrCreateScreenShareState = (roomId: string): RoomScreenShareState => {
  if (!roomScreenShareState.has(roomId)) {
    roomScreenShareState.set(roomId, {
      allAllowed: false,
      allowedUserIds: new Set<string>(),
      allowedSocketIds: new Set<string>(),
    });
  }
  return roomScreenShareState.get(roomId)!;
};

export const setupSocket = (server: HttpServer): Server => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket Connected] ID: ${socket.id}`);

    // ─── CENTRALIZED ROOM LEAVE / SWITCH HELPER ───────────────
    // Strictly guarantees:
    // 1. Each socket is only ever registered in ONE room's state.
    // 2. Switching rooms immediately leaves the old room, stops broadcasts, and alerts peers.
    // 3. Pending knocks in other rooms are cleaned up and old hosts notified.
    // 4. Empty room states are completely pruned.
    const leaveCurrentRoom = (newRoomId?: string) => {
      // Clean up any pending join requests across all rooms (or rooms other than newRoomId)
      for (const [rId, reqs] of pendingJoinRequests.entries()) {
        if (rId !== newRoomId && reqs.has(socket.id)) {
          const removedReq = reqs.get(socket.id);
          reqs.delete(socket.id);
          const host = roomHosts.get(rId);
          if (host && removedReq && host.socketId !== socket.id) {
            io.to(host.socketId).emit("join-request-cancelled", {
              requesterSocketId: socket.id,
              userId: removedReq.userId,
            });
          }
        }
      }

      const userMeta = socketToRoom.get(socket.id);
      if (!userMeta) {
        // Even without userMeta, ensure socket is not lingering in untracked rooms
        for (const room of socket.rooms) {
          if (room !== socket.id && room !== newRoomId) {
            console.log(`[Room Isolation] Socket ${socket.id} left untracked room: "${room}"`);
            socket.leave(room);
          }
        }
        return;
      }

      const { roomId: oldRoomId, userId, userName, isHost } = userMeta;
      if (newRoomId && oldRoomId === newRoomId) {
        return; // Already registered in this room
      }

      console.log(
        `[Room ${newRoomId ? "Switch" : "Left"}] "${userName}" (${socket.id}) leaving "${oldRoomId}"${
          newRoomId ? ` -> switching to "${newRoomId}"` : ""
        }`
      );

      socket.leave(oldRoomId);
      const roomMap = roomParticipants.get(oldRoomId);
      const host = roomHosts.get(oldRoomId);

      if (roomMap) {
        roomMap.delete(socket.id);
        console.log(
          `[Room Participants] "${oldRoomId}" remaining active participants: ${roomMap.size}`
        );

        const shareState = roomScreenShareState.get(oldRoomId);
        if (shareState) {
          shareState.allowedSocketIds.delete(socket.id);
          if (shareState.currentPresenterSocketId === socket.id) {
            shareState.currentPresenterSocketId = undefined;
            shareState.currentPresenterUserId = undefined;
            socket.to(oldRoomId).emit("user-media-toggled", {
              socketId: socket.id,
              userId,
              isScreenSharing: false,
            });
          }
        }

        if (roomMap.size === 0) {
          roomParticipants.delete(oldRoomId);
          roomScreenShareState.delete(oldRoomId);
          admittedUsers.delete(oldRoomId);
          console.log(`[Room Purged] Room "${oldRoomId}" has no remaining participants, state cleared.`);
        } else {
          socket.to(oldRoomId).emit("user-disconnected", {
            socketId: socket.id,
            userId,
          });
        }
      }

      if (isHost || (host && host.socketId === socket.id)) {
        console.log(
          `[Host Disconnected] "${userName}" left room "${oldRoomId}".`
        );
        if (host && host.socketId === socket.id) {
          roomHosts.delete(oldRoomId);
        }
      }

      socketToRoom.delete(socket.id);

      // Explicitly leave all other socket.io rooms (except socket.id and newRoomId)
      for (const room of socket.rooms) {
        if (room !== socket.id && room !== newRoomId) {
          socket.leave(room);
        }
      }
    };

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

        // Clean up from any previous room before knocking or joining
        leaveCurrentRoom(roomId);

        // 1. If the user is the HOST:
        if (isHost) {
          // Reopen meeting in case it was previously closed
          closedMeetings.delete(roomId);

          const memMeeting = memoryMeetings.get(roomId);
          if (memMeeting) {
            memMeeting.status = "active";
            memMeeting.endedAt = null;
          }

          // Non-blocking async DB update (no await to eliminate latency)
          const pool = getPool();
          if (pool) {
            pool.query(
              "UPDATE meetings SET status = 'active', ended_at = NULL WHERE id = $1",
              [roomId]
            ).catch((err) => console.warn("[Database] Could not reopen meeting in DB:", err));
          }

          roomHosts.set(roomId, { socketId: socket.id, userId, userName });
          socket.join(roomId);
          socket.emit("join-response", { approved: true, isHost: true, roomId });

          // Forward any pending join requests from guests who knocked earlier
          const pending = pendingJoinRequests.get(roomId);
          if (pending && pending.size > 0) {
            console.log(`[Host Registered] Forwarding ${pending.size} pending knocks to host ${socket.id}`);
            pending.forEach((req) => {
              socket.emit("join-request-received", req);
            });
          }
          return;
        }

        // 2. If the user is a GUEST:
        // Check if meeting has been explicitly closed by the host (fast in-memory lookup)
        if (closedMeetings.has(roomId)) {
          console.log(`[Join Denied] Room "${roomId}" was already closed by the host.`);
          socket.emit("join-response", {
            approved: false,
            meetingClosed: true,
            reason: "Host closed the meeting",
          });
          return;
        }

        const memMeeting = memoryMeetings.get(roomId);
        if (memMeeting && memMeeting.status === "ended" && !roomHosts.has(roomId)) {
          closedMeetings.add(roomId);
          socket.emit("join-response", {
            approved: false,
            meetingClosed: true,
            reason: "Host closed the meeting",
          });
          return;
        }

        // Already admitted? (duplicate emit, refresh, or reconnect) -> approve without bothering host
        const alreadyInRoom = roomParticipants.get(roomId)?.has(socket.id);
        if (alreadyInRoom || (userId && admittedUsers.get(roomId)?.has(userId))) {
          console.log(
            `[Admission] "${userName}" (${socket.id}) already admitted to "${roomId}" -> auto-approve`
          );
          pendingJoinRequests.get(roomId)?.delete(socket.id);
          socket.emit("join-response", { approved: true, roomId });
          return;
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

        const roomPending = pendingJoinRequests.get(roomId)!;
        // Clean up any stale socket entries for the same userId (e.g. on socket reconnect)
        for (const [oldSockId, existing] of roomPending.entries()) {
          if (existing.userId === userId && oldSockId !== socket.id) {
            roomPending.delete(oldSockId);
          }
        }
        const isDuplicateKnock = roomPending.has(socket.id);
        roomPending.set(socket.id, reqItem);
        console.log(
          `[${new Date().toISOString()}] [Server Admission Trace] request-join received from "${userName}" (${socket.id}) for "${roomId}"${
            isDuplicateKnock ? " [already pending in queue]" : ""
          }`
        );

        // Find active living host socket (with fallback search in roomParticipants / socketToRoom)
        let host = roomHosts.get(roomId);
        if (!host || !io.sockets.sockets.has(host.socketId)) {
          const currentRoomMap = roomParticipants.get(roomId);
          if (currentRoomMap) {
            for (const [sId, p] of currentRoomMap.entries()) {
              const meta = socketToRoom.get(sId);
              if (meta?.isHost && io.sockets.sockets.has(sId)) {
                host = { socketId: sId, userId: p.userId, userName: p.userName };
                roomHosts.set(roomId, host);
                break;
              }
            }
          }
        }

        // If host has not yet entered the room or socket is connecting, keep guest in waiting room
        if (!host || !io.sockets.sockets.has(host.socketId)) {
          console.log(
            `[${new Date().toISOString()}] [Server Admission Trace] Guest "${userName}" (${socket.id}) queued: waiting for host in room "${roomId}"`
          );
          socket.emit("join-response", {
            approved: false,
            waitingForHost: true,
            reason: "Waiting for the host to join...",
          });
          return;
        }

        // Check 8-participant capacity limit for Free plan
        const currentRoomMap = roomParticipants.get(roomId);
        const currentActiveCount = currentRoomMap
          ? Array.from(currentRoomMap.keys()).filter((sId) => io.sockets.sockets.has(sId)).length
          : 0;
        if (!isHost && currentActiveCount >= 8) {
          socket.emit("join-response", {
            approved: false,
            reason: "This meeting room is full (maximum 8 participants on Free plan).",
          });
          return;
        }

        // Host is present: forward admission request directly to the host immediately
        console.log(
          `[${new Date().toISOString()}] [Server Admission Trace] Forwarding knock "${userName}" (${socket.id}) -> Host (${host.socketId})`
        );
        io.to(host.socketId).emit("join-request-received", reqItem);
      }
    );

    // ─── 0.1 HOST APPROVES / REJECTS JOIN REQUEST ─────────────
    socket.on(
      "approve-join-request",
      ({
        requesterSocketId,
        approved,
        roomId,
        reason,
      }: {
        requesterSocketId: string;
        approved: boolean;
        roomId: string;
        reason?: string;
      }) => {
        console.log(
          `[Admission] Host (${socket.id}) decision for requester (${requesterSocketId}) in "${roomId}": ${
            approved ? "APPROVED" : "DENIED"
          }`
        );

        if (!isRoomHostSocket(roomId, socket.id)) {
          console.warn(`[Admission] Ignoring decision from non-host socket ${socket.id} in "${roomId}"`);
          return;
        }

        // Check if requester is still connected before approving
        const requesterSocket = io.sockets.sockets.get(requesterSocketId);
        if (!requesterSocket) {
          console.log(`[Admission] Requester ${requesterSocketId} already disconnected.`);
          pendingJoinRequests.get(roomId)?.delete(requesterSocketId);
          socket.emit("join-request-cancelled", {
            requesterSocketId,
            userId: "",
          });
          return;
        }

        // Remove from pending join requests and record the decision server-side
        const req = pendingJoinRequests.get(roomId)?.get(requesterSocketId);
        pendingJoinRequests.get(roomId)?.delete(requesterSocketId);
        if (req?.userId) {
          if (!admittedUsers.has(roomId)) admittedUsers.set(roomId, new Set());
          if (approved) admittedUsers.get(roomId)!.add(req.userId);
          else admittedUsers.get(roomId)!.delete(req.userId);
        }

        console.log(`[Admission] Sending join-response(approved=${approved}) to ${requesterSocketId}`);
        io.to(requesterSocketId).emit("join-response", {
          approved,
          roomId,
          reason: approved
            ? undefined
            : reason || "The meeting host declined your request to join.",
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

        // Clean up from any previous room before joining this new room
        leaveCurrentRoom(roomId);

        // Idempotency: the same socket must never be registered twice in a room
        if (roomParticipants.get(roomId)?.has(socket.id)) {
          console.log(`[Room] Duplicate join-room from ${socket.id} for "${roomId}" ignored`);
          return;
        }
        pendingJoinRequests.get(roomId)?.delete(socket.id);

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
            pool.query(
              "UPDATE meetings SET status = 'active', ended_at = NULL WHERE id = $1",
              [roomId]
            ).catch((dbErr) => console.warn("[Database] Could not update meeting status to active:", dbErr));
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
        const effectiveUserId = userId || `user_${Date.now()}`;

        // Ensure host is recorded if not set
        if (isHost && !roomHosts.has(roomId)) {
          roomHosts.set(roomId, {
            socketId: socket.id,
            userId: effectiveUserId,
            userName: userName || "Host",
          });
        }

        // Clean up any dead sockets or stale entries in this room
        roomMap.forEach((existingUser, existingSocketId) => {
          const isAlive = io.sockets.sockets.has(existingSocketId);
          if (!isAlive || (existingSocketId !== socket.id && existingUser.userId === effectiveUserId)) {
            console.log(
              `[Deduplicate] Purging inactive/stale socket ${existingSocketId} for user ${existingUser.userId}`
            );
            roomMap.delete(existingSocketId);
            socketToRoom.delete(existingSocketId);
            if (isAlive) {
              socket.to(roomId).emit("user-disconnected", {
                socketId: existingSocketId,
                userId: existingUser.userId,
              });
            }
          }
        });

        // 8-participant capacity limit check for Free tier
        const activeCount = Array.from(roomMap.keys()).filter((sId) => io.sockets.sockets.has(sId)).length;
        if (!isHost && !roomMap.has(socket.id) && activeCount >= 8) {
          socket.emit("join-response", {
            approved: false,
            reason: "This room has reached maximum capacity of 8 participants for the Free plan.",
          });
          return;
        }

        // Collect existing participants in this room (deduplicated by userId)
        const shareState = getOrCreateScreenShareState(roomId);
        if (isHost) {
          shareState.allowedUserIds.add(effectiveUserId);
          shareState.allowedSocketIds.add(socket.id);
        }
        const userCanShare =
          isHost ||
          shareState.allAllowed ||
          shareState.allowedUserIds.has(effectiveUserId) ||
          shareState.allowedSocketIds.has(socket.id);

        const existingUsers: SocketParticipant[] = [];
        const seenUserIds = new Set<string>();
        const hostSocketId = roomHosts.get(roomId)?.socketId;
        roomMap.forEach((user, existingSocketId) => {
          const isAlive = io.sockets.sockets.has(existingSocketId);
          if (!isAlive) {
            roomMap.delete(existingSocketId);
            socketToRoom.delete(existingSocketId);
            return;
          }

          if (
            existingSocketId !== socket.id &&
            user.userId !== effectiveUserId &&
            !seenUserIds.has(user.userId)
          ) {
            seenUserIds.add(user.userId);
            const peerCanShare =
              shareState.allAllowed ||
              shareState.allowedUserIds.has(user.userId) ||
              shareState.allowedSocketIds.has(existingSocketId) ||
              hostSocketId === existingSocketId;
            existingUsers.push({
              ...user,
              canShareScreen: peerCanShare,
              isScreenSharing: !!user.isScreenSharing,
            });
          }
        });

        const newUser: SocketParticipant = {
          socketId: socket.id,
          userId: effectiveUserId,
          userName: userName || "Participant",
          avatarUrl,
          isMuted,
          isCameraOff,
          isScreenSharing: false,
          canShareScreen: userCanShare,
          joinedAt: new Date().toISOString(),
        };

        roomMap.set(socket.id, newUser);
        socketToRoom.set(socket.id, {
          roomId,
          userId: newUser.userId,
          userName: newUser.userName,
          isHost: isHost || hostSocketId === socket.id,
        });

        console.log(
          `[Room Joined] "${newUser.userName}" (${socket.id}) entered "${roomId}". Total participants in room: ${roomMap.size}`
        );

        // 1. Send all already connected participants in the room to the newly joined peer
        socket.emit("existing-users", existingUsers);

        // 2. Send screen share status to newly joined peer
        socket.emit("screen-share-status", {
          canShare: userCanShare,
          allAllowed: shareState.allAllowed,
          allowedUserIds: Array.from(shareState.allowedUserIds),
          currentPresenterSocketId: shareState.currentPresenterSocketId,
        });

        // 3. Broadcast to everyone else in the room that this new peer has joined
        socket.to(roomId).emit("user-joined", newUser);
      }
    );

    // ─── 1.1 HOST EXPLICITLY CLOSES / ENDS MEETING FOR ALL ───────
    socket.on("host-close-meeting", async ({ roomId }: { roomId: string }) => {
      if (!isRoomHostSocket(roomId, socket.id)) {
        console.warn(`[Host Close Blocked] Non-host socket ${socket.id} attempted to close "${roomId}"`);
        return;
      }

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
      roomScreenShareState.delete(roomId);
      admittedUsers.delete(roomId);
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
        const callerRoom = socketToRoom.get(socket.id)?.roomId;
        const targetRoom = socketToRoom.get(targetSocketId)?.roomId;
        if (!callerRoom || !targetRoom || callerRoom !== targetRoom) {
          console.warn(
            `[WebRTC Blocked] Offer cross-room attempt: caller ${socket.id} (room "${callerRoom}") -> target ${targetSocketId} (room "${targetRoom}")`
          );
          return;
        }

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
        const callerRoom = socketToRoom.get(socket.id)?.roomId;
        const targetRoom = socketToRoom.get(targetSocketId)?.roomId;
        if (!callerRoom || !targetRoom || callerRoom !== targetRoom) {
          console.warn(
            `[WebRTC Blocked] Answer cross-room attempt: responder ${socket.id} (room "${callerRoom}") -> target ${targetSocketId} (room "${targetRoom}")`
          );
          return;
        }

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
        const callerRoom = socketToRoom.get(socket.id)?.roomId;
        const targetRoom = socketToRoom.get(targetSocketId)?.roomId;
        if (!callerRoom || !targetRoom || callerRoom !== targetRoom) {
          console.warn(
            `[WebRTC Blocked] ICE candidate cross-room attempt: sender ${socket.id} (room "${callerRoom}") -> target ${targetSocketId} (room "${targetRoom}")`
          );
          return;
        }

        io.to(targetSocketId).emit("ice-candidate", {
          senderSocketId: socket.id,
          candidate,
        });
      }
    );

    // ─── 5. MEDIA STATE TOGGLE (MUTE / CAMERA / SCREEN SHARE) ───
    socket.on(
      "toggle-media",
      ({
        roomId,
        isMuted,
        isCameraOff,
        isScreenSharing,
      }: {
        roomId: string;
        isMuted?: boolean;
        isCameraOff?: boolean;
        isScreenSharing?: boolean;
      }) => {
        const userMeta = socketToRoom.get(socket.id);
        if (!userMeta || userMeta.roomId !== roomId) {
          console.warn(`[Media Toggle Blocked] Socket ${socket.id} not verified in room "${roomId}"`);
          return;
        }

        const roomMap = roomParticipants.get(roomId);
        if (roomMap && roomMap.has(socket.id)) {
          const user = roomMap.get(socket.id)!;
          if (typeof isMuted === "boolean") user.isMuted = isMuted;
          if (typeof isCameraOff === "boolean") user.isCameraOff = isCameraOff;
          if (typeof isScreenSharing === "boolean") {
            user.isScreenSharing = isScreenSharing;
            const shareState = getOrCreateScreenShareState(roomId);
            if (isScreenSharing) {
              shareState.currentPresenterSocketId = socket.id;
              shareState.currentPresenterUserId = user.userId;
            } else if (shareState.currentPresenterSocketId === socket.id) {
              shareState.currentPresenterSocketId = undefined;
              shareState.currentPresenterUserId = undefined;
            }
          }
          roomMap.set(socket.id, user);

          socket.to(roomId).emit("user-media-toggled", {
            socketId: socket.id,
            userId: user.userId,
            isMuted: user.isMuted,
            isCameraOff: user.isCameraOff,
            isScreenSharing: user.isScreenSharing,
          });
        }
      }
    );

    // ─── 5.1 SCREEN SHARE PERMISSION HANDLERS ─────────────────
    // A. Guest requests permission to share screen
    socket.on(
      "request-screen-share-permission",
      ({
        roomId,
        userId,
        userName,
      }: {
        roomId: string;
        userId: string;
        userName: string;
      }) => {
        const userMeta = socketToRoom.get(socket.id);
        if (!userMeta || userMeta.roomId !== roomId) return;

        const host = roomHosts.get(roomId);
        if (host) {
          console.log(
            `[Screen Share Request] "${userName}" (${socket.id}) requested screen share permission in "${roomId}"`
          );
          io.to(host.socketId).emit("screen-share-request-received", {
            requesterSocketId: socket.id,
            userId,
            userName: userName || "Participant",
            roomId,
          });
        }
      }
    );

    // B. Host responds to screen share request
    socket.on(
      "respond-screen-share-request",
      ({
        roomId,
        requesterSocketId,
        userId,
        allowed,
      }: {
        roomId: string;
        requesterSocketId: string;
        userId?: string;
        allowed: boolean;
      }) => {
        if (!isRoomHostSocket(roomId, socket.id)) return;
        const requesterMeta = socketToRoom.get(requesterSocketId);
        if (!requesterMeta || requesterMeta.roomId !== roomId) return;

        const shareState = getOrCreateScreenShareState(roomId);
        if (allowed) {
          shareState.allowedSocketIds.add(requesterSocketId);
          if (userId) shareState.allowedUserIds.add(userId);
        } else {
          shareState.allowedSocketIds.delete(requesterSocketId);
          if (userId) shareState.allowedUserIds.delete(userId);
        }

        io.to(requesterSocketId).emit("screen-share-permission-response", {
          allowed,
          roomId,
        });

        io.to(roomId).emit("screen-share-permissions-updated", {
          allAllowed: shareState.allAllowed,
          allowedUserIds: Array.from(shareState.allowedUserIds),
        });
      }
    );

    // C. Host grants/revokes permission for a specific user
    socket.on(
      "set-screen-share-permission",
      ({
        roomId,
        targetSocketId,
        targetUserId,
        allowed,
      }: {
        roomId: string;
        targetSocketId?: string;
        targetUserId?: string;
        allowed: boolean;
      }) => {
        if (!isRoomHostSocket(roomId, socket.id)) return;
        if (targetSocketId) {
          const targetMeta = socketToRoom.get(targetSocketId);
          if (!targetMeta || targetMeta.roomId !== roomId) return;
        }

        const shareState = getOrCreateScreenShareState(roomId);
        if (allowed) {
          if (targetSocketId) shareState.allowedSocketIds.add(targetSocketId);
          if (targetUserId) shareState.allowedUserIds.add(targetUserId);
        } else {
          if (targetSocketId) {
            shareState.allowedSocketIds.delete(targetSocketId);
            io.to(targetSocketId).emit("force-stop-screen-share");
          }
          if (targetUserId) shareState.allowedUserIds.delete(targetUserId);
        }

        if (targetSocketId) {
          io.to(targetSocketId).emit("screen-share-permission-response", {
            allowed,
            roomId,
          });
        }

        io.to(roomId).emit("screen-share-permissions-updated", {
          allAllowed: shareState.allAllowed,
          allowedUserIds: Array.from(shareState.allowedUserIds),
        });
      }
    );

    // D. Host toggles room-wide screen share permission (allow anyone)
    socket.on(
      "toggle-all-screen-share",
      ({ roomId, allAllowed }: { roomId: string; allAllowed: boolean }) => {
        if (!isRoomHostSocket(roomId, socket.id)) return;

        const shareState = getOrCreateScreenShareState(roomId);
        shareState.allAllowed = allAllowed;

        if (!allAllowed) {
          const host = roomHosts.get(roomId);
          const roomMap = roomParticipants.get(roomId);
          if (roomMap) {
            roomMap.forEach((user, sockId) => {
              const isH = host?.socketId === sockId;
              const isPermitted =
                shareState.allowedUserIds.has(user.userId) ||
                shareState.allowedSocketIds.has(sockId);
              if (!isH && !isPermitted && user.isScreenSharing) {
                io.to(sockId).emit("force-stop-screen-share");
              }
            });
          }
        }

        io.to(roomId).emit("screen-share-permissions-updated", {
          allAllowed: shareState.allAllowed,
          allowedUserIds: Array.from(shareState.allowedUserIds),
        });
      }
    );

    // E. Host force stops any participant's active screen share
    socket.on(
      "stop-participant-screen-share",
      ({ roomId, targetSocketId }: { roomId: string; targetSocketId: string }) => {
        if (!isRoomHostSocket(roomId, socket.id)) return;
        if (targetSocketId) {
          const targetMeta = socketToRoom.get(targetSocketId);
          if (!targetMeta || targetMeta.roomId !== roomId) return;
          io.to(targetSocketId).emit("force-stop-screen-share");
        }
      }
    );

    // ─── 5.2 REAL-TIME EMOJI REACTIONS ────────────────────────
    socket.on(
      "send-reaction",
      ({
        roomId,
        reaction,
      }: {
        roomId: string;
        reaction: {
          id: string;
          emoji: string;
          userId: string;
          senderName: string;
          senderAvatar?: string;
          timestamp: number;
        };
      }) => {
        if (!roomId || !reaction) return;
        const userMeta = socketToRoom.get(socket.id);
        if (!userMeta || userMeta.roomId !== roomId) {
          console.warn(`[Reaction Blocked] Socket ${socket.id} not verified in room "${roomId}"`);
          return;
        }
        io.to(roomId).emit("new-reaction", reaction);
      }
    );

    // ─── 5.3 REAL-TIME LIVE CAPTIONS (SPEECH & TRANSLATION) ───
    socket.on(
      "send-caption",
      ({
        roomId,
        caption,
      }: {
        roomId: string;
        caption: {
          id: string;
          userId: string;
          senderName: string;
          senderAvatar?: string;
          originalText: string;
          text: string;
          spokenLang: string;
          targetLang: string;
          timestamp: number;
        };
      }) => {
        if (!roomId || !caption) return;
        const userMeta = socketToRoom.get(socket.id);
        if (!userMeta || userMeta.roomId !== roomId) {
          console.warn(`[Caption Blocked] Socket ${socket.id} not verified in room "${roomId}"`);
          return;
        }
        io.to(roomId).emit("new-caption", caption);
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
        const userMeta = socketToRoom.get(socket.id);
        if (!userMeta || userMeta.roomId !== roomId) {
          console.warn(`[Chat Blocked] Socket ${socket.id} not in room "${roomId}"`);
          return;
        }

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

        // Persist to PostgreSQL if configured (non-blocking)
        const pool = getPool();
        if (pool) {
          pool.query(
            "INSERT INTO meeting_messages (id, meeting_id, user_id, message) VALUES ($1, $2, $3, $4)",
            [formattedMsg.id, formattedMsg.meetingId, formattedMsg.userId, formattedMsg.message]
          ).catch((dbErr) => console.warn("[Database] Could not persist message to PostgreSQL:", dbErr));
        }

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit("new-chat-message", formattedMsg);
      }
    );

    // ─── 7. DISCONNECT & LEAVE ROOM ───────────────────────────
    const handleLeave = () => {
      leaveCurrentRoom();
    };

    socket.on("leave-room", handleLeave);
    socket.on("disconnect", (reason: string) => {
      const userMeta = socketToRoom.get(socket.id);
      console.log(
        `[Socket Disconnected] Socket ${socket.id} (user: "${userMeta?.userName || "unknown"}", room: "${userMeta?.roomId || "none"}") disconnected. Reason: "${reason}"`
      );
      leaveCurrentRoom();
    });
  });

  return io;
};
