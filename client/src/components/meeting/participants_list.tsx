import { Mic, MicOff, Video, VideoOff, X } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isLocal?: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  onClose: () => void;
}

const ParticipantsList = ({ participants, onClose }: ParticipantsListProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-surface-900">
          Participants ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl bg-surface-50 px-3 py-2.5 transition-colors hover:bg-surface-100/70"
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {getInitials(p.name)}
            </div>

            {/* Name */}
            <span className="flex-1 truncate text-sm font-medium text-surface-800">
              {p.name}
              {p.isLocal && (
                <span className="ml-1 text-xs font-normal text-surface-400">(You)</span>
              )}
            </span>

            {/* Device State Icons */}
            <div className="flex items-center gap-1.5">
              {p.isMuted ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <MicOff className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-100 text-surface-600">
                  <Mic className="h-3.5 w-3.5" />
                </span>
              )}
              {p.isCameraOff ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <VideoOff className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-100 text-surface-600">
                  <Video className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantsList;
