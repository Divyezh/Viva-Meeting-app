import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from "react";
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
import { prepareGuestJoin } from "../utils/meetingJoin";
import ConnectingScreen from "../components/meeting/connecting_screen";

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
  const { user, isLoaded: isUserLoaded } = useUser();

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
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLobbyStream(stream);
        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.muted = true;
          lobbyVideoRef.current.defaultMuted = true;
          lobbyVideoRef.current.volume = 0;
          // Attach only video tracks to the preview element to physically guarantee zero audio playback
          lobbyVideoRef.current.srcObject = new MediaStream(stream.getVideoTracks());
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

  // Ensure lobby video element attaches and plays reliably whenever stream or camera state updates
  useEffect(() => {
    const videoEl = lobbyVideoRef.current;
    if (!videoEl || !lobbyStream) return;
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.volume = 0;
    if (videoEl.srcObject !== lobbyStream) {
      videoEl.srcObject = lobbyStream;
    }
    if (!lobbyCameraOff) {
      videoEl.play().catch(() => {});
    }
  }, [lobbyStream, inLobby, lobbyCameraOff]);

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
  const [activePanelTab, setActivePanelTab] = useState<"chat" | "participants">("chat");

  // Pre-join audio and camera preferences
  const initialMuted = useMemo(() => {
    return lobbyMicMuted || localStorage.getItem("prejoin_muted") === "true";
  }, [lobbyMicMuted]);
  const initialCameraOff = useMemo(() => {
    return lobbyCameraOff || localStorage.getItem("prejoin_camera_off") === "true";
  }, [lobbyCameraOff]);

  const currentUserObj = useMemo(
    () => ({
      userId: currentUserId,
      userName: currentUserName,
      avatarUrl: currentUserAvatar,
    }),
    [currentUserId, currentUserName, currentUserAvatar]
  );

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
    connectionPhase,
    isWaitingForPermissions,
    isInitializing,
    isReady,
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
    currentUser: currentUserObj,
    initialMuted,
    initialCameraOff,
    // Only start media/signaling once Clerk has resolved, so the userId never flips mid-session
    enabled:
      isUserLoaded &&
      !inLobby &&
      (admissionStatus === "admitted" || admissionStatus === "connecting"),
    isHost,
  });

  // ─── Smooth Connecting Overlay Transition State ──────────────
  const [showConnectingTransition, setShowConnectingTransition] = useState(true);
  const [isTransitionExiting, setIsTransitionExiting] = useState(false);
  const [exitingRequestIds, setExitingRequestIds] = useState<
    Record<string, "admitted" | "denied" | "expired">
  >({});

  // Trigger smooth handoff into meeting room once ready or media active
  useEffect(() => {
    if (!showConnectingTransition || isTransitionExiting) return;
    if (isReady || localStream) {
      setIsTransitionExiting(true);
      const timer = setTimeout(() => {
        setShowConnectingTransition(false);
        setIsTransitionExiting(false);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [isReady, localStream, showConnectingTransition, isTransitionExiting]);

  // Safety fallback: ensure screen never hangs indefinitely
  useEffect(() => {
    if (!showConnectingTransition || isTransitionExiting) return;
    const safetyTimer = setTimeout(() => {
      setIsTransitionExiting(true);
      setTimeout(() => {
        setShowConnectingTransition(false);
        setIsTransitionExiting(false);
      }, 320);
    }, 4000);
    return () => clearTimeout(safetyTimer);
  }, [showConnectingTransition, isTransitionExiting]);

  // ─── Fast & smooth entering transition after host admits guest ───
  useEffect(() => {
    if (admissionStatus !== "connecting") return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 250) {
        setAdmissionStatus("admitted");
        toast.success("Joined meeting room!", {
          iconTheme: { primary: "#10b981", secondary: "#ffffff" },
        });
        clearInterval(interval);
      }
    }, 50);

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
      navigate("/");
    } else {
      navigate("/join");
    }
  }, [user, navigate]);

  const handleLobbyJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = lobbyName.trim() || (user?.fullName || user?.firstName || "Guest");
    prepareGuestJoin({
      roomId: cleanRoomId,
      userName: finalName,
      muted: lobbyMicMuted,
      cameraOff: lobbyCameraOff,
    });

    if (lobbyStream) {
      lobbyStream.getTracks().forEach((t) => t.stop());
      setLobbyStream(null);
    }
    setInLobby(false);
  };

  // Host Action: Admit Guest with smooth exit animation
  const handleAdmitUser = useCallback(
    (requesterSocketId: string, guestName: string) => {
      console.log(`[Admission] Host clicked ADMIT for ${guestName} (${requesterSocketId})`);
      // Immediately emit approval to server so attendee is unblocked with zero latency
      socket.emit("approve-join-request", {
        requesterSocketId,
        approved: true,
        roomId: cleanRoomId,
      });

      // Mark as exiting to trigger smooth slide-up + fade-out CSS exit animation
      setExitingRequestIds((prev) => ({ ...prev, [requesterSocketId]: "admitted" }));
      toast.success(`Admitted ${guestName} to the meeting`);

      setTimeout(() => {
        setJoinRequests((prev) => prev.filter((r) => r.requesterSocketId !== requesterSocketId));
        setExitingRequestIds((prev) => {
          const next = { ...prev };
          delete next[requesterSocketId];
          return next;
        });
      }, 240);
    },
    [cleanRoomId]
  );

  // Host Action: Deny Guest with smooth exit animation
  const handleDenyUser = useCallback(
    (requesterSocketId: string, guestName: string) => {
      socket.emit("approve-join-request", {
        requesterSocketId,
        approved: false,
        roomId: cleanRoomId,
      });

      // Mark as exiting to trigger smooth slide-up + fade-out CSS exit animation
      setExitingRequestIds((prev) => ({ ...prev, [requesterSocketId]: "denied" }));
      toast(`${guestName}'s request was declined`);

      setTimeout(() => {
        setJoinRequests((prev) => prev.filter((r) => r.requesterSocketId !== requesterSocketId));
        setExitingRequestIds((prev) => {
          const next = { ...prev };
          delete next[requesterSocketId];
          return next;
        });
      }, 240);
    },
    [cleanRoomId]
  );

  // ─── 60-Second Auto-Expire & Live Countdown Tick for Join Requests ─
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    if (!isHost || joinRequests.length === 0) return;

    const timer = setInterval(() => {
      const now = Date.now();
      // Requests that reach 60s are smoothly declined so the guest isn't left waiting forever
      const expired = joinRequestsRef.current.filter((r) => now - r.createdAt >= 60000);
      if (expired.length > 0) {
        expired.forEach((r) => {
          console.log(`[Admission] Join request from ${r.userName} timed out`);
          socket.emit("approve-join-request", {
            requesterSocketId: r.requesterSocketId,
            approved: false,
            roomId: cleanRoomId,
            reason: "No one responded to your request to join.",
          });
          setExitingRequestIds((prev) => ({ ...prev, [r.requesterSocketId]: "expired" }));
        });
        setTimeout(() => {
          setJoinRequests((prev) => prev.filter((r) => now - r.createdAt < 60000));
          setExitingRequestIds((prev) => {
            const next = { ...prev };
            expired.forEach((r) => delete next[r.requesterSocketId]);
            return next;
          });
        }, 240);
      }
      // Re-render each second to update the smooth countdown bar and seconds display
      setTimerTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, joinRequests.length, cleanRoomId]);

  // Refs so the admission effect below can read the latest values without re-running
  // (re-running it is what used to re-emit "request-join" after the guest was admitted).
  const admissionStatusRef = useRef(admissionStatus);
  const identityRef = useRef({ currentUserId, currentUserName, currentUserAvatar });
  const leaveMeetingRef = useRef(leaveMeeting);
  const joinRequestsRef = useRef(joinRequests);
  useLayoutEffect(() => {
    admissionStatusRef.current = admissionStatus;
    identityRef.current = { currentUserId, currentUserName, currentUserAvatar };
    leaveMeetingRef.current = leaveMeeting;
    joinRequestsRef.current = joinRequests;
  });

  // ─── Socket Signaling for Admission & Knock Flow ────────────
  // Runs once per (room, role) after the lobby and Clerk are ready. A guest sends exactly ONE
  // "request-join" per socket connection; the server keeps it queued and forwards it to the host
  // whenever the host (re)connects, so no client-side retry loop is needed.
  useEffect(() => {
    if (inLobby || !isUserLoaded) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleMeetingEnded = (data?: { reason?: string }) => {
      if (isHost) return;
      leaveMeetingRef.current();
      setAdmissionStatus("closed");
      if (data?.reason) {
        setClosedReason(data.reason);
      }
      sessionStorage.removeItem(`is_host_${cleanRoomId}`);
      localStorage.removeItem(`is_host_${cleanRoomId}`);
    };

    socket.on("meeting-ended-by-host", handleMeetingEnded);

    if (isHost) {
      const registerHost = () => {
        const { currentUserId: uid, currentUserName: name, currentUserAvatar: avatar } =
          identityRef.current;
        console.log(`[Admission] Host registering for room ${cleanRoomId} (socket ${socket.id})`);
        socket.emit("request-join", {
          roomId: cleanRoomId,
          userId: uid,
          userName: name,
          avatarUrl: avatar,
          isHost: true,
        });
      };

      if (socket.connected) registerHost();
      socket.on("connect", registerHost);

      const handleJoinRequestReceived = (request: Omit<JoinRequest, "createdAt">) => {
        console.log(
          `[Admission] Host received join request from ${request.userName} (${request.requesterSocketId})`
        );
        const alreadyShown = joinRequestsRef.current.some(
          (r) =>
            r.requesterSocketId === request.requesterSocketId ||
            (request.userId && r.userId === request.userId)
        );
        if (!alreadyShown) soundEffects.playJoin();

        setJoinRequests((prev) => {
          const existing = prev.find(
            (r) =>
              r.requesterSocketId === request.requesterSocketId ||
              (request.userId && r.userId === request.userId)
          );
          if (existing && existing.requesterSocketId === request.requesterSocketId) {
            return prev; // Exact duplicate: keep UI stable
          }
          const filtered = prev.filter(
            (r) =>
              r.requesterSocketId !== request.requesterSocketId &&
              (!request.userId || r.userId !== request.userId)
          );
          return [
            ...filtered,
            { ...request, createdAt: existing ? existing.createdAt : Date.now() },
          ];
        });
      };

      const handleJoinRequestCancelled = ({
        requesterSocketId,
        userId,
      }: {
        requesterSocketId: string;
        userId: string;
      }) => {
        console.log(`[Admission] Join request cancelled (${requesterSocketId})`);
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
        socket.off("connect", registerHost);
        socket.off("meeting-ended-by-host", handleMeetingEnded);
        socket.off("join-request-received", handleJoinRequestReceived);
        socket.off("join-request-cancelled", handleJoinRequestCancelled);
      };
    }

    // ── Guest ──
    const sendJoinRequest = () => {
      // Once admitted, never knock again (a reconnect re-joins via useWebRTC instead)
      if (admissionStatusRef.current !== "waiting") return;
      const { currentUserId: uid, currentUserName: name, currentUserAvatar: avatar } =
        identityRef.current;
      console.log(`[Admission] Guest emitting request-join for ${cleanRoomId} (socket ${socket.id})`);
      socket.emit("request-join", {
        roomId: cleanRoomId,
        userId: uid,
        userName: name,
        avatarUrl: avatar,
        isHost: false,
      });
    };

    // Emit now if connected, and once per (re)connection — each reconnect has a new socket.id
    if (socket.connected) sendJoinRequest();
    socket.on("connect", sendJoinRequest);

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
      console.log("[Admission] Guest received join-response:", {
        approved,
        meetingClosed,
        waitingForHost,
        reason,
      });

      if (meetingClosed) {
        setAdmissionStatus("closed");
        setClosedReason(reason || "Host closed the meeting");
        leaveMeetingRef.current();
        return;
      }

      // Ignore stale responses once we've moved past the waiting room
      if (admissionStatusRef.current !== "waiting") return;

      if (waitingForHost) return; // Server keeps our request queued for the host

      if (approved) {
        admissionStatusRef.current = "connecting";
        setAdmissionStatus("connecting");
      } else {
        admissionStatusRef.current = "denied";
        setAdmissionStatus("denied");
        toast.error(reason || "The host declined your request to join.");
      }
    };

    socket.on("join-response", handleJoinResponse);
    return () => {
      socket.off("meeting-ended-by-host", handleMeetingEnded);
      socket.off("join-response", handleJoinResponse);
      socket.off("connect", sendJoinRequest);
      // Guest left the waiting room (navigated away): withdraw the pending knock on the server
      if (admissionStatusRef.current === "waiting") {
        socket.emit("leave-room");
      }
    };
  }, [cleanRoomId, isHost, inLobby, isUserLoaded]);

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
      <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-[#1a1a1a] text-[#f3f4f6]">
        <Toaster position="top-center" />

        {/* Top Header */}
        <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between py-2">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#242424] border border-[#383838] shadow-md">
              <BrandLogo className="h-6 w-6" color="#10b981" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#f3f4f6]">
              Viva Meeting<span className="text-[#10b981]">.</span>
            </span>
          </Link>

          {!user && (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all"
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
              <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-[#1e1e1e] border border-[#383838] shadow-2xl flex items-center justify-center">
                <video
                  ref={lobbyVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => lobbyVideoRef.current?.play().catch(() => {})}
                  className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                    lobbyCameraOff ? "opacity-0" : "opacity-100"
                  }`}
                />

                {lobbyCameraOff && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#242424] border border-[#383838] text-[#f3f4f6] shadow-xl text-2xl font-bold">
                      {lobbyName.trim() ? lobbyName.trim().charAt(0).toUpperCase() : "G"}
                    </div>
                    <span className="mt-3 text-xs font-medium text-[#9ca3af]">Camera is off</span>
                  </div>
                )}

                <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                  <span className="rounded-full bg-[#1e1e1e]/90 px-3 py-1 text-[11px] font-semibold text-white border border-[#383838] flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${lobbyMicMuted ? "bg-red-400" : "bg-[#10b981] animate-pulse"}`}
                    />
                    {lobbyName.trim() ? lobbyName.trim() : "Guest Preview"}
                  </span>
                </div>

                {/* Floating Media Toggles */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#1e1e1e]/90 p-2 rounded-full border border-[#383838] shadow-lg">
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
                        : "bg-[#2a2a2a] hover:bg-[#383838] text-white"
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
                        : "bg-[#2a2a2a] hover:bg-[#383838] text-white"
                    }`}
                    title={lobbyCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    {lobbyCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#9ca3af] font-medium">
                <span>{lobbyMicMuted ? "Mic muted" : "Mic active"}</span>
                <span>•</span>
                <span>{lobbyCameraOff ? "Camera off" : "Camera active"}</span>
              </div>
            </div>

            {/* Right: Join Form */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-[#242424] border border-[#383838] p-6 sm:p-8 shadow-2xl">
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1e1e1e] border border-[#383838] px-2.5 py-0.5 text-[11px] font-bold text-[#34d399] mb-2.5">
                    <Sparkles className="h-3 w-3 text-[#10b981]" />
                    <span>Meeting Room</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#f3f4f6]">
                    Ready to join?
                  </h1>
                  <p className="mt-1 text-xs text-[#9ca3af]">
                    Room: <span className="font-mono font-bold text-[#f3f4f6]">{cleanRoomId}</span>
                  </p>
                </div>

                <form onSubmit={handleLobbyJoin} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#9ca3af]">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10b981]" />
                      <input
                        type="text"
                        required
                        value={lobbyName}
                        onChange={(e) => setLobbyName(e.target.value)}
                        placeholder="Enter your name to join"
                        className="w-full rounded-2xl bg-[#1e1e1e] border border-[#383838] py-3 pl-10 pr-4 text-sm font-medium text-[#f3f4f6] placeholder-[#6b7280] outline-none transition-all focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] py-3.5 text-sm font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Ask to Join</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleReturnHome}
                    className="w-full flex items-center justify-center gap-2 rounded-full border border-[#383838] py-2.5 text-xs font-semibold text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#2a2a2a] transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-[#383838] flex items-center justify-between text-[11px] text-[#9ca3af]">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[#10b981]" />
                    <span>Encrypted Call</span>
                  </div>
                  {!user && (
                    <Link to="/login" className="font-semibold text-[#34d399] hover:underline">
                      Sign In instead
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative z-10 text-center py-2 text-[11px] text-[#9ca3af]">
          Viva Meeting &copy; {new Date().getFullYear()} · No sign-in required for guests
        </footer>
      </div>
    );
  }

  // ─── 1. WAITING ROOM VIEW (GUEST WAITING FOR HOST ADMISSION) ─
  if (admissionStatus === "waiting") {
    return (
      <div className="relative flex min-h-screen w-screen items-center justify-center p-4 bg-[#1a1a1a] text-[#f3f4f6]">
        <Toaster position="top-center" />

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#242424] border border-[#383838] p-8 text-center shadow-2xl">
          {/* Pulsing Animated Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] shadow-lg relative">
            <Clock className="h-9 w-9 text-[#10b981] animate-spin [animation-duration:6s]" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#10b981]"></span>
            </span>
          </div>

          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#1e1e1e] border border-[#383838] px-3 py-1 text-[11px] font-semibold text-[#34d399]">
            <Sparkles className="h-3 w-3 text-[#10b981]" />
            <span>Waiting for Host Admission</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#f3f4f6] mt-3">Asking to join...</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
            Your request has been sent to the host. You'll automatically enter the meeting once they
            let you in.
          </p>

          {/* Meeting & User Summary Card */}
          <div className="mt-6 rounded-2xl bg-[#1e1e1e] border border-[#383838] p-4 text-left">
            <div className="flex items-center justify-between border-b border-[#383838] pb-2.5 mb-2.5">
              <span className="text-xs text-[#9ca3af] font-medium">Meeting Code</span>
              <span className="font-mono text-xs font-bold text-[#f3f4f6]">{cleanRoomId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9ca3af] font-medium">Joining As</span>
              <span className="text-xs font-bold text-[#f3f4f6] truncate max-w-40">
                {currentUserName}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col gap-2.5">
            <button
              onClick={handleReturnHome}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#383838] bg-[#1e1e1e] py-3 text-xs font-semibold text-[#f3f4f6] transition-all hover:bg-[#2a2a2a] active:scale-95"
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
      <ConnectingScreen
        roomId={cleanRoomId}
        userName={currentUserName}
        isWaitingForPermissions={isWaitingForPermissions}
        connectionPhase={connectionPhase}
      />
    );
  }

  // ─── 2. DENIED ADMISSION VIEW ────────────────────────────────
  if (admissionStatus === "denied") {
    return (
      <div className="relative flex min-h-screen w-screen items-center justify-center p-4 bg-[#1a1a1a] text-[#f3f4f6]">
        <Toaster position="top-center" />

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#242424] border border-red-500/30 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-950/50 border border-red-800/60 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold text-white">Unable to Join</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
            The host declined your request to join this meeting room.
          </p>

          <button
            onClick={handleReturnHome}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#10b981] py-3 text-xs font-bold text-white shadow-md hover:bg-[#059669] active:scale-95 transition-all"
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
      <div className="relative flex min-h-screen w-screen items-center justify-center p-4 bg-[#1a1a1a] text-[#f3f4f6]">
        <Toaster position="top-center" />

        <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#242424] border border-[#383838] p-8 text-center shadow-2xl">
          {/* Simple real icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1e1e1e] border border-[#383838] text-[#9ca3af] shadow-lg">
            <PhoneOff className="h-8 w-8 text-[#9ca3af]" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">Host closed the meeting</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">
            {closedReason || "The host has ended this meeting session."}
          </p>

          {/* Meeting details pill */}
          <div className="mt-6 rounded-2xl bg-[#1e1e1e] border border-[#383838] p-4 text-left">
            <div className="flex items-center justify-between border-b border-[#383838] pb-2.5 mb-2.5">
              <span className="text-xs text-[#9ca3af] font-medium">Meeting Code</span>
              <span className="font-mono text-xs font-bold text-[#f3f4f6]">{cleanRoomId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9ca3af] font-medium">Status</span>
              <span className="text-xs font-semibold text-red-400">Ended by Host</span>
            </div>
          </div>

          <button
            onClick={handleReturnHome}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#10b981] py-3 text-xs font-bold text-white shadow-md hover:bg-[#059669] active:scale-95 transition-all"
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
    <div className="relative h-dvh w-screen overflow-hidden bg-[#202124] flex flex-col selection:bg-[#3c4043] selection:text-white">
      <Toaster position="top-center" />

      {/* ─── Seamless Connecting & Media Permission Overlay ─── */}
      {showConnectingTransition && (
        <ConnectingScreen
          roomId={cleanRoomId}
          userName={currentUserName}
          isWaitingForPermissions={isWaitingForPermissions}
          connectionPhase={connectionPhase}
          isExiting={isTransitionExiting}
        />
      )}

      {/* ─── Host Admission Bar: Appears when guests are knocking (60s timer with Decline button) ─── */}
      {isHost && joinRequests.length > 0 && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2.5 w-full max-w-lg px-3 sm:px-4 pointer-events-auto">
          {joinRequests.map((req) => {
            const isExiting = !!exitingRequestIds[req.requesterSocketId];
            const exitType = exitingRequestIds[req.requesterSocketId];
            const elapsed = Date.now() - req.createdAt;
            const remainingSec = Math.max(1, Math.ceil((60000 - elapsed) / 1000));
            const progressPercent = Math.max(0, Math.min(100, (remainingSec / 60) * 100));

            return (
              <div
                key={req.requesterSocketId}
                className={`transition-all duration-200 ease-out ${
                  isExiting
                    ? "opacity-0 -translate-y-3 scale-95 pointer-events-none max-h-0 py-0 my-0 overflow-hidden"
                    : "opacity-100 translate-y-0 scale-100 animate-slide-down"
                }`}
              >
                <div className="relative overflow-hidden rounded-xl bg-[#282a2d] border border-[#3c4043] p-3 sm:p-3.5 text-white shadow-xl">
                  {/* 60s Progress Bar at top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#202124] overflow-hidden">
                    <div
                      className="h-full bg-[#1a73e8] transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3c4043] text-xs font-semibold text-white">
                        <UserCheck className="h-4.5 w-4.5 text-[#8ab4f8]" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-medium text-white truncate flex items-center gap-2">
                          <span>{req.userName}</span>
                          <span className="text-[10px] font-mono text-[#9aa0a6] bg-[#202124] border border-[#3c4043] px-1.5 py-0.5 rounded-md">
                            {remainingSec}s
                          </span>
                        </div>
                        <div className="text-[11px] text-[#9aa0a6] flex items-center gap-1.5 mt-0.5">
                          <span>
                            {exitType === "admitted"
                              ? "Admitting guest..."
                              : exitType === "denied"
                                ? "Declining request..."
                                : "Wants to join this meeting"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Admit Button */}
                      <button
                        onClick={() => handleAdmitUser(req.requesterSocketId, req.userName)}
                        disabled={isExiting}
                        className="flex items-center justify-center gap-1.5 rounded-md bg-[#1a73e8] hover:bg-[#1557b0] px-3.5 py-1.5 min-h-9 sm:min-h-10 text-xs font-medium text-white shadow-sm active:scale-95 transition-all cursor-pointer"
                        title="Admit to Meeting"
                      >
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Admit</span>
                      </button>

                      {/* Decline Button */}
                      <button
                        onClick={() => handleDenyUser(req.requesterSocketId, req.userName)}
                        disabled={isExiting}
                        className="flex items-center justify-center gap-1.5 rounded-md bg-[#ea4335] hover:bg-[#d93025] px-3.5 py-1.5 min-h-9 sm:min-h-10 text-xs font-medium text-white shadow-sm active:scale-95 transition-all cursor-pointer"
                        title="Decline Request"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                        <span>Decline</span>
                      </button>
                    </div>
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
              className="relative flex items-center justify-between gap-3 rounded-xl bg-[#282a2d] border border-[#3c4043] p-3 shadow-xl animate-fade-in"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3c4043] text-[#8ab4f8]">
                  <MonitorUp className="h-4.5 w-4.5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-white truncate">{req.userName}</div>
                  <div className="text-[11px] text-[#9aa0a6]">Wants to share screen</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => respondScreenShareRequest(req.requesterSocketId, req.userId, true)}
                  className="rounded-md bg-[#1a73e8] hover:bg-[#1557b0] px-3 py-1 text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Allow
                </button>
                <button
                  onClick={() => respondScreenShareRequest(req.requesterSocketId, req.userId, false)}
                  className="rounded-md bg-[#3c4043] hover:bg-[#474a4d] px-2.5 py-1 text-xs font-medium text-white transition-colors cursor-pointer"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
          className={`relative h-full flex-1 transition-all duration-200 ${
            isPanelOpen ? "mr-0 md:mr-88 lg:mr-96" : ""
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

        {/* Right Sidebar: Live Chat & People (Responsive Drawer/Overlay) */}
        {isPanelOpen && (
          <div className="fixed sm:absolute inset-y-0 right-0 z-30 w-full sm:w-88 md:w-96 shadow-2xl transition-all">
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
