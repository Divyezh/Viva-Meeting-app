import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://viva-meeting-app.onrender.com";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
  timeout: 30000,
});

socket.on("connect", () => {
  console.log(`[Socket Connected] Successfully connected to signaling server (${socket.id})`);
});

socket.on("disconnect", (reason) => {
  console.warn(`[Socket Disconnected] Disconnected from signaling server. Reason: "${reason}"`);
});

socket.on("connect_error", (err) => {
  console.error(`[Socket Connect Error] Failed to connect to signaling server:`, err.message);
});

export default socket;
