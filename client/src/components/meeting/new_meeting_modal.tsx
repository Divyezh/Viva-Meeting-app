import { useState } from "react";
import {
  X,
  RefreshCw,
  Copy,
  Check,
  User,
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { saveCreatedMeeting } from "../../utils/session_storage";
import BrandLogo from "../brand_logo";

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUserName?: string;
}

const generateRandomMeetingId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const part1 = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const part2 = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const part3 = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `${part1}-${part2}-${part3}`;
};

const NewMeetingModal = ({
  isOpen,
  onClose,
  defaultUserName = "Divyesh Soni",
}: NewMeetingModalProps) => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState(defaultUserName);
  const [meetingTitle, setMeetingTitle] = useState("Product Sync & Standup");
  const [meetingId, setMeetingId] = useState(generateRandomMeetingId);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  if (!isOpen) return null;

  const handleRegenerateId = () => {
    setMeetingId(generateRandomMeetingId());
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/meeting/${meetingId.trim()}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Meeting link copied to clipboard!", {
      style: {
        background: "#242424",
        color: "#f3f4f6",
        border: "1px solid #383838",
      },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLaunching) return;

    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!meetingId.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }

    setIsLaunching(true);

    const cleanId = meetingId.trim();
    localStorage.setItem("meeting_user_name", userName.trim());
    localStorage.setItem(`is_host_${cleanId}`, "true");
    localStorage.setItem("prejoin_muted", isMicMuted ? "true" : "false");
    localStorage.setItem("prejoin_camera_off", isCameraOff ? "true" : "false");

    // Save meeting to real sessions history
    saveCreatedMeeting({
      id: cleanId,
      title: meetingTitle.trim() || "Product Sync & Standup",
      hostId: "user_host",
      participantCount: 1,
    });

    toast.success(`Starting: ${meetingTitle || "Meeting"}`, {
      style: {
        background: "#242424",
        color: "#f3f4f6",
        border: "1px solid #383838",
      },
    });

    setTimeout(() => {
      onClose();
      navigate(`/meeting/${cleanId}?host=true`);
    }, 160);
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
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Start a New Meeting
                </h2>
                <span className="rounded-full bg-[#2a2a2a] px-2.5 py-0.5 text-[10px] font-medium text-[#10b981] border border-[#383838]">
                  Instant Call
                </span>
              </div>
              <p className="text-xs text-[#9ca3af] font-normal mt-0.5">
                Configure your meeting details and pre-join preferences
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
        <form onSubmit={handleStartMeeting} className="space-y-4.5 relative">
          {/* 1. Your Display Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
              Your Name
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

          {/* 2. Meeting Title / Topic */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
              Meeting Title
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10b981]" />
              <input
                type="text"
                required
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Sprint Review, Client Demo"
                className="w-full rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-[#9ca3af] outline-none transition-colors focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* 3. Meeting Code / Room ID */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
                Meeting Code (Room ID)
              </label>
              <button
                type="button"
                onClick={handleRegenerateId}
                className="flex items-center gap-1 text-[11px] font-medium text-[#10b981] hover:text-[#34d399] transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate ID
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                placeholder="abc-def-ghi"
                className="font-mono flex-1 rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 px-4 text-sm font-semibold text-white placeholder:text-[#9ca3af] outline-none transition-colors focus:border-[#10b981]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2a2a2a] border border-[#383838] text-[#10b981] hover:bg-[#333333] hover:text-[#34d399] active:scale-95 transition-all cursor-pointer"
                title="Copy Meeting Link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[#10b981]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* 4. Pre-Join Media Preferences */}
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

          {/* 5. Footer Actions */}
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
              disabled={isLaunching}
              className="flex items-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] px-6 py-2.5 text-xs sm:text-sm font-medium text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-75"
            >
              {isLaunching ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Launching Meeting...</span>
                </>
              ) : (
                <>
                  <span>Start Meeting</span>
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

export default NewMeetingModal;
