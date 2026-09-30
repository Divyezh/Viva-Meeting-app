import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  Clock,
  Check,
  X,
  UserCheck,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  User,
  ArrowRight,
  Shield,
  MonitorUp,
} from "lucide-react";
import VideoGrid from "../components/meeting/video_grid";
import MeetingHeader from "../components/meeting/meeting_header";
import ControlBar from "../components/meeting/control_bar";
import TranscriptPanel, { type ParticipantItem } from "../components/meeting/transcript_panel";
import FloatingReactions, { type EmojiReaction } from "../components/meeting/floating_reactions";
import CaptionsOverlay from "../components/meeting/captions_overlay";
import CaptionsModal from "../components/meeting/captions_modal";
import { useCaptions } from "../hooks/useCaptions";
import { useWebRTC } from "../hooks/useWebRTC";
import socket from "../config/socket";
import soundEffects from "../utils/soundEffects";
import { useUser } from "@clerk/clerk-react";
import usePageSEO from "../hooks/usePageSEO";
import BrandLogo from "../components/brand_logo";

interface JoinRequest {
  requesterSocketId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  roomId: string;
  createdAt: number;
}

const MeetingRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const cleanRoomId = roomId || "default-room";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();

  usePageSEO({
    title: `Live Meeting (${cleanRoomId}) | Viva Meeting`,
    noIndex: true,
  });

  // Bulletproof host detection: query param (?host=true) takes precedence, fallback to isolated sessionStorage
  const isHost = useMemo(() => {
    const fromQuery = searchParams.get("host") === "true";
    const fromStorage =
      typeof window !== "undefined"
        ? sessionStorage.getItem(`is_host_${cleanRoomId}`) === "true"
        : false;
    if (fromQuery) {
      sessionStorage.setItem(`is_host_${cleanRoomId}`, "true");
      return true;
    }
    return fromStorage;
  }, [searchParams, cleanRoomId]);

  // Pre-join lobby state: guests who haven't confirmed their name or media preferences
  const [inLobby, setInLobby] = useState(() => {
    if (isHost) return false;
    const confirmed =
      typeof window !== "undefined" &&
      sessionStorage.getItem(`prejoin_confirmed_${cleanRoomId}`) === "true";
    return !confirmed;
  });

  const [lobbyName, setLobbyName] = useState(() => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName) return user.firstName;
    const saved = typeof window !== "undefined" ? localStorage.getItem("meeting_user_name") : null;
    return saved && saved.trim() ? saved.trim() : "";
  });

  const [lobbyMicMuted, setLobbyMicMuted] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("prejoin_muted") === "true" : false;
  });
  const [lobbyCameraOff, setLobbyCameraOff] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("prejoin_camera_off") === "true" : false;
  });
  const [lobbyStream, setLobbyStream] = useState<MediaStream | null>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);

  // Sync lobby name if Clerk user logs in or profile finishes loading
  useEffect(() => {
    if (user && !lobbyName) {
      setLobbyName(user.fullName || user.firstName || "");
    }
  }, [user, lobbyName]);

  // Handle local camera preview in Lobby
  useEffect(() => {
    if (!inLobby) return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    const startLobbyPreview = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLobbyStream(stream);
        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = stream;
        }
        stream.getAudioTracks().forEach((t) => (t.enabled = !lobbyMicMuted));
        stream.getVideoTracks().forEach((t) => (t.enabled = !lobbyCameraOff));
      } catch (err) {
        console.warn("Lobby camera error:", err);
        setLobbyCameraOff(true);
      }
    };

    startLobbyPreview();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [inLobby]);

  // Load user name from Clerk, state, localStorage or default
  const currentUserName = useMemo(() => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName) return user.firstName;
    if (lobbyName.trim()) return lobbyName.trim();
    const saved = localStorage.getItem("meeting_user_name");
    return saved && saved.trim() ? saved.trim() : "Guest Participant";
  }, [user, lobbyName]);

  const [persistedUserId] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("meeting_user_id") : null;
    if (saved) return saved;
    const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("meeting_user_id", newId);
    }
    return newId;
  });
  const currentUserId = user?.id || persistedUserId;

  const currentUserAvatar = user?.imageUrl || "";

  // ─── Admission State (Waiting Room & Knock Flow) ─────────────
  const [admissionStatus, setAdmissionStatus] = useState<
    "admitted" | "waiting" | "connecting" | "denied" | "closed"
  >(isHost ? "admitted" : "waiting");
  const [closedReason, setClosedReason] = useState("Host closed the meeting");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // ─── Sidebar / Drawer State ─────────────────────────────────
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<
    "transcript" | "chat" | "notes" | "participants"
  >("chat");

  // Pre-join audio and camera preferences
  const initialMuted = useMemo(() => {
    return lobbyMicMuted || localStorage.getItem("prejoin_muted") === "true";
  }, [lobbyMicMuted]);
  const initialCameraOff = useMemo(() => {
    return lobbyCameraOff || localStorage.getItem("prejoin_camera_off") === "true";
  }, [lobbyCameraOff]);

  // ─── Real-World WebRTC Peer Engine ──────────────────────────
  const {
    localStream,
    screenStream,
    peers,
    messages,
    isMuted,
    isCameraOff,
    isScreenSharing,
    canShareScreen,
    allScreenShareAllowed,
    screenShareRequests,
    isLocalSpeaking,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    stopScreenShare,
    requestScreenSharePermission,
    respondScreenShareRequest,
    setParticipantScreenSharePermission,
    toggleAllScreenShare,
    stopParticipantScreenShare,
    sendMessage,
    leaveMeeting,
  } = useWebRTC({
    roomId: cleanRoomId,
    currentUser: {
      userId: currentUserId,
      userName: currentUserName,
      avatarUrl: currentUserAvatar,
    },
    initialMuted,
    initialCameraOff,
    enabled: !inLobby && (admissionStatus === "admitted" || admissionStatus === "connecting"),
    isHost,
  });

  // ─── Smooth entering transition after host admits guest ───
  useEffect(() => {
    if (admissionStatus !== "connecting") return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 1400) {
        setAdmissionStatus("admitted");
        toast.success("Joined meeting room!", {
          iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
        });
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [admissionStatus]);

  // ─── Reactions State & Socket Synchronization ──────────────
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);

  useEffect(() => {
    const handleNewReaction = (reaction: EmojiReaction) => {
      setReactions((prev) => [...prev, reaction]);
      soundEffects.playReaction();
    };

    socket.on("new-reaction", handleNewReaction);
    return () => {
      socket.off("new-reaction", handleNewReaction);
    };
  }, []);

  const handleSendReaction = useCallback((emoji: string) => {
    const newReaction: EmojiReaction = {
      id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      emoji,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      userId: currentUserId,
      timestamp: Date.now(),
      leftPercent: 15 + Math.random() * 70, // Spread across screen 15% to 85%
    };

    // Show immediately locally
    setReactions((prev) => [...prev, newReaction]);
    soundEffects.playReaction();

    // Broadcast live to all meeting participants
    socket.emit("send-reaction", {
      roomId: cleanRoomId,
      reaction: newReaction,
    });
  }, [cleanRoomId, currentUserName, currentUserAvatar, currentUserId]);

  const handleRemoveReaction = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ─── Live Captions & Hindi to English Translation Hook ─────
  const [isCaptionsModalOpen, setIsCaptionsModalOpen] = useState(false);
  const {
    isCaptionsEnabled,
    spokenLang,
    captionLang,
    activeCaption,
    toggleCaptions,
    setSpokenLang,
    setCaptionLang,
  } = useCaptions({
    roomId: cleanRoomId,
    currentUser: {
      userId: currentUserId,
      userName: currentUserName,
      avatarUrl: currentUserAvatar,
    },
    isMuted,
    enabled: !inLobby && admissionStatus === "admitted",
  });

  const handleReturnHome = useCallback(() => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/join");
    }
  }, [user, navigate]);

  const handleLobbyJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = lobbyName.trim() || (user?.fullName || user?.firstName || "Guest");
    localStorage.setItem("meeting_user_name", finalName);
    localStorage.setItem("prejoin_muted", lobbyMicMuted ? "true" : "false");
    localStorage.setItem("prejoin_camera_off", lobbyCameraOff ? "true" : "false");
    sessionStorage.setItem(`prejoin_confirmed_${cleanRoomId}`, "true");

    if (lobbyStream) {
      lobbyStream.getTracks().forEach((t) => t.stop());
      setLobbyStream(null);
    }
    setInLobby(false);
  };

  // Host Action: Admit Guest
  const handleAdmitUser = useCallback(
    (requesterSocketId: string, guestName: string) => {
      socket.emit("approve-join-request", {
        requesterSocketId,
        approved: true,
        roomId: cleanRoomId,
      });
      setJoinRequests((prev) => prev.filter((r) => r.requesterSocketId !== requesterSocketId));
      toast.success(`Admitted ${guestName} to the meeting`);
    },
    [cleanRoomId]
  );

  // Host Action: Deny Guest
  const handleDenyUser = useCallback(
    (requesterSocketId: string, guestName: string) => {
      socket.emit("approve-join-request", {
        requesterSocketId,
        approved: false,
        roomId: cleanRoomId,
      });
      setJoinRequests((prev) => prev.filter((r) => r.requesterSocketId !== requesterSocketId));
      toast(`${guestName}'s request was declined`);
    },
    [cleanRoomId]
  );

  // ─── 60-Second Auto-Expire & Live Countdown Tick for Join Requests ─
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    if (!isHost || joinRequests.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      // Remove any requests that reach 60 seconds (ample time for host to decide)
      setJoinRequests((prev) => {
        const remaining = prev.filter((r) => now - r.createdAt < 60000);
        return remaining.length !== prev.length ? remaining : prev;
      });
      // Re-render each second to update the smooth countdown bar and seconds display
      setTimerTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, joinRequests.length]);

  // ─── Socket Signaling for Admission & Knock Flow ────────────
  useEffect(() => {
    if (inLobby) return; // Wait until guest enters display name and clicks Join

    if (!socket.connected) {
      socket.connect();
    }

    // Listen for host closing the meeting (applies only to guests; host controls the meeting lifecycle)
    const handleMeetingEnded = (data?: { reason?: string }) => {
      if (isHost) return;
      leaveMeeting();
      setAdmissionStatus("closed");
      if (data?.reason) {
        setClosedReason(data.reason);
      }
      sessionStorage.removeItem(`is_host_${cleanRoomId}`);
      localStorage.removeItem(`is_host_${cleanRoomId}`);
    };

    socket.on("meeting-ended-by-host", handleMeetingEnded);

    if (isHost) {
      // Host listens for admission requests from incoming guests
      const handleJoinRequestReceived = (request: {
        requesterSocketId: string;
        userId: string;
        userName: string;
        avatarUrl?: string;
        roomId: string;
      }) => {
        soundEffects.playJoin(); // Play clear audio cue to alert the host!
        const fullRequest: JoinRequest = {
          ...request,
          createdAt: Date.now(),
        };

        setJoinRequests((prev) => {
          // Replace or deduplicate requests from the same user/socket
          const filtered = prev.filter(
            (r) =>
              r.requesterSocketId !== request.requesterSocketId &&
              (!request.userId || r.userId !== request.userId)
          );
          return [...filtered, fullRequest];
        });
      };

      // Listen for guest cancelling or disconnecting while waiting
      const handleJoinRequestCancelled = ({
        requesterSocketId,
        userId,
      }: {
        requesterSocketId: string;
        userId: string;
      }) => {
        setJoinRequests((prev) =>
          prev.filter(
            (r) =>
              r.requesterSocketId !== requesterSocketId &&
              (!userId || r.userId !== userId)
          )
        );
      };

      socket.on("join-request-received", handleJoinRequestReceived);
      socket.on("join-request-cancelled", handleJoinRequestCancelled);
      return () => {
        socket.off("meeting-ended-by-host", handleMeetingEnded);
        socket.off("join-request-received", handleJoinRequestReceived);
        socket.off("join-request-cancelled", handleJoinRequestCancelled);
      };
    } else {
      // Guest emits request to join
      const sendJoinRequest = () => {
        socket.emit("request-join", {
          roomId: cleanRoomId,
          userId: currentUserId,
          userName: currentUserName,
          avatarUrl: currentUserAvatar,
          isHost: false,
        });
      };

      sendJoinRequest();

      // If socket reconnects while waiting, automatically re-request admission
      const handleSocketReconnect = () => {
        if (admissionStatus === "waiting") {
          sendJoinRequest();
        }
      };
      socket.on("connect", handleSocketReconnect);

      const handleJoinResponse = ({
        approved,
        meetingClosed,
        waitingForHost,
        reason,
      }: {
        approved: boolean;
        meetingClosed?: boolean;
        waitingForHost?: boolean;
        reason?: string;
      }) => {
        if (meetingClosed) {
          setAdmissionStatus("closed");
          setClosedReason(reason || "Host closed the meeting");
          leaveMeeting();
          return;
        }

        if (waitingForHost) {
          // Keep guest in waiting room
          setAdmissionStatus("waiting");
          return;
        }

        if (approved) {
          setAdmissionStatus("connecting");
        } else {
          setAdmissionStatus("denied");
          toast.error(reason || "The host declined your request to join.");
        }
      };

      socket.on("join-response", handleJoinResponse);
      return () => {
        socket.off("meeting-ended-by-host", handleMeetingEnded);
        socket.off("join-response", handleJoinResponse);
        socket.off("connect", handleSocketReconnect);
      };
    }
  }, [
    cleanRoomId,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    handleAdmitUser,
    handleDenyUser,
    isHost,
    leaveMeeting,
    admissionStatus,
    inLobby,
  ]);

  // Dynamic participants list formed by local user + all connected peers (strictly deduplicated)
  const participantsList: ParticipantItem[] = useMemo(() => {
    const list: ParticipantItem[] = [
      {
        id: currentUserId,
        name: currentUserName,
        avatar: currentUserAvatar,
        role: isHost ? "host" : "participant",
        isMuted,
        isCameraOff,
        isLocal: true,
        isScreenSharing,
        canShareScreen: isHost || canShareScreen,
        socketId: socket.id,
      },
    ];

    const seenIds = new Set<string>();
    seenIds.add(currentUserId);

    peers.forEach((peer) => {
      const pUserId = peer.userId || peer.peerId;
      if (!pUserId || seenIds.has(pUserId)) return;
      seenIds.add(pUserId);

      list.push({
        id: pUserId,
        name: peer.userName,
        avatar: peer.avatarUrl || "",
        role: "participant",
        isMuted: peer.isMuted,
        isCameraOff: peer.isCameraOff,
        isScreenSharing: peer.isScreenSharing,
        canShareScreen: peer.canShareScreen,
        socketId: peer.peerId,
      });
    });

    return list;
  }, [
    currentUserId,
    currentUserName,
    currentUserAvatar,
    isHost,
    isMuted,
    isCameraOff,
    isScreenSharing,
    canShareScreen,
    peers,
  ]);

  // ─── Toggle Handlers for Sidebar Tabs ───────────────────────
  const handleToggleChat = useCallback(() => {
    if (isPanelOpen && activePanelTab === "chat") {
      setIsPanelOpen(false);
    } else {
      setIsPanelOpen(true);
      setActivePanelTab("chat");
    }
  }, [isPanelOpen, activePanelTab]);

  const handleToggleParticipants = useCallback(() => {
    if (isPanelOpen && activePanelTab === "participants") {
      setIsPanelOpen(false);
    } else {
      setIsPanelOpen(true);
      setActivePanelTab("participants");
    }
  }, [isPanelOpen, activePanelTab]);

  const handleToggleTranscript = useCallback(() => {
    if (isPanelOpen && activePanelTab === "transcript") {
      setIsPanelOpen(false);
    } else {
      setIsPanelOpen(true);
      setActivePanelTab("transcript");
    }
  }, [isPanelOpen, activePanelTab]);

  const handleLeave = useCallback(() => {
    if (isHost) {
      socket.emit("host-close-meeting", { roomId: cleanRoomId });
      sessionStorage.removeItem(`is_host_${cleanRoomId}`);
      localStorage.removeItem(`is_host_${cleanRoomId}`);
    }
    leaveMeeting();
    handleReturnHome();
  }, [cleanRoomId, isHost, leaveMeeting, handleReturnHome]);

  // ─── 0. PRE-JOIN LOBBY VIEW (GUEST ENTERS NAME & PREVIEWS CAMERA) ─
  if (inLobby) {
    return (
      <div className="bg-app-gradient relative min-h-screen flex flex-col justify-between p-4 sm:p-6 overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
        <Toaster position="top-center" />

        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-137.5 w-137.5 rounded-full bg-linear-to-b from-emerald-200/40 via-lime-200/20 to-transparent blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Top Header */}
        <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between py-2">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 border border-emerald-200/80 shadow-md shadow-lime-900/10 backdrop-blur-md">
              <BrandLogo className="h-6 w-6" color="#4d7c0f" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Viva Meeting<span className="text-[#65a30d]">.</span>
            </span>
          </Link>

          {!user && (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-full bg-[#3f6212] hover:bg-[#365314] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all"
            >
              Sign In
            </Link>
          )}
        </header>

        {/* Lobby Content */}
        <main className="relative z-10 mx-auto w-full max-w-4xl my-auto py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Video Preview */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-emerald-900/30 shadow-2xl flex items-center justify-center">
                <video
                  ref={lobbyVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                    lobbyCameraOff ? "opacity-0" : "opacity-100"
                  }`}
                />

                {lobbyCameraOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-slate-900 to-slate-950">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 shadow-xl text-2xl font-bold">
                      {lobbyName.trim() ? lobbyName.trim().charAt(0).toUpperCase() : "G"}
                    </div>
                    <span className="mt-3 text-xs font-medium text-slate-400">Camera is off</span>
                  </div>
                )}

                <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white border border-white/10 flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${lobbyMicMuted ? "bg-red-400" : "bg-lime-400 animate-pulse"}`}
                    />
                    {lobbyName.trim() ? lobbyName.trim() : "Guest Preview"}
                  </span>
                </div>

                {/* Floating Media Toggles */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/15 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !lobbyMicMuted;
                      setLobbyMicMuted(next);
                      if (lobbyStream) {
                        lobbyStream.getAudioTracks().forEach((t) => (t.enabled = !next));
                      }
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 ${
                      lobbyMicMuted
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-white/20 hover:bg-white/30 text-white"
                    }`}
                    title={lobbyMicMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {lobbyMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !lobbyCameraOff;
                      setLobbyCameraOff(next);
                      if (lobbyStream) {
                        lobbyStream.getVideoTracks().forEach((t) => (t.enabled = !next));
                      }
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 ${
                      lobbyCameraOff
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-white/20 hover:bg-white/30 text-white"
                    }`}
                    title={lobbyCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    {lobbyCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
                <span>{lobbyMicMuted ? "Mic muted" : "Mic active"}</span>
                <span>•</span>
                <span>{lobbyCameraOff ? "Camera off" : "Camera active"}</span>
              </div>
            </div>

            {/* Right: Join Form */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl">
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-[#3f6212] mb-2.5">
                    <Sparkles className="h-3 w-3 text-[#65a30d]" />
                    <span>Meeting Room</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Ready to join?
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Room: <span className="font-mono font-bold text-slate-700">{cleanRoomId}</span>
                  </p>
                </div>

                <form onSubmit={handleLobbyJoin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4d7c0f]" />
                      <input
                        type="text"
                        required
                        value={lobbyName}
                        onChange={(e) => setLobbyName(e.target.value)}
                        placeholder="Enter your name to join"
                        className="w-full rounded-2xl bg-[#f8fcf8] border border-emerald-900/15 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#3f6212] focus:ring-3 focus:ring-[#3f6212]/10 shadow-2xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#3f6212] hover:bg-[#365314] py-3.5 text-sm font-bold text-white shadow-lg shadow-lime-900/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Ask to Join</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReturnHome}
                    className="w-full flex items-center justify-center gap-2 rounded-full border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[#4d7c0f]" />
                    <span>Encrypted Call</span>
                  </div>
                  {!user && (
                    <Link to="/login" className="font-semibold text-[#3f6212] hover:underline">
                      Sign In instead
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center py-2 text-[11px] text-slate-500">
          Viva Meeting &copy; {new Date().getFullYear()} · No sign-in required for guests
        </footer>
      </div>
    );
  }

  // ─── 1. WAITING ROOM VIEW (GUEST WAITING FOR HOST ADMISSION) ─
  if (admissionStatus === "waiting") {
    return (
      <div className="bg-app-gradient relative flex min-h-screen w-screen items-center justify-center p-4 overflow-hidden selection:bg-emerald-900 selection:text-emerald-100">
        <Toaster position="top-center" />

        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -top-40 left-1/3 h-137.5 w-137.5 rounded-full bg-emerald-500/15 blur-3xl opacity-80" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-137.5 w-137.5 rounded-full bg-[#84cc16]/15 blur-3xl opacity-80" />

        {/* Concentric orbital circles */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-96 w-96 rounded-full border border-emerald-300/20 opacity-50 animate-pulse" />
          <div className="absolute h-137.5 w-137.5 rounded-full border border-lime-300/15 opacity-40" />
        </div>

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#081307]/90 border border-emerald-800/50 p-8 text-center shadow-2xl backdrop-blur-2xl">
          {/* Pulsing Animated Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-[#3f6212] to-[#65a30d] shadow-xl shadow-lime-950/50 relative">
            <Clock className="h-9 w-9 text-white animate-spin [animation-duration:6s]" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#84cc16]"></span>
            </span>
          </div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            <Sparkles className="h-3 w-3 text-[#84cc16]" />
            <span>Waiting for Host Admission</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mt-3">Asking to join...</h2>
          <p className="mt-2 text-xs leading-relaxed text-emerald-200/70">
            Your request has been sent to the host. You'll automatically enter the meeting once they
            let you in.
          </p>

          {/* Meeting & User Summary Card */}
          <div className="mt-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 p-4 text-left">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5 mb-2.5">
              <span className="text-xs text-emerald-300/60 font-medium">Meeting Code</span>
              <span className="font-mono text-xs font-bold text-emerald-200">{cleanRoomId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-300/60 font-medium">Joining As</span>
              <span className="text-xs font-bold text-white truncate max-w-40">
                {currentUserName}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={handleReturnHome}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/60 py-3 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-900/60 hover:text-white active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cancel & Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 1.5. CONNECTING / ENTERING LOADING VIEW (AFTER HOST ADMISSION) ─
  if (admissionStatus === "connecting") {
    return (
      <div className="bg-app-gradient relative flex min-h-screen w-screen items-center justify-center p-4 overflow-hidden selection:bg-emerald-900 selection:text-emerald-100">
        <Toaster position="top-center" />

        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -top-40 left-1/3 h-137.5 w-137.5 rounded-full bg-emerald-500/15 blur-3xl opacity-80" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-137.5 w-137.5 rounded-full bg-[#84cc16]/15 blur-3xl opacity-80" />

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#081307]/92 border border-emerald-800/50 p-8 text-center shadow-2xl backdrop-blur-2xl">
          {/* Animated Spinner with Brand Logo */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-3 border-emerald-800/40 border-t-lime-400 animate-spin" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-700/50 text-lime-400 shadow-lg">
              <BrandLogo className="h-8 w-8" color="#a3e635" />
            </div>
          </div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/50 px-3 py-1 text-[11px] font-semibold text-lime-300">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-ping" />
            <span>Host Admitted You</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mt-3">
            Entering meeting...
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-emerald-200/70">
            Connecting audio, video, and syncing room state. You'll be in the meeting in a moment.
          </p>

          {/* Smooth animated progress bar */}
          <div className="mt-6 w-full rounded-full bg-emerald-950/60 p-0.5 border border-emerald-800/40 overflow-hidden">
            <div className="h-1.5 w-full rounded-full bg-linear-to-r from-emerald-500 via-lime-400 to-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. DENIED ADMISSION VIEW ────────────────────────────────
  if (admissionStatus === "denied") {
    return (
      <div className="bg-app-gradient relative flex min-h-screen w-screen items-center justify-center p-4 overflow-hidden selection:bg-emerald-900 selection:text-emerald-100">
        <Toaster position="top-center" />

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#081307]/90 border border-red-900/40 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-950/50 border border-red-800/60 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold text-white">Unable to Join</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            The host declined your request to join this meeting room.
          </p>

          <button
            onClick={handleReturnHome}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#3f6212] py-3 text-xs font-bold text-white shadow-md hover:bg-[#365314] active:scale-95 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </div>
    );
  }

  // ─── 3. HOST CLOSED THE MEETING VIEW (CLEAN REAL-LOOK TEXT) ───
  if (admissionStatus === "closed") {
    return (
      <div className="bg-app-gradient relative flex min-h-screen w-screen items-center justify-center p-4 overflow-hidden selection:bg-emerald-900 selection:text-emerald-100">
        <Toaster position="top-center" />

        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -top-40 left-1/3 h-137.5 w-137.5 rounded-full bg-emerald-500/10 blur-3xl opacity-80" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-137.5 w-137.5 rounded-full bg-[#84cc16]/10 blur-3xl opacity-80" />

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#081307]/90 border border-emerald-900/40 p-8 text-center shadow-2xl backdrop-blur-2xl">
          {/* Simple real icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 shadow-lg">
            <PhoneOff className="h-8 w-8 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">Host closed the meeting</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            {closedReason || "The host has ended this meeting session."}
          </p>

          {/* Meeting details pill */}
          <div className="mt-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/30 p-4 text-left">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5 mb-2.5">
              <span className="text-xs text-emerald-300/60 font-medium">Meeting Code</span>
              <span className="font-mono text-xs font-bold text-emerald-200">{cleanRoomId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-300/60 font-medium">Status</span>
              <span className="text-xs font-semibold text-red-400">Ended by Host</span>
            </div>
          </div>

          <button
            onClick={handleReturnHome}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#3f6212] py-3 text-xs font-bold text-white shadow-md hover:bg-[#365314] active:scale-95 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </div>
    );
  }

  // ─── 3. ACTIVE MEETING ROOM VIEW ─────────────────────────────
  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#08120a] flex flex-col selection:bg-emerald-900 selection:text-emerald-100">
      <Toaster position="top-center" />

      {/* ─── Host Admission Bar: Appears when guests are knocking (60s timer with Decline button) ─── */}
      {isHost && joinRequests.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-lg px-4 animate-scale-up">
          {joinRequests.map((req) => {
            const elapsed = Date.now() - req.createdAt;
            const remainingSec = Math.max(1, Math.ceil((60000 - elapsed) / 1000));
            const progressPercent = Math.max(0, Math.min(100, (remainingSec / 60) * 100));

            return (
              <div
                key={req.requesterSocketId}
                className="relative overflow-hidden rounded-2xl bg-[#08170c]/98 border border-emerald-500/40 p-3.5 text-white shadow-2xl backdrop-blur-2xl ring-1 ring-lime-400/25"
              >
                {/* 60s Animated Countdown Progress Bar at the top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-950/80 overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#84cc16] to-emerald-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-[#3f6212] to-[#65a30d] text-xs font-bold text-white shadow-md shadow-lime-950/40">
                      <UserCheck className="h-4.5 w-4.5" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                        <span>{req.userName}</span>
                        <span className="text-[10px] font-mono text-emerald-400/90 font-semibold bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                          {remainingSec}s
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300/70 flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-400 animate-ping" />
                        <span>Wants to join this meeting</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Admit Button */}
                    <button
                      onClick={() => handleAdmitUser(req.requesterSocketId, req.userName)}
                      className="flex items-center gap-1.5 rounded-full bg-[#3f6212] hover:bg-[#365314] px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:shadow-lime-900/40 active:scale-95 transition-all cursor-pointer"
                      title="Admit to Meeting"
                    >
                      <Check className="h-3.5 w-3.5 text-lime-300" />
                      <span>Admit</span>
                    </button>

                    {/* Decline Button */}
                    <button
                      onClick={() => handleDenyUser(req.requesterSocketId, req.userName)}
                      className="flex items-center gap-1.5 rounded-full bg-red-950/80 border border-red-700/60 hover:bg-red-900 hover:border-red-500 px-3.5 py-1.5 text-xs font-bold text-red-200 hover:text-white shadow-md active:scale-95 transition-all cursor-pointer"
                      title="Decline Request"
                    >
                      <X className="h-3.5 w-3.5 text-red-400" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Floating Screen Share Permission Requests Banner for Host ─── */}
      {isHost && screenShareRequests.length > 0 && (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-auto">
          {screenShareRequests.map((req) => (
            <div
              key={req.requesterSocketId}
              className="relative flex items-center justify-between gap-3 rounded-2xl bg-[#081307]/95 border border-lime-500/50 p-3.5 backdrop-blur-xl shadow-2xl shadow-black/80 animate-fade-in"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-500/20 text-lime-400 border border-lime-500/30">
                  <MonitorUp className="h-4.5 w-4.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{req.userName}</div>
                  <div className="text-[11px] text-lime-300/80">Wants to share screen</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => respondScreenShareRequest(req.requesterSocketId, req.userId, true)}
                  className="rounded-full bg-lime-600 hover:bg-lime-500 px-3 py-1 text-xs font-bold text-slate-950 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Allow
                </button>
                <button
                  onClick={() => respondScreenShareRequest(req.requesterSocketId, req.userId, false)}
                  className="rounded-full bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-300 active:scale-95 transition-all cursor-pointer"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Ambient Atmospheric Glow in Background ─── */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-137.5 w-137.5 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-137.5 w-137.5 rounded-full bg-[#84cc16]/10 blur-3xl" />

      {/* ─── Top Meeting Header Bar ─── */}
      <MeetingHeader
        roomId={cleanRoomId}
        meetingTitle="Product Sync & Standup"
        hostName={isHost ? `${currentUserName} (Host)` : currentUserName}
        participantCount={participantsList.length}
        participants={participantsList}
        onToggleParticipants={handleToggleParticipants}
      />

      {/* ─── Main Split Canvas: Dynamic Video Grid + Collapsible Sidebar ─── */}
      <div className="relative flex-1 overflow-hidden flex">
        {/* Left Video Grid Area */}
        <div
          className={`relative h-full flex-1 transition-all duration-300 ${
            isPanelOpen ? "mr-0 lg:mr-95" : ""
          }`}
        >
          <VideoGrid
            localStream={localStream}
            screenStream={screenStream}
            peers={peers}
            localUser={{
              userId: currentUserId,
              userName: currentUserName,
              isMuted,
              isCameraOff,
              isSpeaking: isLocalSpeaking,
              avatarUrl: currentUserAvatar,
            }}
            isScreenSharing={isScreenSharing}
            onStopScreenShare={stopScreenShare}
          />
        </div>

        {/* Right Sidebar: Live Chat, People & Notes */}
        {isPanelOpen && (
          <div className="absolute inset-y-0 right-0 z-20 w-full sm:w-95 shadow-2xl transition-all">
            <TranscriptPanel
              messages={messages}
              currentUserId={currentUserId}
              onSendMessage={sendMessage}
              onClose={() => setIsPanelOpen(false)}
              initialTab={activePanelTab}
              participants={participantsList}
              roomId={cleanRoomId}
              isHost={isHost}
              allScreenShareAllowed={allScreenShareAllowed}
              onToggleAllScreenShare={toggleAllScreenShare}
              onSetParticipantScreenShare={setParticipantScreenSharePermission}
              onStopParticipantScreenShare={stopParticipantScreenShare}
            />
          </div>
        )}
      </div>

      {/* ─── Floating On-Screen Emoji Reactions ─── */}
      <FloatingReactions
        reactions={reactions}
        onRemoveReaction={handleRemoveReaction}
      />

      {/* ─── Live Captions / Subtitles Overlay ─── */}
      <CaptionsOverlay
        caption={activeCaption}
        isVisible={isCaptionsEnabled}
      />

      {/* ─── Captions & Language Settings Modal ─── */}
      <CaptionsModal
        isOpen={isCaptionsModalOpen}
        onClose={() => setIsCaptionsModalOpen(false)}
        isCaptionsEnabled={isCaptionsEnabled}
        onToggleCaptions={toggleCaptions}
        spokenLang={spokenLang}
        onSelectSpokenLang={setSpokenLang}
        captionLang={captionLang}
        onSelectCaptionLang={setCaptionLang}
      />

      {/* ─── Bottom Floating Controls Dock ─── */}
      <ControlBar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        canShareScreen={canShareScreen || allScreenShareAllowed}
        isChatOpen={isPanelOpen && activePanelTab === "chat"}
        isTranscriptOpen={isPanelOpen && activePanelTab === "transcript"}
        isParticipantsOpen={isPanelOpen && activePanelTab === "participants"}
        isCaptionsEnabled={isCaptionsEnabled}
        unreadCount={0}
        participantCount={participantsList.length}
        roomId={cleanRoomId}
        isHost={isHost}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onRequestScreenSharePermission={requestScreenSharePermission}
        onToggleChat={handleToggleChat}
        onToggleTranscript={handleToggleTranscript}
        onToggleParticipants={handleToggleParticipants}
        onToggleCaptions={toggleCaptions}
        onOpenCaptionsModal={() => setIsCaptionsModalOpen(true)}
        onSendReaction={handleSendReaction}
        onLeaveMeeting={handleLeave}
      />
    </div>
  );
};

export default MeetingRoom;
