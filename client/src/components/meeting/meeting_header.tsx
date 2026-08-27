import { useState } from "react";
import { Copy, Check, Video, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

interface MeetingHeaderProps {
  roomId: string;
  meetingTitle?: string;
  hostName?: string;
  hostAvatar?: string;
  participantCount?: number;
  participants?: Array<{ id: string; name: string; avatar?: string; role?: string }>;
  onToggleParticipants?: () => void;
}

const MeetingHeader = ({
  roomId,
  meetingTitle = "Product Sync & Standup",
  hostName = "Divyesh Soni",
  hostAvatar,
  participantCount = 1,
  participants = [],
  onToggleParticipants,
}: MeetingHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());

  const meetingUrl = `${window.location.host}/meeting/${roomId.slice(0, 11)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}`);
    setCopied(true);
    toast.success("Meeting link copied to clipboard!", {
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

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="relative z-20 flex h-16 w-full items-center justify-between px-4 sm:px-6 bg-[#081307]/90 backdrop-blur-xl border-b border-emerald-900/30">
      {/* ─── Left Section: Logo & Meeting Title ─── */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          title="Back to Dashboard"
          className="flex items-center gap-2 group transition-transform hover:scale-105"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#3f6212] to-[#65a30d] shadow-md shadow-lime-950/40">
            <Video className="h-5 w-5 text-white" />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-white sm:inline-block">
            VIVA<span className="text-[#84cc16]">.</span>
          </span>
        </Link>

        <div className="h-6 w-px bg-emerald-800/40 hidden sm:block" />

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            {meetingTitle}
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84cc16]"></span>
            </span>
          </h1>
          <p className="text-[11px] text-emerald-200/60 font-medium font-mono">
            ID: {roomId} · {formattedDate}
          </p>
        </div>
      </div>

      {/* ─── Center Section: Host Pill & Participants Stack ─── */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Host Pill */}
        <div className="flex items-center gap-2 rounded-full bg-emerald-950/50 border border-emerald-800/40 py-1 pl-1.5 pr-3 text-xs text-emerald-100 shadow-sm">
          {hostAvatar ? (
            <img
              src={hostAvatar}
              alt={hostName}
              className="h-6 w-6 rounded-full object-cover border border-lime-400/40"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-bold text-emerald-200 border border-lime-400/40">
              {getInitials(hostName)}
            </div>
          )}
          <span className="text-emerald-300/70 text-[11px]">Host:</span>
          <span className="font-semibold text-white text-xs">{hostName}</span>
        </div>

        {/* Participants Pill */}
        <button
          onClick={onToggleParticipants}
          className="flex items-center gap-2 rounded-full bg-emerald-950/50 border border-emerald-800/40 py-1 pl-2 pr-3 text-xs text-emerald-100 shadow-sm transition-colors hover:bg-emerald-900/40 hover:border-emerald-700/50"
        >
          {/* Overlapping Initials Stack */}
          <div className="flex -space-x-1.5 overflow-hidden">
            {participants.slice(0, 3).map((p, i) => (
              <div
                key={p.id || i}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900 text-[10px] font-bold text-emerald-200 ring-2 ring-[#081307] border border-emerald-700/50"
                title={p.name}
              >
                {getInitials(p.name)}
              </div>
            ))}
          </div>
          <span className="font-semibold text-xs text-white">
            {participantCount} {participantCount === 1 ? "Participant" : "Participants"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-emerald-300/70" />
        </button>
      </div>

      {/* ─── Right Section: Clean Copy Meeting ID & Invite Pill ─── */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-full bg-emerald-950/70 border border-emerald-800/60 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-900/60 hover:text-white hover:border-lime-500/50 active:scale-95 shadow-sm"
          title="Copy meeting link to share with others"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-lime-400" />
              <span className="text-lime-300">ID Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#84cc16]" />
              <span className="font-mono text-[11px] text-emerald-100">{roomId}</span>
              <span className="hidden sm:inline-block text-[11px] text-emerald-400/80">· Copy</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default MeetingHeader;
