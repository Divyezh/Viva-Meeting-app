import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../config/socket";
import type { PeerStream, ChatMessage } from "../types";
import soundEffects from "../utils/soundEffects";

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

/**
 * Optimizes WebRTC Session Description Protocol (SDP) for Opus audio codec.
 * Forces 128kbps stereo high-fidelity voice transmission with In-Band FEC
 * (Forward Error Correction) to ensure crystal-clear mic voice with 0 packet loss distortion.
 */
export const optimizeSdpForVoice = (sdp?: string): string => {
  if (!sdp) return "";
  return sdp.replace(/(a=fmtp:\d+\s+)([^\r\n]+)/g, (match, prefix, params) => {
    let updated = params;
    if (!updated.includes("stereo=")) updated += ";stereo=1;sprop-stereo=1";
    if (!updated.includes("maxaveragebitrate=")) updated += ";maxaveragebitrate=128000";
    if (!updated.includes("cbr=")) updated += ";cbr=1";
    if (!updated.includes("useinbandfec=")) updated += ";useinbandfec=1";
    return `${prefix}${updated}`;
  });
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
  const remoteAnalysers = useRef<Map<string, { ctx: AudioContext; animId: number }>>(new Map());

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

      // Attach audio speech level analysis to remote stream
      if (stream && stream.getAudioTracks().length > 0) {
        setupRemoteSpeakingDetection(socketId, stream);
      }
    },
    []
  );

  // ─── Remote Speaking Detection Engine ────────────────────────
  const setupRemoteSpeakingDetection = (socketId: string, stream: MediaStream) => {
    // Clean existing if re-attaching
    const existing = remoteAnalysers.current.get(socketId);
    if (existing) {
      cancelAnimationFrame(existing.animId);
      existing.ctx.close().catch(() => {});
      remoteAnalysers.current.delete(socketId);
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let animId: number;
      let isSpeakingState = false;
      let lastUpdate = 0;

      const checkRemoteAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const speakingNow = avg > 16;
        const now = Date.now();

        if (speakingNow !== isSpeakingState && now - lastUpdate > 200) {
          isSpeakingState = speakingNow;
          lastUpdate = now;
          setPeers((prev) =>
            prev.map((p) => (p.peerId === socketId ? { ...p, isSpeaking: speakingNow } : p))
          );
        }

        animId = requestAnimationFrame(checkRemoteAudio);
      };

      animId = requestAnimationFrame(checkRemoteAudio);
      remoteAnalysers.current.set(socketId, { ctx, animId });
    } catch (err) {
      console.debug("Remote audio analysis notice:", err);
    }
  };

  // ─── 1. Initialize Local Media Stream (Studio Mic Constraints) ──
  useEffect(() => {
    if (!enabled) return;

    let activeStream: MediaStream | null = null;

    const startLocalMedia = async () => {
      try {
        let stream: MediaStream;

        try {
          // Attempt Studio Crystal-Clear Microphone Settings (48kHz, Stereo, Noise & Echo cancellation)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
              channelCount: 2,
            },
          });
        } catch (studioConstraintErr) {
          console.warn("Studio constraints fallback to default mic:", studioConstraintErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: true,
          });
        }

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

        // Howler sound cue on entering room
        soundEffects.playJoin();

        // Initialize Web Audio level detection for local user speaking border
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
          isHost,
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
      remoteAnalysers.current.forEach((item) => {
        cancelAnimationFrame(item.animId);
        item.ctx.close().catch(() => {});
      });
      remoteAnalysers.current.clear();
    };
  }, [roomId, currentUser.userId, currentUser.userName, currentUser.avatarUrl, enabled, isHost, initialMuted, initialCameraOff]);

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
          const analyser = remoteAnalysers.current.get(targetSocketId);
          if (analyser) {
            cancelAnimationFrame(analyser.animId);
            analyser.ctx.close().catch(() => {});
            remoteAnalysers.current.delete(targetSocketId);
          }
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
          // Apply Opus 128kbps crystal-clear voice SDP optimization
          const optimizedSdp = optimizeSdpForVoice(offer.sdp);
          const finalOffer = new RTCSessionDescription({ type: offer.type, sdp: optimizedSdp });
          await pc.setLocalDescription(finalOffer);

          socket.emit("webrtc-offer", {
            targetSocketId: user.socketId,
            offer: finalOffer,
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
      // Play pleasant Howler join chime
      soundEffects.playJoin();
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
        // Apply Opus 128kbps crystal-clear voice SDP optimization
        const optimizedSdp = optimizeSdpForVoice(answer.sdp);
        const finalAnswer = new RTCSessionDescription({ type: answer.type, sdp: optimizedSdp });
        await pc.setLocalDescription(finalAnswer);

        socket.emit("webrtc-answer", {
          targetSocketId: callerSocketId,
          answer: finalAnswer,
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
      const analyser = remoteAnalysers.current.get(socketId);
      if (analyser) {
        cancelAnimationFrame(analyser.animId);
        analyser.ctx.close().catch(() => {});
        remoteAnalysers.current.delete(socketId);
      }

      const pc = peerConnections.current.get(socketId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(socketId);
      }
      setPeers((prev) => prev.filter((p) => p.peerId !== socketId));

      // Play pleasant Howler leave chime
      soundEffects.playLeave();
    };

    // H. Real-Time Chat Message Broadcast
    const handleNewChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Play chat notification ping if message is from someone else
      if (msg.userId !== currentUser.userId) {
        soundEffects.playChatMessage();
      }
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

      // Play audio cue for mic state change via Howler.js
      if (nextState) {
        soundEffects.playMicOff();
      } else {
        soundEffects.playMicOn();
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
        const camVideoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && camVideoTrack) {
            sender.replaceTrack(camVideoTrack);
          }
        });
      }
      setIsScreenSharing(false);
    } else {
      // Start Screen Share
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const displayVideoTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = displayVideoTrack;

        displayVideoTrack.onended = () => {
          toggleScreenShare();
        };

        peerConnections.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(displayVideoTrack);
          }
        });

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled or failed:", err);
      }
    }
  }, [isScreenSharing]);

  // ─── 7. User Actions: Send Chat Message ─────────────────────
  const sendMessage = useCallback(
    (text: string) => {
      if (!text || !text.trim()) return;

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

    remoteAnalysers.current.forEach((item) => {
      cancelAnimationFrame(item.animId);
      item.ctx.close().catch(() => {});
    });
    remoteAnalysers.current.clear();
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
