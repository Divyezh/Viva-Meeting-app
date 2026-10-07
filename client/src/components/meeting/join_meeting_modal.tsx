import { useState, useEffect } from "react";
import { X, User, Keyboard, Mic, MicOff, Video, VideoOff, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import BrandLogo from "../brand_logo";
import socket from "../../config/socket";
import { extractRoomId, prepareGuestJoin, joinMeeting, logJoinTrace } from "../../utils/meetingJoin";

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMeetingId?: string;
  defaultUserName?: string;
}

const JoinMeetingModal = ({
  isOpen,
  onClose,
  initialMeetingId = "",
  defaultUserName = "Divyesh Soni",
}: JoinMeetingModalProps) => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState(defaultUserName);
  const [meetingCode, setMeetingCode] = useState(initialMeetingId);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Pre-warm socket connection as soon as Join modal is opened
  useEffect(() => {
    if (isOpen) {
      logJoinTrace("JoinMeetingModal opened", { initialMeetingId });
      if (!socket.connected) {
        logJoinTrace("JoinMeetingModal pre-warming socket connection");
        socket.connect();
      }
    }
  }, [isOpen, initialMeetingId]);

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    const cleanId = extractRoomId(meetingCode);

    if (!cleanId || cleanId.length < 3) {
      toast.error("Please enter a valid meeting code");
      return;
    }
    if (!userName.trim()) {
      toast.error("Please enter your name to join");
      return;
    }

    setIsJoining(true);
    logJoinTrace("JoinMeetingModal submitted", { cleanId, userName });

    toast.success("Connecting to meeting room...", {
      style: {
        background: "#242424",
        color: "#f3f4f6",
        border: "1px solid #383838",
      },
    });

    joinMeeting({
      roomId: cleanId,
      userName,
      muted: isMicMuted,
      cameraOff: isCameraOff,
      navigate,
      onClose,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-[#242424] border border-[#383838] p-6 sm:p-8 text-white shadow-2xl z-10 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#383838] pb-4 mb-6 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2a2a2a] border border-[#383838] shadow-xs">
              <BrandLogo className="h-6 w-6" color="#10b981" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Join a Meeting</h2>
                <span className="rounded-full bg-[#2a2a2a] px-2.5 py-0.5 text-[10px] font-medium text-[#10b981] border border-[#383838]">
                  Guest / Attendee
                </span>
              </div>
              <p className="text-xs text-[#9ca3af] font-normal mt-0.5">
                Enter your details to request admission to the call
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#333333] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleJoin} className="space-y-4.5 relative">
          {/* 1. Meeting Code Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
              Meeting Code or Invite Link
            </label>
            <div className="relative">
              <Keyboard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10b981]" />
              <input
                type="text"
                required
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                placeholder="e.g. abc-def-ghi or full URL"
                className="w-full rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-[#9ca3af] outline-none transition-colors focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* 2. Your Display Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
              Your Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10b981]" />
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-[#9ca3af] outline-none transition-colors focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* 3. Pre-Join Media Preferences */}
          <div className="pt-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
              Pre-Join Preferences
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  isMicMuted
                    ? "bg-[#2a2a2a] border-[#383838] text-[#ea4335]"
                    : "bg-[#2a2a2a] border-[#383838] text-white hover:border-[#4a4a4a]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isMicMuted ? (
                    <MicOff className="h-4 w-4 text-[#ea4335]" />
                  ) : (
                    <Mic className="h-4 w-4 text-[#10b981]" />
                  )}
                  <span className="text-xs font-medium">
                    {isMicMuted ? "Mic Muted" : "Mic Active"}
                  </span>
                </div>
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  isCameraOff
                    ? "bg-[#2a2a2a] border-[#383838] text-[#ea4335]"
                    : "bg-[#2a2a2a] border-[#383838] text-white hover:border-[#4a4a4a]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isCameraOff ? (
                    <VideoOff className="h-4 w-4 text-[#ea4335]" />
                  ) : (
                    <Video className="h-4 w-4 text-[#10b981]" />
                  )}
                  <span className="text-xs font-medium">
                    {isCameraOff ? "Camera Off" : "Camera On"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-medium text-[#9ca3af] hover:bg-[#333333] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isJoining}
              className="flex items-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] px-6 py-2.5 text-xs sm:text-sm font-medium text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-75"
            >
              {isJoining ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Join Meeting</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinMeetingModal;
