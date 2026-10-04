import { useState, useEffect } from "react";
import { ArrowLeft, History, Users, MessageSquare, Calendar, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import usePageSEO from "../hooks/usePageSEO";
import { getSavedMeetings, deleteSavedMeeting } from "../utils/session_storage";
import NewMeetingModal from "../components/meeting/new_meeting_modal";
import SessionDetailModal from "../components/sessions/session_detail_modal";
import type { Meeting, SessionDetail } from "../types";
import api from "../config/api";

const Sessions = () => {
  usePageSEO({
    title: "Meeting History & Sessions | Viva Meeting",
    description:
      "Review your past video conference sessions, participant logs, and chat notes on Viva Meeting.",
    canonicalPath: "/sessions",
  });

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Meeting[]>(() => getSavedMeetings());
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    api
      .get("/sessions")
      .then((response) => {
        if (ignore) return;
        if (response.data && response.data.success) {
          const dbSessions: Meeting[] = response.data.data.map((item: Record<string, unknown>) => ({
            id: String(item.id || ""),
            title: String(item.title || "Meeting Session"),
            hostId: String(item.host_id || ""),
            status: item.status === "active" ? "active" : "ended",
            createdAt: String(item.created_at || new Date().toISOString()),
            endedAt: item.ended_at ? String(item.ended_at) : undefined,
            participantCount: parseInt(String(item.participant_count || 1), 10) || 1,
            duration:
              typeof item.duration === "string"
                ? item.duration
                : item.status === "active"
                  ? "Active"
                  : "Ended",
          }));

          const local = getSavedMeetings();
          const merged = [...dbSessions];
          local.forEach((loc) => {
            if (!merged.some((m) => m.id === loc.id)) {
              merged.push(loc);
            }
          });
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem("viva_meeting_sessions", JSON.stringify(merged));
          setSessions(merged);
        }
      })
      .catch((err) => {
        console.warn("Failed to synchronize with meeting server, showing offline storage:", err);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

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
          setRefreshKey((k) => k + 1);
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#9ca3af] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Go to Dashboard
          </Link>

          <button
            onClick={() => setIsNewMeetingModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] px-4 py-2 text-xs font-medium text-white shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Meeting
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Meeting sessions.
          </h1>
          <p className="max-w-xl text-sm text-[#9ca3af] sm:text-base">
            Review your past and active meeting history, participant logs, and chat transcripts.
          </p>
        </div>

        {/* Session Cards Grid */}
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#242424] border border-[#383838] py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2a2a2a] border border-[#383838] text-[#10b981]">
              <History className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-base font-bold text-white">
              {isLoading ? "Synchronizing sessions..." : "No sessions recorded yet"}
            </h3>
            <p className="max-w-xs text-xs text-[#9ca3af] mb-6">
              {isLoading
                ? "Checking server database for your meetings history..."
                : "Your meeting history will appear here once you host or join your first video call."}
            </p>
            {!isLoading && (
              <button
                onClick={() => setIsNewMeetingModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] px-5 py-2.5 text-xs font-medium text-white shadow-md active:scale-95 transition-all cursor-pointer"
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
    <div className="group flex flex-col justify-between rounded-2xl bg-[#242424] border border-[#383838] p-5 transition-all duration-150 hover:border-[#4a4a4a]">
      <div>
        {/* Top: ID Badge + Status Badge */}
        <div className="mb-3.5 flex items-center justify-between">
          <span className="rounded-md bg-[#1e1e1e] border border-[#383838] px-2.5 py-1 font-mono text-[10px] font-medium text-[#9ca3af]">
            ID: {shortId}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
              session.status === "active"
                ? "bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40"
                : "bg-[#2a2a2a] text-[#9ca3af]"
            }`}
          >
            {session.status === "active" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
            )}
            {session.status === "active" ? "Live" : "Ended"}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-1.5 truncate text-base font-bold text-white">{session.title}</h3>

        {/* Date/Time */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-[#9ca3af]">
          <Calendar className="h-3.5 w-3.5 text-[#9ca3af]" />
          <span>
            {formatDate(session.createdAt)} · {formatTime(session.createdAt)}
          </span>
        </div>

        {/* Two Stat Chips Side by Side */}
        <div className="mb-5 flex items-center gap-2">
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1e1e1e] border border-[#383838] py-2 text-xs font-medium text-[#d1d5db]">
            <Users className="h-3.5 w-3.5 text-[#10b981]" />
            <span>{session.participantCount} Participants</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1e1e1e] border border-[#383838] py-2 text-xs font-medium text-[#d1d5db]">
            <MessageSquare className="h-3.5 w-3.5 text-[#10b981]" />
            <span>Messages</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onViewDetails}
          className="flex-1 rounded-full bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] py-2 text-xs font-medium text-white transition-colors cursor-pointer"
        >
          View Details
        </button>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] border border-[#383838] text-[#ea4335] hover:bg-[#ea4335] hover:text-white transition-colors cursor-pointer"
          title="Delete Session"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Sessions;
