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
    <aside className="flex h-full w-full flex-col bg-[#0e1217] border-l border-zinc-800/90 text-zinc-100 shadow-2xl">
      {/* ─── Panel Top Header ─── */}
      <div className="flex items-center justify-between border-b border-zinc-900/80 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold tracking-wider text-zinc-300 uppercase">
            {activeTab === "participants" ? "People in Call" : activeTab}
          </h2>
          {activeTab === "participants" && (
            <span className="rounded-full bg-zinc-900 border border-zinc-850 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              {participants.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-850 transition-all active:scale-95"
            title="Invite more people"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Invite Link</span>
          </button>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-xl border border-zinc-850 bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Tab Segment Controls ─── */}
      <div className="flex border-b border-zinc-900/80 bg-zinc-950 px-3 py-2.5">
        <div className="grid w-full grid-cols-4 gap-1 rounded-2xl bg-zinc-900/40 p-1 border border-zinc-850/80">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all border ${
              activeTab === "chat"
                ? "bg-zinc-800 border-zinc-750 text-white shadow-sm"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("participants")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all border ${
              activeTab === "participants"
                ? "bg-zinc-800 border-zinc-750 text-white shadow-sm"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>People</span>
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all border ${
              activeTab === "transcript"
                ? "bg-zinc-800 border-zinc-750 text-white shadow-sm"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Summary</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all border ${
              activeTab === "notes"
                ? "bg-zinc-800 border-zinc-750 text-white shadow-sm"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Notes</span>
          </button>
        </div>
      </div>

      {/* ─── Scrollable Tab Content ─── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ─── 1. PARTICIPANTS TAB ─── */}
        {activeTab === "participants" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                In this meeting ({filteredParticipants.length})
              </span>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-xl bg-zinc-950 border border-zinc-850 px-3 py-2 text-xs">
              <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder="Search participants..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder-zinc-500 outline-none text-xs"
              />
            </div>

            {/* Direct Meeting Share Link Card */}
            <div className="rounded-2xl bg-zinc-900/30 border border-zinc-850/80 p-4 shadow-sm relative overflow-hidden">
              <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-500/3 blur-lg" />
              <div className="relative z-10">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Sparkles className="h-3 w-3" />
                  Direct Invite Link
                </span>
                <p className="text-[11px] text-zinc-300/80 mb-3">
                  Invite others to join this room directly by sharing this link:
                </p>
                <div className="flex items-center gap-1.5 rounded-xl bg-zinc-950 border border-zinc-850 px-2 py-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/meeting/${roomId}`}
                    className="w-full bg-transparent font-mono text-[10px] text-emerald-400 outline-none select-all cursor-text"
                  />
                  <button
                    onClick={handleCopyInvite}
                    className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-[10px] font-bold text-zinc-250 transition-all hover:bg-zinc-750 hover:text-white active:scale-95 shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Participants List Items */}
            <div className="space-y-2">
              {filteredParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-zinc-900/20 border border-zinc-850 p-3 transition-colors hover:border-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="h-8 w-8 rounded-full object-cover border border-zinc-800"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-zinc-300 border border-zinc-800">
                          {getInitials(p.name)}
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0e1217] ${
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
                      <span className="text-[10px] text-zinc-400 font-medium capitalize">
                        {p.role}
                      </span>
                    </div>
                  </div>

                  {/* Device Status Icons */}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl border transition-colors ${
                        p.isMuted
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800"
                      }`}
                      title={p.isMuted ? "Muted" : "Microphone active"}
                    >
                      {p.isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl border transition-colors ${
                        p.isCameraOff
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800"
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
                <div className="py-12 text-center text-xs text-zinc-500">
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
                        <span className="text-[10px] font-semibold text-zinc-300">
                          {isOwn ? "You" : msg.senderName}
                        </span>
                        <span className="text-[9px] text-zinc-500">
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm border ${
                          isOwn
                            ? "rounded-br-xs bg-zinc-850 border-zinc-700 text-white"
                            : "rounded-bl-xs bg-zinc-900/50 border-zinc-850 text-zinc-200"
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
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-850/80 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white">Live Call Status</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Native WebRTC peer mesh active. Video streams, audio tracks, and real-time messages are encrypted and streamed directly between connected browsers.
              </p>
            </div>
          </div>
        )}

        {/* ─── 4. NOTES TAB ─── */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-850 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-white">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Session Notes
              </div>
              <ul className="space-y-2 text-xs text-zinc-400">
                {notes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
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
                className="flex-1 rounded-xl bg-zinc-950 border border-zinc-850 px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-700"
              />
              <button
                onClick={handleAddNote}
                className="rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Chat Input (When on Chat tab) ─── */}
      {activeTab === "chat" && (
        <div className="border-t border-zinc-900/80 bg-zinc-950/85 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message to everyone..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-750 focus:ring-1 focus:ring-zinc-800/40"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl transition-all ${
                chatInput.trim()
                  ? "bg-emerald-500 hover:bg-emerald-600 text-zinc-950 active:scale-95 shadow-md"
                  : "bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed"
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
