import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  PhoneOff,
  FileText,
  Smile,
  Circle,
  Lock,
  Subtitles,
  Languages,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  canShareScreen?: boolean;
  isChatOpen: boolean;
  isTranscriptOpen?: boolean;
  isParticipantsOpen: boolean;
  isCaptionsEnabled?: boolean;
  unreadCount: number;
  participantCount: number;
  roomId: string;
  isHost: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onRequestScreenSharePermission?: () => void;
  onToggleChat: () => void;
  onToggleTranscript?: () => void;
  onToggleParticipants: () => void;
  onToggleCaptions?: () => void;
  onOpenCaptionsModal?: () => void;
  onSendReaction?: (emoji: string) => void;
  onLeaveMeeting: () => void;
}

const ControlBar = ({
  isMuted,
  isCameraOff,
  isScreenSharing,
  canShareScreen = false,
  isChatOpen,
  isTranscriptOpen = true,
  isParticipantsOpen,
  isCaptionsEnabled = false,
  unreadCount,
  participantCount,
  isHost,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onRequestScreenSharePermission,
  onToggleChat,
  onToggleTranscript,
  onToggleParticipants,
  onToggleCaptions,
  onOpenCaptionsModal,
  onSendReaction,
  onLeaveMeeting,
}: ControlBarProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleToggleRecord = () => {
    setIsRecording((prev) => {
      const next = !prev;
      if (next) {
        toast.success("Meeting recording started (HD Cloud)", {
          style: {
            background: "#ffffff",
            color: "#142417",
            border: "1px solid #d1fae5",
            borderRadius: "9999px",
            fontSize: "13px",
          },
          iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
        });
      } else {
        toast("Meeting recording saved to cloud", {
          icon: "💾",
          style: {
            background: "#ffffff",
            color: "#142417",
            borderRadius: "9999px",
            fontSize: "13px",
          },
        });
      }
      return next;
    });
  };

  const handleSendReaction = (emoji: string) => {
    if (onSendReaction) {
      onSendReaction(emoji);
    }
    setShowReactions(false);
  };

  return (
    <div className="fixed bottom-2.5 sm:bottom-6 left-1/2 z-40 -translate-x-1/2 max-w-[98vw] px-1 pointer-events-auto">
      {/* Reactions Floating Popup Menu */}
      {showReactions && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 rounded-full bg-[#081307]/95 border border-emerald-800/60 px-3 py-1.5 backdrop-blur-xl shadow-2xl animate-fade-in z-50">
          {["👍", "❤️", "👏", "🎉", "🔥", "🚀", "🙌", "😂", "😮", "🤝"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="text-lg sm:text-xl transition-transform hover:scale-135 active:scale-90 cursor-pointer p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Floating Controls Pill */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-[#081307]/85 border border-emerald-900/40 p-2 sm:px-4 sm:py-2.5 backdrop-blur-2xl shadow-2xl shadow-black/60">
        {/* 1. Record Button */}
        <button
          onClick={handleToggleRecord}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${isRecording
            ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
            : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
            }`}
          title={isRecording ? "Stop Recording" : "Record Meeting"}
        >
          <Circle
            className={`h-4 w-4 ${isRecording ? "fill-red-500 text-red-500" : "fill-emerald-400/80 text-emerald-400/80"
              }`}
          />
        </button>

        {/* 2. Microphone Toggle */}
        <button
          onClick={onToggleMute}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${isMuted
            ? "bg-red-500/90 text-white shadow-md shadow-red-900/30"
            : "bg-[#142817] text-white border border-emerald-700/50 hover:bg-[#1e3a22] hover:border-lime-500/50"
            }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <MicOff className="h-4.5 w-4.5" />
          ) : (
            <Mic className="h-4.5 w-4.5 text-[#a3e635]" />
          )}
        </button>

        {/* 3. Camera Toggle */}
        <button
          onClick={onToggleCamera}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${isCameraOff
            ? "bg-red-500/90 text-white shadow-md shadow-red-900/30"
            : "bg-[#142817] text-white border border-emerald-700/50 hover:bg-[#1e3a22] hover:border-lime-500/50"
            }`}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraOff ? (
            <VideoOff className="h-4.5 w-4.5" />
          ) : (
            <Video className="h-4.5 w-4.5 text-[#a3e635]" />
          )}
        </button>

        {/* 4. Screen Share Toggle */}
        <button
          onClick={() => {
            if (isScreenSharing) {
              onToggleScreenShare();
            } else if (isHost || canShareScreen) {
              onToggleScreenShare();
            } else if (onRequestScreenSharePermission) {
              onRequestScreenSharePermission();
            } else {
              toast.error("Screen sharing permission required from the host.");
            }
          }}
          className={`relative hidden sm:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${isScreenSharing
            ? "bg-[#3f6212] text-white border border-lime-400 shadow-md shadow-lime-900/30"
            : !isHost && !canShareScreen
              ? "bg-emerald-950/40 text-emerald-400/60 border border-emerald-900/40 hover:bg-emerald-900/40 hover:text-emerald-200"
              : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
            }`}
          title={
            isScreenSharing
              ? "Stop Sharing Screen"
              : isHost || canShareScreen
                ? "Share Screen"
                : "Share Screen (Permission required from host)"
          }
        >
          <MonitorUp className="h-4.5 w-4.5" />
          {!isHost && !canShareScreen && !isScreenSharing && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/90 text-slate-950 shadow-xs"
              title="Permission required"
            >
              <Lock className="h-2 w-2 text-slate-950 stroke-3
            " />
            </span>
          )}
        </button>

        {/* 5. End Call Pill (Prominent Red) */}
        <button
          onClick={onLeaveMeeting}
          className="flex h-10 sm:h-11 items-center gap-2 rounded-full bg-red-600 px-4 sm:px-5 font-bold text-white shadow-lg shadow-red-950/50 transition-all hover:bg-red-700 active:scale-95 text-xs sm:text-sm"
          title="Leave Call"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="hidden sm:inline">End Call</span>
        </button>

        {/* 6. Transcript Toggle */}
        {onToggleTranscript && (
          <button
            onClick={onToggleTranscript}
            className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${isTranscriptOpen
              ? "bg-[#3f6212] text-white border border-lime-400/50 shadow-md shadow-lime-950/30"
              : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
              }`}
            title="Toggle Live Transcript & Notes"
          >
            <FileText className="h-4.5 w-4.5" />
          </button>
        )}

        {/* 7. Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${isChatOpen
            ? "bg-[#3f6212] text-white border border-lime-400/50 shadow-md shadow-lime-950/30"
            : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
            }`}
          title="In-meeting Chat"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#84cc16] px-1 text-[9px] font-extrabold text-slate-950">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 8. Live Captions (CC) Toggle */}
        {onToggleCaptions && (
          <div className="relative flex items-center">
            <button
              onClick={onToggleCaptions}
              className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer ${
                isCaptionsEnabled
                  ? "bg-[#3f6212] text-white border border-lime-400 shadow-md shadow-lime-950/40"
                  : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
              }`}
              title={isCaptionsEnabled ? "Turn off Live Captions (CC)" : "Turn on Live Captions (CC)"}
            >
              <Subtitles className="h-4.5 w-4.5" />
            </button>
            {isCaptionsEnabled && (
              <span className="absolute -top-1 -right-0.5 flex h-3 w-3 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#84cc16]"></span>
              </span>
            )}
          </div>
        )}

        {/* 9. Captions Language Settings Modal Trigger */}
        {onOpenCaptionsModal && (
          <button
            onClick={onOpenCaptionsModal}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white transition-all cursor-pointer"
            title="Captions & Language Settings (Hindi to English Translation)"
          >
            <Languages className="h-4.5 w-4.5 text-lime-400" />
          </button>
        )}

        {/* 10. Reactions Toggle */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer ${
            showReactions
              ? "bg-[#3f6212] text-white border border-lime-400/50"
              : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
          }`}
          title="Reactions (Send emojis to screen)"
        >
          <Smile className="h-4.5 w-4.5" />
        </button>

        {/* 11. Participants List */}
        <button
          onClick={onToggleParticipants}
          className={`relative hidden md:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all cursor-pointer ${
            isParticipantsOpen
              ? "bg-[#3f6212] text-white border border-lime-400/50"
              : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
          }`}
          title="Participants"
        >
          <Users className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[9px] font-bold text-white">
            {participantCount}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
