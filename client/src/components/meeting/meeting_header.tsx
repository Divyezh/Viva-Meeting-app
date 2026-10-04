import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import BrandLogo from "../brand_logo";

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
  hostName,
  participantCount = 1,
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

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Meeting link copied to clipboard!", {
      duration: 3000,
      style: {
        background: "#202124",
        color: "#ffffff",
        border: "1px solid #3c4043",
      },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="relative z-20 flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-6 bg-[#202124] border-b border-[#3c4043]">
      {/* ─── Left Section: Logo & Meeting Title ─── */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <Link
          to="/"
          title="Back to Dashboard"
          className="flex items-center gap-2 group shrink-0"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#2d2f34] border border-[#3c4043] shadow-sm group-hover:border-[#5f6368] transition-colors">
            <BrandLogo className="h-5 w-5" color="#ffffff" />
          </div>
          <span className="hidden text-base font-semibold tracking-tight text-white sm:inline-block">
            VIVA
          </span>
        </Link>

        <div className="h-5 w-px bg-[#3c4043] hidden sm:block shrink-0" />

        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-medium text-white tracking-tight truncate flex items-center gap-2">
            <span>{meetingTitle}</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Active Meeting" />
          </h1>
          <p className="text-[11px] text-[#9aa0a6] font-mono truncate">
            {roomId} <span className="hidden md:inline">· {formattedDate}</span>
          </p>
        </div>
      </div>

      {/* ─── Center/Right Section: Live Participant Count (Visible to ALL participants) & Copy Link ─── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Participant Count Pill: Clickable by EVERY participant to open People panel */}
        <button
          onClick={onToggleParticipants}
          className="flex items-center gap-1.5 sm:gap-2 rounded-md bg-[#2d2f34] hover:bg-[#3c4043] border border-[#3c4043] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
          title="View all participants in this call"
        >
          <Users className="h-3.5 w-3.5 text-[#8ab4f8]" />
          <span className="font-medium text-white">
            {participantCount}
          </span>
          <span className="hidden md:inline text-[#9aa0a6]">
            {participantCount === 1 ? "participant" : "participants"}
          </span>
        </button>

        {/* Copy Meeting Link Pill */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 rounded-md bg-[#2d2f34] hover:bg-[#3c4043] border border-[#3c4043] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white transition-colors active:scale-95 cursor-pointer shadow-sm"
          title="Copy meeting link to share with others"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-[#9aa0a6]" />
              <span className="hidden sm:inline">Copy Link</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default MeetingHeader;
