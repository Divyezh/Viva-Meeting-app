import { CalendarX2, Video } from "lucide-react";

const EmptySessions = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-surface-800 bg-surface-900/50">
          <CalendarX2 className="h-12 w-12 text-surface-600" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border border-surface-800 bg-surface-900">
          <Video className="h-5 w-5 text-surface-700" />
        </div>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-surface-200">
        No sessions recorded yet
      </h3>
      <p className="max-w-sm text-sm text-surface-500">
        Your meeting history will appear here once you host or join your first
        video call. Start a new meeting to get going!
      </p>
    </div>
  );
};

export default EmptySessions;
