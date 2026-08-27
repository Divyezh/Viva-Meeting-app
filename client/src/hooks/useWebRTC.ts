import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../config/socket";
import type { PeerStream, ChatMessage } from "../types";

interface UseWebRTCProps {
  roomId: string;
  currentUser: {
    userId: string;
    userName: string;
    avatarUrl?: string;
  };
  initialMuted?: boolean;
  initialCameraOff?: boolean;
  enabled?: boolean;
  isHost?: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const useWebRTC = ({
  roomId,
  currentUser,
  initialMuted = false,
  initialCameraOff = false,
  enabled = true,
  isHost = false,
}: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<PeerStream[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isCameraOff, setIsCameraOff] = useState(initialCameraOff);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // References for WebRTC connections and media tracks
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Helper to add or update peer stream
  const setPeerStream = useCallback(
    (
      socketId: string,
      stream: MediaStream | null,
      info: {
        userId: string;
        userName: string;
        avatarUrl?: string;
        isMuted?: boolean;
        isCameraOff?: boolean;
      }
    ) => {
      setPeers((prev) => {
        const index = prev.findIndex((p) => p.peerId === socketId);
        const updatedPeer: PeerStream = {
          peerId: socketId,
          stream: stream || (index !== -1 ? prev[index].stream : null),
          userId: info.userId,
          userName: info.userName,
          avatarUrl: info.avatarUrl || "",
          isMuted: info.isMuted ?? (index !== -1 ? prev[index].isMuted : false),
          isCameraOff: info.isCameraOff ?? (index !== -1 ? prev[index].isCameraOff : false),
          isSpeaking: index !== -1 ? prev[index].isSpeaking : false,
        };

        if (index !== -1) {
          const newPeers = [...prev];
          newPeers[index] = updatedPeer;
          return newPeers;
        } else {
          return [...prev, updatedPeer];
        }
      });
    },
    []
  );

  // ─── 1. Initialize Local Media Stream ───────────────────────
  useEffect(() => {
    if (!enabled) return;

    let activeStream: MediaStream | null = null;

    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: true,
        });

        activeStream = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);

        // Apply initial mute/camera states
        stream.getAudioTracks().forEach((t) => (t.enabled = !initialMuted));
        stream.getVideoTracks().forEach((t) => (t.enabled = !initialCameraOff));

        // Connect socket after local stream is acquired
        if (!socket.connected) {
          socket.connect();
        }

        socket.emit("join-room", {
          roomId,
          userId: currentUser.userId,
          userName: currentUser.userName,
          avatarUrl: currentUser.avatarUrl || "",
          isMuted: initialMuted,
          isCameraOff: initialCameraOff,
          isHost,
        });

        // Initialize Web Audio level detection for local user
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            let lastSpeakingUpdate = 0;
            let currentSpeakingState = false;

