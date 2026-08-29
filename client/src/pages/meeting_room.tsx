import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import {
  Video,
  Clock,
  Check,
  X,
  UserCheck,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import VideoGrid from "../components/meeting/video_grid";
import MeetingHeader from "../components/meeting/meeting_header";
import ControlBar from "../components/meeting/control_bar";
import TranscriptPanel, { type ParticipantItem } from "../components/meeting/transcript_panel";
import AudioSettingsModal from "../components/meeting/audio_settings_modal";
import { useWebRTC } from "../hooks/useWebRTC";
import socket from "../config/socket";
import { useUser } from "@clerk/clerk-react";

interface JoinRequest {
  requesterSocketId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  roomId: string;
}

const MeetingRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const cleanRoomId = roomId || "default-room";
  const navigate = useNavigate();
  const { user } = useUser();

  // Host detection
  const isHost = useMemo(() => {
    return localStorage.getItem(`is_host_${cleanRoomId}`) === "true";
  }, [cleanRoomId]);

  // Load user name from Clerk, localStorage or default
  const currentUserName = useMemo(() => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName) return user.firstName;
    const saved = localStorage.getItem("meeting_user_name");
    return saved && saved.trim() ? saved.trim() : "Divyesh Soni";
  }, [user]);

  const currentUserId = useMemo(() => {
    if (user?.id) return user.id;
    const saved = localStorage.getItem("meeting_user_id");
    if (saved) return saved;
    const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem("meeting_user_id", newId);
    return newId;
  }, [user]);

  const currentUserAvatar = user?.imageUrl || "";

  // ─── Admission State (Waiting Room & Knock Flow) ─────────────
  const [admissionStatus, setAdmissionStatus] = useState<"admitted" | "waiting" | "denied">(
    isHost ? "admitted" : "waiting"
  );
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // ─── Sidebar / Drawer State ─────────────────────────────────
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<"transcript" | "chat" | "notes" | "participants">("chat");
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

  // ─── Socket Signaling for Admission & Knock Flow ────────────
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (isHost) {
      // Host listens for admission requests from incoming guests
      const handleJoinRequestReceived = (request: JoinRequest) => {
        setJoinRequests((prev) => {
          if (prev.some((r) => r.requesterSocketId === request.requesterSocketId)) {
            return prev;
          }
          return [...prev, request];
        });

        toast(
          (t) => (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-800">
                <strong>{request.userName}</strong> wants to join
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    handleAdmitUser(request.requesterSocketId, request.userName);
                    toast.dismiss(t.id);
                  }}
                  className="rounded-full bg-[#3f6212] px-2.5 py-1 font-bold text-white hover:bg-[#365314]"
                >
                  Admit
                </button>
                <button
                  onClick={() => {
                    handleDenyUser(request.requesterSocketId, request.userName);
                    toast.dismiss(t.id);
                  }}
                  className="rounded-full bg-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Deny
                </button>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
      };

      socket.on("join-request-received", handleJoinRequestReceived);
      return () => {
        socket.off("join-request-received", handleJoinRequestReceived);
      };
    } else {
      // Guest emits request to join
      socket.emit("request-join", {
        roomId: cleanRoomId,
        userId: currentUserId,
        userName: currentUserName,
        avatarUrl: currentUserAvatar,
        isHost: false,
      });

      const handleJoinResponse = ({ approved, reason }: { approved: boolean; reason?: string }) => {
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
        socket.off("join-response", handleJoinResponse);
      };
    }
  }, [cleanRoomId, currentUserId, currentUserName, currentUserAvatar, isHost]);

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
    leaveMeeting();
    navigate("/dashboard");
  }, [leaveMeeting, navigate]);

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

          <h2 className="text-2xl font-bold tracking-tight text-white mt-3">
            Asking to join...
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-emerald-200/70">
            Your request has been sent to the host. You'll automatically enter the meeting once they let you in.
          </p>

          {/* Meeting & User Summary Card */}
          <div className="mt-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 p-4 text-left">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2.5 mb-2.5">
              <span className="text-xs text-emerald-300/60 font-medium">Meeting Code</span>
              <span className="font-mono text-xs font-bold text-emerald-200">{cleanRoomId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-300/60 font-medium">Joining As</span>
              <span className="text-xs font-bold text-white truncate max-w-40">{currentUserName}</span>
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

  // ─── 3. ACTIVE MEETING ROOM VIEW ─────────────────────────────
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#08120a] flex flex-col selection:bg-emerald-900 selection:text-emerald-100">
      <Toaster position="top-center" />

      {/* ─── Host Admission Bar: Appears when guests are knocking ─── */}
      {isHost && joinRequests.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 animate-scale-up">
          {joinRequests.map((req) => (
            <div
              key={req.requesterSocketId}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#0a1b0e]/95 border border-emerald-700/60 p-3 text-white shadow-2xl backdrop-blur-xl ring-2 ring-lime-500/20"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-[#3f6212] to-[#65a30d] text-xs font-bold text-white">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{req.userName}</div>
                  <div className="text-[10px] text-emerald-300/70">Wants to join this call</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleAdmitUser(req.requesterSocketId, req.userName)}
                  className="flex items-center gap-1 rounded-full bg-[#3f6212] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#365314] active:scale-95 transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  Admit
                </button>
                <button
                  onClick={() => handleDenyUser(req.requesterSocketId, req.userName)}
                  className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-950 border border-emerald-800/60 text-slate-400 hover:text-red-400 hover:border-red-800/60 active:scale-95 transition-all"
                  title="Deny Request"
                >
                  <X className="h-3.5 w-3.5" />
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
            peers={peers}
            localUser={{
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
