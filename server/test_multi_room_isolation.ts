import http from "http";
import express from "express";
import { setupSocket } from "./src/socket.js";
import { io as ioClient, Socket as ClientSocket } from "../client/node_modules/socket.io-client/build/cjs/index.js";

const TEST_PORT = 5099;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

async function runTest() {
  console.log("=================================================================");
  console.log("  MULTI-ROOM ISOLATION & CONCURRENCY VERIFICATION TEST");
  console.log("=================================================================\n");

  const app = express();
  const server = http.createServer(app);
  setupSocket(server);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`[Test Server] Running on ${SERVER_URL}\n`);
      resolve();
    });
  });

  const createClient = (name: string): ClientSocket => {
    const s = ioClient(SERVER_URL, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
    });
    s.on("connect_error", (err) => {
      console.error(`[${name} Connection Error]:`, err.message);
    });
    return s;
  };

  const hostAlpha = createClient("Host Alpha");
  const guestAlpha = createClient("Guest Alpha");
  const hostBeta = createClient("Host Beta");
  const guestBeta = createClient("Guest Beta");

  // Wait for all 4 sockets to connect
  await Promise.all([
    new Promise<void>((resolve) => hostAlpha.on("connect", () => resolve())),
    new Promise<void>((resolve) => guestAlpha.on("connect", () => resolve())),
    new Promise<void>((resolve) => hostBeta.on("connect", () => resolve())),
    new Promise<void>((resolve) => guestBeta.on("connect", () => resolve())),
  ]);

  console.log("✓ All 4 test client sockets connected successfully.\n");

  let testPassed = true;
  const fail = (msg: string) => {
    console.error(`❌ FAILURE: ${msg}`);
    testPassed = false;
  };
  const pass = (msg: string) => {
    console.log(`✓ PASS: ${msg}`);
  };

  // Cross-talk leak detector: verify Room Beta NEVER receives Room Alpha events
  const crossTalkLeaks: string[] = [];
  hostBeta.on("user-joined", (data) => {
    if (data.userId === "user_guest_alpha") crossTalkLeaks.push("hostBeta got Alpha user-joined");
  });
  guestBeta.on("user-joined", (data) => {
    if (data.userId === "user_guest_alpha") crossTalkLeaks.push("guestBeta got Alpha user-joined");
  });
  hostBeta.on("new-chat-message", (msg) => {
    if (msg.meetingId === "meeting-alpha") crossTalkLeaks.push(`hostBeta got Alpha chat: ${msg.message}`);
  });
  guestBeta.on("new-chat-message", (msg) => {
    if (msg.meetingId === "meeting-alpha") crossTalkLeaks.push(`guestBeta got Alpha chat: ${msg.message}`);
  });
  hostBeta.on("webrtc-offer", (data) => {
    if (data.callerInfo?.userId === "user_guest_alpha") crossTalkLeaks.push("hostBeta got Alpha webrtc-offer");
  });
  guestBeta.on("webrtc-offer", (data) => {
    if (data.callerInfo?.userId === "user_guest_alpha") crossTalkLeaks.push("guestBeta got Alpha webrtc-offer");
  });

  // ── TEST 1: Register Hosts for 2 Independent Rooms ──────────
  console.log("--> TEST 1: Registering Hosts for meeting-alpha and meeting-beta");

  const hostAlphaReady = new Promise<void>((resolve) => {
    hostAlpha.once("join-response", (res) => {
      if (res.approved) {
        hostAlpha.emit("join-room", {
          roomId: "meeting-alpha",
          userId: "user_host_alpha",
          userName: "Host Alpha",
          isHost: true,
        });
        resolve();
      }
    });
    hostAlpha.emit("request-join", {
      roomId: "meeting-alpha",
      userId: "user_host_alpha",
      userName: "Host Alpha",
      isHost: true,
    });
  });

  const hostBetaReady = new Promise<void>((resolve) => {
    hostBeta.once("join-response", (res) => {
      if (res.approved) {
        hostBeta.emit("join-room", {
          roomId: "meeting-beta",
          userId: "user_host_beta",
          userName: "Host Beta",
          isHost: true,
        });
        resolve();
      }
    });
    hostBeta.emit("request-join", {
      roomId: "meeting-beta",
      userId: "user_host_beta",
      userName: "Host Beta",
      isHost: true,
    });
  });

  await Promise.all([hostAlphaReady, hostBetaReady]);
  await new Promise((r) => setTimeout(r, 200));
  pass("Both hosts registered and entered separate rooms (meeting-alpha & meeting-beta)");

  // ── TEST 2: Knock/Admission Scoping ──────────────────────────
  console.log("\n--> TEST 2: Guest knocks on meeting-alpha (Admission Scoping)");
  let hostAlphaReceivedKnock = false;
  let hostBetaReceivedKnock = false;

  hostAlpha.on("join-request-received", (req) => {
    if (req.roomId === "meeting-alpha" && req.userId === "user_guest_alpha") {
      hostAlphaReceivedKnock = true;
    }
  });
  hostBeta.on("join-request-received", () => {
    hostBetaReceivedKnock = true;
  });

  guestAlpha.emit("request-join", {
    roomId: "meeting-alpha",
    userId: "user_guest_alpha",
    userName: "Guest Alpha",
    isHost: false,
  });

  await new Promise((r) => setTimeout(r, 300));

  if (hostAlphaReceivedKnock && !hostBetaReceivedKnock) {
    pass("Knock on meeting-alpha only delivered to Host Alpha (Host Beta received 0 knocks)");
  } else {
    fail(`Knock scoping error: hostAlphaReceivedKnock=${hostAlphaReceivedKnock}, hostBetaReceivedKnock=${hostBetaReceivedKnock}`);
  }

  // ── TEST 3: Admission Approval & Room Join Scoping ──────────
  console.log("\n--> TEST 3: Host Alpha admits Guest Alpha; Host Beta admits Guest Beta");
  let guestAlphaAdmitted = false;
  guestAlpha.on("join-response", (res) => {
    if (res.approved && res.roomId === "meeting-alpha") {
      guestAlphaAdmitted = true;
    }
  });

  hostAlpha.emit("approve-join-request", {
    requesterSocketId: guestAlpha.id,
    approved: true,
    roomId: "meeting-alpha",
  });

  await new Promise((r) => setTimeout(r, 200));

  if (guestAlphaAdmitted) {
    pass("Guest Alpha received approved join-response for meeting-alpha");
  } else {
    fail("Guest Alpha was not admitted to meeting-alpha");
  }

  // Guest Alpha joins meeting-alpha
  guestAlpha.emit("join-room", {
    roomId: "meeting-alpha",
    userId: "user_guest_alpha",
    userName: "Guest Alpha",
    isHost: false,
  });

  // Guest Beta knocks on meeting-beta and Host Beta admits
  const guestBetaAdmitted = new Promise<void>((resolve) => {
    hostBeta.once("join-request-received", () => {
      hostBeta.emit("approve-join-request", {
        requesterSocketId: guestBeta.id,
        approved: true,
        roomId: "meeting-beta",
      });
    });
    guestBeta.once("join-response", (res) => {
      if (res.approved && res.roomId === "meeting-beta") {
        guestBeta.emit("join-room", {
          roomId: "meeting-beta",
          userId: "user_guest_beta",
          userName: "Guest Beta",
          isHost: false,
        });
        resolve();
      }
    });
    guestBeta.emit("request-join", {
      roomId: "meeting-beta",
      userId: "user_guest_beta",
      userName: "Guest Beta",
      isHost: false,
    });
  });

  await guestBetaAdmitted;
  await new Promise((r) => setTimeout(r, 300));

  if (crossTalkLeaks.length === 0) {
    pass("No join events crossed between meeting-alpha and meeting-beta");
  } else {
    fail(`Cross-talk detected during join: ${crossTalkLeaks.join("; ")}`);
  }

  // ── TEST 4: Chat Message Scoping ────────────────────────────
  console.log("\n--> TEST 4: Chat Message Isolation between rooms");
  let alphaChatCount = 0;
  let betaChatCount = 0;

  hostAlpha.on("new-chat-message", (msg) => {
    if (msg.meetingId === "meeting-alpha") alphaChatCount++;
  });
  guestAlpha.on("new-chat-message", (msg) => {
    if (msg.meetingId === "meeting-alpha") alphaChatCount++;
  });
  hostBeta.on("new-chat-message", (msg) => {
    if (msg.meetingId === "meeting-alpha") betaChatCount++;
  });
  guestBeta.on("new-chat-message", (msg) => {
    if (msg.meetingId === "meeting-alpha") betaChatCount++;
  });

  guestAlpha.emit("send-chat-message", {
    roomId: "meeting-alpha",
    message: {
      userId: "user_guest_alpha",
      senderName: "Guest Alpha",
      message: "Secret chat in Room Alpha",
    },
  });

  await new Promise((r) => setTimeout(r, 300));

  if (alphaChatCount === 2 && betaChatCount === 0) {
    pass("Chat message strictly isolated to meeting-alpha (2 Alpha participants got it, 0 Beta participants)");
  } else {
    fail(`Chat isolation failed: alphaChatCount=${alphaChatCount}, betaChatCount=${betaChatCount}`);
  }

  // ── TEST 5: Cross-Room WebRTC Signaling Block ────────────────
  console.log("\n--> TEST 5: Cross-Room Signaling Attack / Bug Prevention");
  let guestBetaReceivedRogueOffer = false;
  guestBeta.on("webrtc-offer", () => {
    guestBetaReceivedRogueOffer = true;
  });

  // Guest Alpha (in meeting-alpha) maliciously or buggily attempts to send offer to Guest Beta (in meeting-beta)
  guestAlpha.emit("webrtc-offer", {
    targetSocketId: guestBeta.id,
    offer: { type: "offer", sdp: "dummy-sdp-test" },
    callerInfo: { userId: "user_guest_alpha", userName: "Guest Alpha" },
  });

  await new Promise((r) => setTimeout(r, 300));

  if (!guestBetaReceivedRogueOffer) {
    pass("Cross-room WebRTC offer was successfully BLOCKED by server! (target in another room never received it)");
  } else {
    fail("Cross-room WebRTC offer LEAKED across meeting boundary!");
  }

  // ── TEST 6: Room Switching Without Disconnecting ────────────
  console.log("\n--> TEST 6: Room Switching and socket.leave Isolation");
  let hostAlphaNotifiedOfGuestDeparture = false;
  hostAlpha.on("user-disconnected", ({ socketId }) => {
    if (socketId === guestAlpha.id) {
      hostAlphaNotifiedOfGuestDeparture = true;
    }
  });

  // Guest Alpha now switches to meeting-gamma as Host
  guestAlpha.emit("request-join", {
    roomId: "meeting-gamma",
    userId: "user_guest_alpha",
    userName: "Guest Alpha",
    isHost: true,
  });

  await new Promise((r) => setTimeout(r, 100));

  guestAlpha.emit("join-room", {
    roomId: "meeting-gamma",
    userId: "user_guest_alpha",
    userName: "Guest Alpha",
    isHost: true,
  });

  await new Promise((r) => setTimeout(r, 400));

  if (hostAlphaNotifiedOfGuestDeparture) {
    pass("When Guest Alpha switched rooms, meeting-alpha was notified of departure");
  } else {
    fail("Old room was not notified when user switched meetings");
  }

  // Verify Guest Alpha in meeting-gamma NO LONGER receives meeting-alpha chat
  let guestAlphaReceivedOldRoomChat = false;
  guestAlpha.on("new-chat-message", (msg) => {
    if (msg.meetingId === "meeting-alpha") {
      guestAlphaReceivedOldRoomChat = true;
    }
  });

  hostAlpha.emit("send-chat-message", {
    roomId: "meeting-alpha",
    message: {
      userId: "user_host_alpha",
      senderName: "Host Alpha",
      message: "Chat after guest left",
    },
  });

  await new Promise((r) => setTimeout(r, 300));

  if (!guestAlphaReceivedOldRoomChat) {
    pass("Socket.leave confirmed: user who switched rooms receives ZERO events from the old meeting");
  } else {
    fail("User still received broadcasts from old meeting after switching!");
  }

  // Teardown
  hostAlpha.disconnect();
  guestAlpha.disconnect();
  hostBeta.disconnect();
  guestBeta.disconnect();
  await new Promise((r) => setTimeout(r, 200));
  server.close();

  console.log("\n=================================================================");
  if (testPassed) {
    console.log("  ALL MULTI-ROOM ISOLATION & SCALABILITY TESTS PASSED! (100% OK)");
  } else {
    console.log("  TEST SUITE FINISHED WITH ERRORS");
  }
  console.log("=================================================================\n");

  process.exit(testPassed ? 0 : 1);
}

runTest().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
