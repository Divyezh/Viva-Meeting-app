import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://viva-meeting-app.onrender.com";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
  timeout: 10000,
});

socket.on("connect", () => {
  const ts = new Date().toISOString();
  console.log(`[Join Latency Trace][${ts}] [Socket Connected] (${socket.id}) via transport: ${socket.io.engine?.transport?.name}`);
});

socket.on("disconnect", (reason) => {
  const ts = new Date().toISOString();
  console.warn(`[Join Latency Trace][${ts}] [Socket Disconnected] Reason: "${reason}"`);
});

socket.on("connect_error", (err) => {
  const ts = new Date().toISOString();
  console.error(`[Join Latency Trace][${ts}] [Socket Connect Error] Failed to connect:`, err.message);
});

export default socket;
