import { Clock, LogIn } from "lucide-react";
import type { MeetingParticipant } from "../../types";

interface SessionParticipantsTabProps {
  participants: MeetingParticipant[];
}

const SessionParticipantsTab = ({ participants }: SessionParticipantsTabProps) => {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-brand-600/20 text-brand-400",
      "bg-emerald-600/20 text-emerald-400",
      "bg-amber-600/20 text-amber-400",
      "bg-sky-600/20 text-sky-400",
      "bg-rose-600/20 text-rose-400",
      "bg-violet-600/20 text-violet-400",
    ];
    const index = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-surface-500">No participant data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      {participants.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-xl border border-surface-800 bg-surface-900/40 p-3 transition-all duration-200 hover:bg-surface-900/70"
        >
          {/* Avatar */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getAvatarColor(
              p.fullName
            )}`}
          >
            {getInitials(p.fullName)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="truncate text-sm font-semibold text-surface-100">
              {p.fullName}
            </h4>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-xs text-surface-500">
                <LogIn className="h-3 w-3" />
                Joined {formatTime(p.joinedAt)}
              </div>
              {p.duration && (
                <div className="flex items-center gap-1 text-xs text-surface-500">
                  <Clock className="h-3 w-3" />
                  {p.duration}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionParticipantsTab;
