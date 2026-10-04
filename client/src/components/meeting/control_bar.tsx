import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  PhoneOff,
  Smile,
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
  onToggleParticipants,
  onToggleCaptions,
  onOpenCaptionsModal,
  onSendReaction,
  onLeaveMeeting,
}: ControlBarProps) => {
  const [showReactions, setShowReactions] = useState(false);

  const handleSendReaction = (emoji: string) => {
    if (onSendReaction) {
      onSendReaction(emoji);
    }
    setShowReactions(false);
  };

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 z-40 -translate-x-1/2 max-w-[98vw] px-1 pointer-events-auto">
      {/* Reactions Floating Popup Menu */}
      {showReactions && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 rounded-full bg-[#202124] border border-[#3c4043] px-3 py-1.5 shadow-2xl animate-fade-in z-50">
          {["👍", "❤️", "👏", "🎉", "🔥", "🚀", "🙌", "😂", "😮", "🤝"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendReaction(emoji)}
              className="text-lg sm:text-xl transition-transform hover:scale-125 active:scale-95 cursor-pointer p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Floating Controls Pill: Google Meet / Zoom style neutral dark dock */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-[#202124] border border-[#3c4043] p-1.5 sm:px-3 sm:py-2 shadow-xl shadow-black/40">
        {/* 1. Microphone Toggle */}
        <button
          onClick={onToggleMute}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
            isMuted
              ? "bg-[#ea4335] text-white hover:bg-[#d93025]"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <MicOff className="h-4.5 w-4.5" />
          ) : (
            <Mic className="h-4.5 w-4.5" />
          )}
        </button>

        {/* 2. Camera Toggle */}
        <button
          onClick={onToggleCamera}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
            isCameraOff
              ? "bg-[#ea4335] text-white hover:bg-[#d93025]"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraOff ? (
            <VideoOff className="h-4.5 w-4.5" />
          ) : (
            <Video className="h-4.5 w-4.5" />
          )}
        </button>

        {/* 3. Screen Share Toggle */}
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
          className={`relative hidden sm:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
            isScreenSharing
              ? "bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
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
              className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-slate-950"
              title="Permission required"
            >
              <Lock className="h-2 w-2 text-slate-950 stroke-3" />
            </span>
          )}
        </button>

        {/* 4. Live Captions (CC) Toggle */}
        {onToggleCaptions && (
          <button
            onClick={onToggleCaptions}
            className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
              isCaptionsEnabled
                ? "bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]"
                : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
            }`}
            title={isCaptionsEnabled ? "Turn off Live Captions" : "Turn on Live Captions"}
          >
            <Subtitles className="h-4.5 w-4.5" />
          </button>
        )}

        {/* 5. Captions Language Settings Modal Trigger */}
        {onOpenCaptionsModal && (
          <button
            onClick={onOpenCaptionsModal}
            className="hidden sm:flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#3c4043] text-white hover:bg-[#474a4d] transition-colors cursor-pointer"
            title="Captions & Translation Settings"
          >
            <Languages className="h-4.5 w-4.5" />
          </button>
        )}

        {/* 6. Reactions Toggle */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
            showReactions
              ? "bg-[#8ab4f8] text-[#202124]"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
          title="Reactions"
        >
          <Smile className="h-4.5 w-4.5" />
        </button>

        {/* 7. In-Meeting Chat Toggle */}
        <button
          onClick={onToggleChat}
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
            isChatOpen
              ? "bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
          title="In-meeting Chat"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 8. Participants (Visible to EVERYONE - guest & host) */}
        <button
          onClick={onToggleParticipants}
          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
            isParticipantsOpen
              ? "bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa]"
              : "bg-[#3c4043] text-white hover:bg-[#474a4d]"
          }`}
          title={`Participants (${participantCount})`}
        >
          <Users className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1a73e8] px-1 text-[9px] font-medium text-white">
            {participantCount}
          </span>
        </button>

        {/* 9. End Call Button (The ONLY red/warning button in the dock) */}
        <button
          onClick={onLeaveMeeting}
          className="flex h-10 sm:h-11 items-center gap-2 rounded-full bg-[#ea4335] hover:bg-[#d93025] px-4 sm:px-5 font-medium text-white shadow-sm transition-colors active:scale-95 text-xs sm:text-sm cursor-pointer ml-1"
          title="Leave Meeting"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
