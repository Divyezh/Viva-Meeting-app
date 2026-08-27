import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  FileText,
  MessageSquare,
  Sparkles,
  Users,
  Send,
  X,
  Smile,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Search,
  UserPlus,
  VolumeX,
} from "lucide-react";
import toast from "react-hot-toast";
import type { ChatMessage } from "../../types";

interface TranscriptEntry {
  id: string;
  speaker: string;
  avatar?: string;
  time: string;
  text: string;
  highlightedText?: string;
  noteBadge?: string;
  reactions?: string[];
}

export interface ParticipantItem {
  id: string;
  name: string;
  avatar?: string;
  role: "host" | "participant";
  isMuted: boolean;
  isCameraOff: boolean;
  isLocal?: boolean;
}

interface TranscriptPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  initialTab?: "transcript" | "chat" | "notes" | "participants";
  participants?: ParticipantItem[];
  roomId?: string;
}

const TranscriptPanel = ({
  messages,
  currentUserId,
  onSendMessage,
  onClose,
  initialTab = "chat",
  participants = [],
  roomId = "",
}: TranscriptPanelProps) => {
  const [activeTab, setActiveTab] = useState<"transcript" | "chat" | "notes" | "participants">(initialTab);
  const [chatInput, setChatInput] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [notes, setNotes] = useState<string[]>([
    "Real-time peer-to-peer WebRTC connection active",
    "Screen sharing and in-call chat synchronized",
  ]);
  const [newNote, setNewNote] = useState("");

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

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleSendChat = () => {
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes((prev) => [...prev, newNote.trim()]);
      setNewNote("");
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}`);
    toast.success("Invite link copied to clipboard!", {
      style: {
        background: "#ffffff",
        color: "#142417",
        border: "1px solid #d1fae5",
        borderRadius: "9999px",
        fontSize: "13px",
      },
      iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
    });
  };

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  return (
    <aside className="flex h-full w-full flex-col bg-[#0b160d]/95 backdrop-blur-2xl border-l border-emerald-900/40 text-slate-100 shadow-2xl">
      {/* ─── Panel Top Header ─── */}
      <div className="flex items-center justify-between border-b border-emerald-900/30 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-tight text-white capitalize">
            {activeTab === "participants" ? "People in Call" : activeTab}
          </h2>
          {activeTab === "participants" && (
            <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-800/40">
              {participants.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-900/50 hover:text-white"
            title="Invite more people"
          >
            <UserPlus className="h-3 w-3" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-emerald-400/80 hover:bg-emerald-900/40 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Tab Segment Controls ─── */}
      <div className="flex border-b border-emerald-900/30 bg-[#08120a]/60 px-3 py-2">
        <div className="grid w-full grid-cols-4 gap-1 rounded-2xl bg-[#0a170d] p-1 border border-emerald-900/40">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
              activeTab === "chat"
                ? "bg-[#3f6212] text-white shadow-xs"
                : "text-emerald-300/70 hover:text-white"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("participants")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
              activeTab === "participants"
                ? "bg-[#3f6212] text-white shadow-xs"
                : "text-emerald-300/70 hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>People ({participants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
              activeTab === "transcript"
                ? "bg-[#3f6212] text-white shadow-xs"
                : "text-emerald-300/70 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Summary</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
              activeTab === "notes"
                ? "bg-[#3f6212] text-white shadow-xs"
                : "text-emerald-300/70 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Notes</span>
          </button>
        </div>
      </div>

      {/* ─── Scrollable Tab Content ─── */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ─── 1. PARTICIPANTS TAB ─── */}
        {activeTab === "participants" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300/80 uppercase tracking-wider">
                In this meeting ({filteredParticipants.length})
              </span>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-2xl bg-[#08120a] border border-emerald-900/60 px-3 py-2 text-xs">
              <Search className="h-3.5 w-3.5 text-emerald-500/70 shrink-0" />
              <input
                type="text"
                placeholder="Search participants..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder-emerald-500/50 outline-none text-xs"
              />
            </div>

            {/* Participants List Items */}
            <div className="space-y-2">
              {filteredParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-[#0e1d10]/70 border border-emerald-900/30 p-3 transition-colors hover:border-emerald-700/40"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="h-8 w-8 rounded-full object-cover border border-emerald-600/40"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-emerald-200 border border-emerald-600/40">
                          {getInitials(p.name)}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0e1d10] ${
                          p.isMuted ? "bg-red-500" : "bg-emerald-400"
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {p.name}
                        </span>
                        {p.isLocal && (
                          <span className="text-[10px] text-emerald-400 font-medium">(You)</span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-300/60 font-medium capitalize">
                        {p.role}
                      </span>
                    </div>
                  </div>

                  {/* Device Status Icons */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        p.isMuted
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                      }`}
                      title={p.isMuted ? "Muted" : "Microphone active"}
                    >
                      {p.isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-[#84cc16]" />}
                    </div>

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        p.isCameraOff
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                      }`}
                      title={p.isCameraOff ? "Camera Off" : "Camera On"}
                    >
                      {p.isCameraOff ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 2. CHAT TAB ─── */}
        {activeTab === "chat" && (
          <div className="flex h-full flex-col justify-between space-y-3">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-emerald-300/60">
                  No messages yet. Send a message to participants in this room! 💬
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.userId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-emerald-200">
                          {isOwn ? "You" : msg.senderName}
                        </span>
                        <span className="text-[10px] text-emerald-400/50">
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                          isOwn
                            ? "rounded-br-xs bg-[#3f6212] text-white"
                            : "rounded-bl-xs bg-[#122415] text-emerald-100 border border-emerald-800/40"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── 3. SUMMARY TAB ─── */}
        {activeTab === "transcript" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#0e1d10]/80 border border-emerald-900/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-[#84cc16]" />
                <h3 className="text-xs font-bold text-white">Live Call Status</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Native WebRTC peer mesh active. Video streams, audio tracks, and real-time messages are encrypted and streamed directly between connected browsers.
              </p>
            </div>
          </div>
        )}

        {/* ─── 4. NOTES TAB ─── */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-950/60 border border-emerald-800/40 p-3.5">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-white">
                <Sparkles className="h-4 w-4 text-[#84cc16]" />
                Session Notes
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#84cc16]" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Add note input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add session note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                className="flex-1 rounded-full bg-[#08120a] border border-emerald-900/60 px-3.5 py-2 text-xs text-white placeholder-emerald-400/40 outline-none focus:border-[#84cc16]"
              />
              <button
                onClick={handleAddNote}
                className="rounded-full bg-[#3f6212] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#365314]"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Chat Input (When on Chat tab) ─── */}
      {activeTab === "chat" && (
        <div className="border-t border-emerald-900/40 bg-[#08120a]/80 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message to everyone..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              className="flex-1 rounded-full bg-[#122415] border border-emerald-800/40 px-4 py-2.5 text-xs text-white placeholder-emerald-400/40 outline-none focus:border-[#84cc16] focus:ring-1 focus:ring-[#84cc16]/40"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                chatInput.trim()
                  ? "bg-[#3f6212] text-white hover:bg-[#365314] active:scale-95 shadow-md shadow-lime-950/40"
                  : "bg-emerald-950 text-emerald-700 cursor-not-allowed"
              }`}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default TranscriptPanel;