            const checkAudio = () => {
              if (!localStreamRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              const now = Date.now();
              const isSpeakingNow = average > 18;

              // Only update if state changes and at least 200ms has elapsed to avoid flutter
              if (isSpeakingNow !== currentSpeakingState && now - lastSpeakingUpdate > 200) {
                currentSpeakingState = isSpeakingNow;
                lastSpeakingUpdate = now;
                setIsLocalSpeaking(isSpeakingNow);
              }

              requestAnimationFrame(checkAudio);
            };
            checkAudio();
          }
        } catch (audioErr) {
          console.warn("AudioContext setup notice:", audioErr);
        }
      } catch (err) {
        console.warn("Camera/Microphone access error or denied:", err);
        setIsCameraOff(true);

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit("join-room", {
          roomId,
          userId: currentUser.userId,
          userName: currentUser.userName,
          avatarUrl: currentUser.avatarUrl || "",
          isMuted: true,
          isCameraOff: true,
        });
      }
    };

    startLocalMedia();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [roomId, currentUser.userId, currentUser.userName, currentUser.avatarUrl, enabled, isHost]);

  // ─── 2. WebRTC Peer Connection Factory ──────────────────────
  const createPeerConnection = useCallback(
    (targetSocketId: string, remoteInfo: { userId: string; userName: string; avatarUrl?: string; isMuted?: boolean; isCameraOff?: boolean }) => {
      if (peerConnections.current.has(targetSocketId)) {
        return peerConnections.current.get(targetSocketId)!;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current.set(targetSocketId, pc);

      // Add local stream tracks to this peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle receiving remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setPeerStream(targetSocketId, event.streams[0], remoteInfo);
        }
      };

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
          peerConnections.current.delete(targetSocketId);
          setPeers((prev) => prev.filter((p) => p.peerId !== targetSocketId));
        }
      };

      return pc;
    },
    [setPeerStream]
  );

  // ─── 3. Socket Signaling Listeners ──────────────────────────
  useEffect(() => {
    // A. Received existing peers in the room -> initiate WebRTC Offer to each
    const handleExistingUsers = async (users: any[]) => {
      for (const user of users) {
        const pc = createPeerConnection(user.socketId, user);
        setPeerStream(user.socketId, null, user);

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit("webrtc-offer", {
            targetSocketId: user.socketId,
            offer,
            callerInfo: {
              userId: currentUser.userId,
              userName: currentUser.userName,
              avatarUrl: currentUser.avatarUrl || "",
              isMuted,
              isCameraOff,
            },
          });
        } catch (err) {
          console.error("Error creating WebRTC offer:", err);
        }
      }
    };

    // B. A new user joined the room
    const handleUserJoined = (newUser: any) => {
      setPeerStream(newUser.socketId, null, newUser);
    };

    // C. Incoming WebRTC Offer -> send Answer back
    const handleWebRTCOffer = async ({
      callerSocketId,
      offer,
      callerInfo,
    }: {
      callerSocketId: string;
      offer: RTCSessionDescriptionInit;
      callerInfo: any;
    }) => {
      const pc = createPeerConnection(callerSocketId, callerInfo);
      setPeerStream(callerSocketId, null, callerInfo);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          targetSocketId: callerSocketId,
          answer,
        });
      } catch (err) {
        console.error("Error handling WebRTC offer:", err);
      }
    };

    // D. Incoming WebRTC Answer
    const handleWebRTCAnswer = async ({
      responderSocketId,
      answer,
    }: {
      responderSocketId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const pc = peerConnections.current.get(responderSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("Error setting remote description from answer:", err);
        }
      }
    };

    // E. Incoming ICE Candidate
    const handleICECandidate = async ({
      senderSocketId,
      candidate,
    }: {
      senderSocketId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.current.get(senderSocketId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    };

    // F. Remote Peer Media State Change (Mute / Camera)
    const handleUserMediaToggled = ({
      socketId,
      isMuted: peerMuted,
      isCameraOff: peerCameraOff,
    }: {
      socketId: string;
      userId: string;
      isMuted: boolean;
      isCameraOff: boolean;
    }) => {
      setPeers((prev) =>
        prev.map((p) => {
          if (p.peerId === socketId) {
            return {
              ...p,
              isMuted: peerMuted !== undefined ? peerMuted : p.isMuted,
              isCameraOff: peerCameraOff !== undefined ? peerCameraOff : p.isCameraOff,
            };
          }
          return p;
        })
      );
    };

    // G. Remote Peer Disconnected
    const handleUserDisconnected = ({ socketId }: { socketId: string }) => {
      const pc = peerConnections.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(socketId);
      }
      setPeers((prev) => prev.filter((p) => p.peerId !== socketId));
    };

    // H. Real-Time Chat Message Broadcast
    const handleNewChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already present
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("existing-users", handleExistingUsers);
    socket.on("user-joined", handleUserJoined);
    socket.on("webrtc-offer", handleWebRTCOffer);
    socket.on("webrtc-answer", handleWebRTCAnswer);
    socket.on("ice-candidate", handleICECandidate);
    socket.on("user-media-toggled", handleUserMediaToggled);
    socket.on("user-disconnected", handleUserDisconnected);
    socket.on("new-chat-message", handleNewChatMessage);

    return () => {
      socket.off("existing-users", handleExistingUsers);
      socket.off("user-joined", handleUserJoined);
      socket.off("webrtc-offer", handleWebRTCOffer);
      socket.off("webrtc-answer", handleWebRTCAnswer);
      socket.off("ice-candidate", handleICECandidate);
      socket.off("user-media-toggled", handleUserMediaToggled);
      socket.off("user-disconnected", handleUserDisconnected);
      socket.off("new-chat-message", handleNewChatMessage);
    };
  }, [createPeerConnection, currentUser, isMuted, isCameraOff, setPeerStream]);

  // ─── 4. User Actions: Toggle Mute ───────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !nextState;
        });
      }
      socket.emit("toggle-media", {
        roomId,
        isMuted: nextState,
        isCameraOff,
      });
      return nextState;
    });
  }, [roomId, isCameraOff]);

  // ─── 5. User Actions: Toggle Camera ─────────────────────────
  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const nextState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !nextState;
        });
      }
      socket.emit("toggle-media", {
        roomId,
        isMuted,
        isCameraOff: nextState,
      });
      return nextState;
    });
  }, [roomId, isMuted]);

  // ─── 6. User Actions: Screen Share ──────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop Screen Share -> Revert to camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }

      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          peerConnections.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      }

      setIsScreenSharing(false);
    } else {
      // Start Screen Share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace video tracks on all active peer connections
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen sharing canceled or error:", err);
      }
    }
  }, [isScreenSharing]);

  // ─── 7. User Actions: Send Chat Message ─────────────────────
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        meetingId: roomId,
        userId: currentUser.userId,
        senderName: currentUser.userName,
        senderAvatar: currentUser.avatarUrl || "",
        message: text.trim(),
        createdAt: new Date().toISOString(),
      };

      socket.emit("send-chat-message", {
        roomId,
        message: newMsg,
      });
    },
    [roomId, currentUser]
  );

  // ─── 8. User Actions: Leave Meeting ─────────────────────────
  const leaveMeeting = useCallback(() => {
    socket.emit("leave-room");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
    }

    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    setPeers([]);
  }, []);

  return {
    localStream,
    peers,
    messages,
    isMuted,
    isCameraOff,
    isScreenSharing,
    isLocalSpeaking,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    sendMessage,
    leaveMeeting,
  };
};

export default useWebRTC;
