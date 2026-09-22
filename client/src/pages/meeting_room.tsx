import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
} from "lucide-react";
import VideoGrid from "../components/meeting/video_grid";
import MeetingHeader from "../components/meeting/meeting_header";
import ControlBar from "../components/meeting/control_bar";
import TranscriptPanel, { type ParticipantItem } from "../components/meeting/transcript_panel";
import AudioSettingsModal from "../components/meeting/audio_settings_modal";
import { useWebRTC } from "../hooks/useWebRTC";
import socket from "../config/socket";
import soundEffects from "../utils/soundEffects";
import { useUser } from "@clerk/clerk-react";
import usePageSEO from "../hooks/usePageSEO";

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

  // Load user name from Clerk, localStorage or default
  const currentUserName = useMemo(() => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName) return user.firstName;
    const saved = localStorage.getItem("meeting_user_name");
    return saved && saved.trim() ? saved.trim() : "Divyesh Soni";
  }, [user]);

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
    "admitted" | "waiting" | "denied" | "closed"
  >(isHost ? "admitted" : "waiting");
  const [closedReason, setClosedReason] = useState("Host closed the meeting");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // ─── Sidebar / Drawer State ─────────────────────────────────
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<
    "transcript" | "chat" | "notes" | "participants"
  >("chat");
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

  // Pre-join audio and camera preferences
  const initialMuted = useMemo(() => {
    return localStorage.getItem("prejoin_muted") === "true";
  }, []);
  const initialCameraOff = useMemo(() => {
    return localStorage.getItem("prejoin_camera_off") === "true";
  }, []);

  // ─── Real-World WebRTC Peer Engine ──────────────────────────
  const {
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
  } = useWebRTC({
    roomId: cleanRoomId,
    currentUser: {
      userId: currentUserId,
      userName: currentUserName,
      avatarUrl: currentUserAvatar,
    },
    initialMuted,
    initialCameraOff,
    enabled: admissionStatus === "admitted",
    isHost,
  });

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
          setAdmissionStatus("admitted");
          toast.success("Admitted to the meeting!", {
            iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
          });
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
  ]);

  // Dynamic participants list formed by local user + all connected peers
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
      },
    ];

    peers.forEach((peer) => {
      list.push({
        id: peer.peerId,
        name: peer.userName,
        avatar: peer.avatarUrl || "",
        role: "participant",
        isMuted: peer.isMuted,
        isCameraOff: peer.isCameraOff,
      });
    });

    return list;
  }, [currentUserId, currentUserName, currentUserAvatar, isHost, isMuted, isCameraOff, peers]);

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
    navigate("/dashboard");
  }, [cleanRoomId, isHost, leaveMeeting, navigate]);

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
              onClick={() => navigate("/dashboard")}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-800/60 bg-emerald-950/60 py-3 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-900/60 hover:text-white active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cancel & Return to Dashboard
            </button>
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
            onClick={() => navigate("/dashboard")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#3f6212] py-3 text-xs font-bold text-white shadow-md hover:bg-[#365314] active:scale-95 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
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
            onClick={() => navigate("/dashboard")}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#3f6212] py-3 text-xs font-bold text-white shadow-md hover:bg-[#365314] active:scale-95 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Dashboard
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
          className={`relative h-full flex-1 transition-all duration-300 ${isPanelOpen ? "mr-0 lg:mr-95" : ""
            }`}
        >
          <VideoGrid
            localStream={localStream}
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
            />
          </div>
        )}
      </div>

      {/* ─── Bottom Floating Controls Dock ─── */}
      <ControlBar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isChatOpen={isPanelOpen && activePanelTab === "chat"}
        isTranscriptOpen={isPanelOpen && activePanelTab === "transcript"}
        isParticipantsOpen={isPanelOpen && activePanelTab === "participants"}
        isAudioSettingsOpen={isAudioSettingsOpen}
        unreadCount={0}
        participantCount={participantsList.length}
        roomId={cleanRoomId}
        isHost={isHost}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={handleToggleChat}
        onToggleTranscript={handleToggleTranscript}
        onToggleParticipants={handleToggleParticipants}
        onToggleAudioSettings={() => setIsAudioSettingsOpen((prev) => !prev)}
        onLeaveMeeting={handleLeave}
      />

      {/* ─── Audio & Crystal-Clear Mic Settings Modal (Powered by Howler.js) ─── */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
        localStream={localStream}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />
    </div>
  );
};

export default MeetingRoom;
