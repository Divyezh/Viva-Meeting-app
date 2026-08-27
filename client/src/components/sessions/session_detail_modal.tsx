import { useState } from "react";
import { X, MessageSquare, Users, Calendar, Clock } from "lucide-react";
import type { SessionDetail } from "../../types";

interface SessionDetailModalProps {
  detail: SessionDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const SessionDetailModal = ({ detail, isOpen, onClose }: SessionDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");

  if (!isOpen || !detail) return null;

  const shortId = detail.meeting.id.split("-").slice(0, 3).join("-").slice(0, 11);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl shadow-black/10 animate-scale-in sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-surface-100 px-2.5 py-1 font-mono text-[10px] text-surface-500">
                {shortId}
              </span>
              <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-semibold text-surface-500">
                Ended
              </span>
            </div>
            <h2 className="mb-1 text-xl font-bold text-surface-900">
              {detail.meeting.title}
            </h2>
            <p className="text-xs text-surface-400">
              Host: Divyesh Soni · Created {formatDate(detail.meeting.createdAt)}{" "}
              · Duration: {detail.meeting.duration || "45 min"}
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-5 flex border-b border-surface-100">
            {[
              { key: "chat" as const, label: "Chat Transcript", icon: MessageSquare, count: detail.messages.length },
              { key: "participants" as const, label: "Participants Log", icon: Users, count: detail.participants.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "border-brand-600 text-brand-600"
                    : "border-transparent text-surface-400 hover:text-surface-600"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-80 overflow-y-auto">
            {activeTab === "chat" ? (
              <div className="space-y-3">
                {detail.messages.map((msg) => (
                  <div key={msg.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-surface-800">
                        {msg.senderName}
                      </span>
                      <span className="text-[11px] text-surface-400">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <div className="rounded-xl bg-surface-50 px-4 py-2.5 text-sm text-surface-600">
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {detail.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl bg-surface-50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {getInitials(p.fullName)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-surface-800">
                        {p.fullName}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-surface-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Joined {formatTime(p.joinedAt)}
                        </span>
                        {p.duration && <span>Duration: {p.duration}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionDetailModal;
