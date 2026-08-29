import { useState, useEffect } from "react";
import { ArrowLeft, History, Users, MessageSquare, Calendar, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getSavedMeetings, deleteSavedMeeting } from "../utils/session_storage";
import NewMeetingModal from "../components/meeting/new_meeting_modal";
import SessionDetailModal from "../components/sessions/session_detail_modal";
import type { Meeting, SessionDetail } from "../types";
import api from "../config/api";

const Sessions = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Meeting[]>([]);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    // 1. Get from localStorage as baseline immediately
    const local = getSavedMeetings();
    setSessions(local);

    // 2. Fetch from backend database (if online/authenticated) and merge
    try {
      const response = await api.get("/sessions");
      if (response.data && response.data.success) {
        const dbSessions: Meeting[] = response.data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          hostId: item.host_id,
          status: item.status,
          createdAt: item.created_at,
          endedAt: item.ended_at,
          participantCount: parseInt(item.participant_count, 10) || 1,
          duration: item.duration || (item.status === "active" ? "Active" : "Ended"),
        }));

        // Merge, prioritizing database sessions
        const merged = [...dbSessions];
        local.forEach((loc) => {
          if (!merged.some((m) => m.id === loc.id)) {
            merged.push(loc);
          }
        });

        // Sort by creation date descending
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Sync local storage with merged truth
        localStorage.setItem("viva_meeting_sessions", JSON.stringify(merged));
        setSessions(merged);
      }
    } catch (err) {
      console.warn("Failed to synchronize with meeting server, showing offline storage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

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

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const loadingToast = toast.loading("Deleting meeting session...");

    try {
      // 1. Delete on backend
      await api.delete(`/sessions/${sessionId}`);
    } catch (err) {
      console.warn("Failed to delete session on server (local-only session):", err);
    }

    // 2. Delete on client (localStorage)
    deleteSavedMeeting(sessionId);

    // 3. Update view
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast.success("Meeting session deleted successfully", { id: loadingToast });
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0] || null;
  const sessionDetail: SessionDetail | null = selectedSession
    ? {
        meeting: selectedSession,
        participants: [
          {
            id: "p1",
            meetingId: selectedSession.id,
            userId: selectedSession.hostId || "user_host",
            fullName: selectedSession.hostName || "Meeting Host",
            avatarUrl: "",
            joinedAt: selectedSession.createdAt,
            duration: selectedSession.duration || "Active",
          },
        ],
        messages: [],
      }
    : null;

  return (
    <div className="w-full py-8 md:py-12">
      <Toaster position="top-center" />

      {/* New Meeting Modal */}
      <NewMeetingModal
        isOpen={isNewMeetingModalOpen}
        onClose={() => {
          setIsNewMeetingModalOpen(false);
          fetchSessions();
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => setIsNewMeetingModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#3f6212] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#365314] active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New Meeting
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Meeting sessions.
          </h1>
          <p className="max-w-xl text-sm text-slate-500 sm:text-base">
            Review your past and active meeting history, participant logs, and chat transcripts.
          </p>
        </div>

        {/* Session Cards Grid */}
        {sessions.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center rounded-3xl py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#4d7c0f]">
              <History className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">
              {isLoading ? "Synchronizing sessions..." : "No sessions recorded yet"}
            </h3>
            <p className="max-w-xs text-xs text-slate-400 mb-6">
              {isLoading
                ? "Checking server database for your meetings history..."
                : "Your meeting history will appear here once you host or join your first video call."}
            </p>
            {!isLoading && (
              <button
                onClick={() => setIsNewMeetingModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#3f6212] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#365314] active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                Start a New Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                formatDate={formatDate}
                formatTime={formatTime}
                onViewDetails={() => setSelectedSessionId(session.id)}
                onDelete={(e) => handleDelete(session.id, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {sessionDetail && (
        <SessionDetailModal
          detail={sessionDetail}
          isOpen={selectedSessionId !== null}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
};

/* ─── Session Card Component ─── */
interface SessionCardProps {
  session: Meeting;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  onViewDetails: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const SessionCard = ({
  session,
  formatDate,
  formatTime,
  onViewDetails,
  onDelete,
}: SessionCardProps) => {
  const shortId = session.id.split("-").slice(0, 3).join("-").slice(0, 11);

  return (
    <div className="glass-panel group flex flex-col justify-between rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5">
      <div>
        {/* Top: ID Badge + Status Badge */}
        <div className="mb-3.5 flex items-center justify-between">
          <span className="rounded-full bg-emerald-50/80 border border-emerald-100/60 px-2.5 py-1 font-mono text-[10px] font-medium text-slate-600">
            ID: {shortId}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              session.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {session.status === "active" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#4d7c0f] animate-pulse" />
            )}
            {session.status === "active" ? "Live" : "Ended"}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-1.5 truncate text-base font-bold text-slate-900">
          {session.title}
        </h3>

        {/* Date/Time */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{formatDate(session.createdAt)} · {formatTime(session.createdAt)}</span>
        </div>

        {/* Two Stat Chips Side by Side */}
        <div className="mb-5 flex items-center gap-2">
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50/40 border border-emerald-100/60 py-2 text-xs font-semibold text-slate-700">
            <Users className="h-3.5 w-3.5 text-[#4d7c0f]" />
            <span>{session.participantCount} Participants</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50/40 border border-emerald-100/60 py-2 text-xs font-semibold text-slate-700">
            <MessageSquare className="h-3.5 w-3.5 text-[#4d7c0f]" />
            <span>6 Messages</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onViewDetails}
          className="flex-1 rounded-full bg-emerald-50/80 border border-emerald-100/60 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-[#3f6212] hover:text-white active:scale-95"
        >
          View Details
        </button>
        <button
          onClick={onDelete}
          className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-600 transition-all hover:bg-red-600 hover:text-white active:scale-95"
          title="Delete Session"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Sessions;
