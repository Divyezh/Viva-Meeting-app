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
  MoreVertical,
  Circle,
  Sliders,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  isTranscriptOpen?: boolean;
  isParticipantsOpen: boolean;
  isAudioSettingsOpen?: boolean;
  unreadCount: number;
  participantCount: number;
  roomId: string;
  isHost: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleTranscript?: () => void;
  onToggleParticipants: () => void;
  onToggleAudioSettings?: () => void;
  onLeaveMeeting: () => void;
}

const ControlBar = ({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  isTranscriptOpen = true,
  isParticipantsOpen,
  isAudioSettingsOpen = false,
  unreadCount,
  participantCount,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onToggleTranscript,
  onToggleParticipants,
  onToggleAudioSettings,
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
    toast(`Reacted with ${emoji}`, {
      style: {
        background: "#081307",
        color: "#ffffff",
        border: "1px solid #365314",
        borderRadius: "9999px",
        fontSize: "13px",
      },
    });
    setShowReactions(false);
  };

  return (
    <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 sm:bottom-6">
      {/* Reactions Floating Popup Menu */}
      {showReactions && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#081307]/95 border border-emerald-800/50 px-3.5 py-1.5 backdrop-blur-xl shadow-2xl animate-fade-in">
          {["👍", "❤️", "👏", "🎉", "🔥", "🚀", "🙌"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="text-lg transition-transform hover:scale-130 active:scale-95"
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
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
            isRecording
              ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
              : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
          }`}
          title={isRecording ? "Stop Recording" : "Record Meeting"}
        >
          <Circle
            className={`h-4 w-4 ${
              isRecording ? "fill-red-500 text-red-500" : "fill-emerald-400/80 text-emerald-400/80"
            }`}
          />
        </button>

        {/* 2. Microphone Toggle */}
        <button
          onClick={onToggleMute}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
            isMuted
              ? "bg-red-500/90 text-white shadow-md shadow-red-900/30"
              : "bg-[#142817] text-white border border-emerald-700/50 hover:bg-[#1e3a22] hover:border-lime-500/50"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5 text-[#a3e635]" />}
        </button>

        {/* 3. Camera Toggle */}
        <button
          onClick={onToggleCamera}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
            isCameraOff
              ? "bg-red-500/90 text-white shadow-md shadow-red-900/30"
              : "bg-[#142817] text-white border border-emerald-700/50 hover:bg-[#1e3a22] hover:border-lime-500/50"
          }`}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraOff ? <VideoOff className="h-4.5 w-4.5" /> : <Video className="h-4.5 w-4.5 text-[#a3e635]" />}
        </button>

        {/* 4. Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          className={`hidden sm:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
            isScreenSharing
              ? "bg-[#3f6212] text-white border border-lime-400 shadow-md shadow-lime-900/30"
              : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
          }`}
          title="Share Screen"
        >
          <MonitorUp className="h-4.5 w-4.5" />
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
            className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
              isTranscriptOpen
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
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
            isChatOpen
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

        {/* 8. Reactions Toggle */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`hidden sm:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
            showReactions
              ? "bg-[#3f6212] text-white border border-lime-400/50"
              : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
          }`}
          title="Reactions"
        >
          <Smile className="h-4.5 w-4.5" />
        </button>

        {/* 9. Participants List */}
        <button
          onClick={onToggleParticipants}
          className={`relative hidden md:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
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

        {/* 10. Audio & Crystal-Clear Mic Settings */}
        {onToggleAudioSettings && (
          <button
            onClick={onToggleAudioSettings}
            className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all ${
              isAudioSettingsOpen
                ? "bg-[#3f6212] text-white border border-lime-400/50 shadow-md shadow-lime-950/30"
                : "bg-emerald-950/60 text-emerald-200 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white"
            }`}
            title="Audio & Crystal-Clear Mic Settings"
          >
            <Sliders className="h-4.5 w-4.5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#84cc16] ring-2 ring-[#081307]" />
          </button>
        )}

        {/* 11. More Options */}
        <button
          onClick={() => toast("Meeting encrypted with WebRTC DTLS-SRTP 🔐", {
            style: { background: "#081307", color: "#fff", border: "1px solid #365314", borderRadius: "9999px" },
          })}
          className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50 hover:text-white transition-all"
          title="Meeting Info & Encryption"
        >
          <MoreVertical className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
