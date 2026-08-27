import { Calendar, Clock, Users, ChevronRight } from "lucide-react";
import type { Meeting } from "../../types";

interface SessionCardProps {
  session: Meeting;
  onViewDetails: (id: string) => void;
}

const SessionCard = ({ session, onViewDetails }: SessionCardProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="group rounded-xl border border-surface-800 bg-surface-900/50 p-4 transition-all duration-200 hover:border-surface-700 hover:bg-surface-900/80 hover:shadow-lg hover:shadow-surface-950/50 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="mb-2 truncate text-sm font-semibold text-white sm:text-base">
            {session.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Badge */}
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(session.createdAt)}
            </div>
            {/* Time Badge */}
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(session.createdAt)}
            </div>
            {/* Duration */}
            {session.duration && (
              <span className="rounded-md bg-surface-800 px-2 py-0.5 text-xs font-medium text-surface-300">
                {session.duration}
              </span>
            )}
          </div>
        </div>

        {/* Right: Participants + Action */}
        <div className="flex items-center gap-3">
          {/* Participant Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-surface-800 bg-surface-950/50 px-3 py-1.5 text-xs font-medium text-surface-300">
            <Users className="h-3.5 w-3.5 text-brand-400" />
            {session.participantCount}
          </div>

          {/* View Details */}
          <button
            onClick={() => onViewDetails(session.id)}
            className="flex items-center gap-1.5 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-xs font-medium text-surface-300 transition-all duration-200 hover:border-brand-500/40 hover:bg-brand-600/10 hover:text-brand-400"
          >
            View Details
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
