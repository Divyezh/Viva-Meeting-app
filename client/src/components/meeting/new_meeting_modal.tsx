import { useState } from "react";
import {
  Video,
  X,
  RefreshCw,
  Copy,
  Check,
  User,
  Sparkles,
  Mic,
  MicOff,
  VideoOff,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { saveCreatedMeeting } from "../../utils/session_storage";

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUserName?: string;
}

const generateRandomMeetingId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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

  if (!isOpen) return null;

  const handleRegenerateId = () => {
    const newId = generateRandomMeetingId();
    setMeetingId(newId);
    toast.success("New meeting ID generated", {
      iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
      style: {
        background: "#ffffff",
        color: "#142417",
        border: "1px solid #d1fae5",
        borderRadius: "9999px",
        fontSize: "12px",
      },
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${meetingId}`);
    setCopied(true);
    toast.success("Meeting link copied!", {
      style: {
        background: "#ffffff",
        color: "#142417",
        border: "1px solid #d1fae5",
        borderRadius: "9999px",
        fontSize: "13px",
      },
      iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!meetingId.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }

    localStorage.setItem("meeting_user_name", userName.trim());
    localStorage.setItem(`is_host_${meetingId.trim()}`, "true");

    // Save meeting to real sessions history
    saveCreatedMeeting({
      id: meetingId.trim(),
      title: meetingTitle.trim() || "Product Sync & Standup",
      hostId: "user_host",
      participantCount: 1,
    });

    toast.success(`Starting: ${meetingTitle || "Meeting"}`, {
      style: {
        background: "#ffffff",
        color: "#142417",
        border: "1px solid #d1fae5",
        borderRadius: "9999px",
        boxShadow: "0 10px 25px -5px rgba(63, 98, 18, 0.12)",
        fontSize: "13px",
      },
      iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
    });

    onClose();
    navigate(`/meeting/${meetingId.trim()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 text-slate-900 shadow-2xl shadow-emerald-950/15 backdrop-blur-2xl z-10 animate-scale-up">
        {/* Ambient Top Luminous Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full bg-linear-to-b from-emerald-200/40 via-lime-200/20 to-transparent blur-3xl opacity-80" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/10 pb-4 mb-6 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#3f6212] to-[#65a30d] shadow-md shadow-lime-900/20">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Start a New Meeting
                </h2>
                <span className="rounded-full bg-emerald-100/70 px-2.5 py-0.5 text-[10px] font-bold text-[#3f6212] border border-emerald-200/80">
                  Instant Call
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure your meeting details and pre-join preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStartMeeting} className="space-y-4.5 relative">
          {/* 1. Your Display Name */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4d7c0f]" />
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-2xl bg-[#f8fcf8] border border-emerald-900/15 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#3f6212] focus:ring-3 focus:ring-[#3f6212]/10 shadow-2xs"
              />
            </div>
          </div>

          {/* 2. Meeting Title / Topic */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Meeting Title
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65a30d]" />
              <input
                type="text"
                required
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Sprint Review, Client Demo"
                className="w-full rounded-2xl bg-[#f8fcf8] border border-emerald-900/15 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#3f6212] focus:ring-3 focus:ring-[#3f6212]/10 shadow-2xs"
              />
            </div>
          </div>

          {/* 3. Meeting Code / Room ID */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Meeting Code (Room ID)
              </label>
              <button
                type="button"
                onClick={handleRegenerateId}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#4d7c0f] hover:text-[#365314] hover:underline"
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
                className="font-mono flex-1 rounded-2xl bg-[#f8fcf8] border border-emerald-900/15 py-3 px-4 text-sm font-semibold text-[#142417] placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#3f6212] focus:ring-3 focus:ring-[#3f6212]/10 shadow-2xs"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-[#3f6212] hover:bg-emerald-100 hover:text-[#1e3820] active:scale-95 transition-all shadow-2xs"
                title="Copy Meeting Link"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 4. Pre-Join Media Preferences */}
          <div className="pt-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Pre-Join Preferences
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                  isMicMuted
                    ? "bg-red-50/70 border-red-200 text-red-800 shadow-2xs"
                    : "bg-emerald-50/70 border-emerald-200 text-[#142417] hover:border-[#65a30d] shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isMicMuted ? (
                    <MicOff className="h-4 w-4 text-red-600" />
                  ) : (
                    <Mic className="h-4 w-4 text-[#4d7c0f]" />
                  )}
                  <span className="text-xs font-bold">
                    {isMicMuted ? "Mic Muted" : "Mic Active"}
                  </span>
                </div>
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={() => setIsCameraOff(!isCameraOff)}
                className={`flex items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                  isCameraOff
                    ? "bg-red-50/70 border-red-200 text-red-800 shadow-2xs"
                    : "bg-emerald-50/70 border-emerald-200 text-[#142417] hover:border-[#65a30d] shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isCameraOff ? (
                    <VideoOff className="h-4 w-4 text-red-600" />
                  ) : (
                    <Video className="h-4 w-4 text-[#4d7c0f]" />
                  )}
                  <span className="text-xs font-bold">
                    {isCameraOff ? "Camera Off" : "Camera On"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 5. Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-emerald-900/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full bg-[#3f6212] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-lime-900/20 hover:bg-[#365314] active:scale-95 transition-all"
            >
              Start Meeting
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewMeetingModal;
