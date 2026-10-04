import { useState } from "react";
import {
  MessageSquare,
  Users,
  Send,
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Search,
  Monitor,
  MonitorUp,
  MonitorOff,
} from "lucide-react";
import toast from "react-hot-toast";
import type { ChatMessage } from "../../types";

export interface ParticipantItem {
  id: string;
  name: string;
  avatar?: string;
  role: "host" | "participant";
  isMuted: boolean;
  isCameraOff: boolean;
  isLocal?: boolean;
  isScreenSharing?: boolean;
  canShareScreen?: boolean;
  socketId?: string;
}

interface TranscriptPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  initialTab?: "transcript" | "chat" | "notes" | "participants";
  participants?: ParticipantItem[];
  roomId?: string;
  isHost?: boolean;
  allScreenShareAllowed?: boolean;
  onToggleAllScreenShare?: (allowed: boolean) => void;
  onSetParticipantScreenShare?: (
    targetSocketId: string,
    targetUserId: string,
    allowed: boolean
  ) => void;
  onStopParticipantScreenShare?: (targetSocketId: string) => void;
}

const TranscriptPanel = ({
  messages,
  currentUserId,
  onSendMessage,
  onClose,
  initialTab = "chat",
  participants = [],
  roomId = "",
  isHost = false,
  allScreenShareAllowed = false,
  onToggleAllScreenShare,
  onSetParticipantScreenShare,
  onStopParticipantScreenShare,
}: TranscriptPanelProps) => {
  const normalizeTab = (tab?: string): "people" | "chat" => {
    if (tab === "participants" || tab === "people") return "people";
    return "chat";
  };

  const [activeTab, setActiveTab] = useState<"people" | "chat">(() => normalizeTab(initialTab));
  const [chatInput, setChatInput] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(normalizeTab(initialTab));
  }

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

  const handleSendChat = () => {
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput("");
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meeting/${roomId}`);
    toast.success("Meeting link copied to clipboard!", {
      duration: 2500,
      style: {
        background: "#202124",
        color: "#ffffff",
        border: "1px solid #3c4043",
      },
    });
  };

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(participantSearch.toLowerCase())
  );

  return (
    <aside className="flex h-full w-full flex-col bg-[#202124] border-l border-[#3c4043] text-white shadow-xl">
      {/* ─── Panel Header: Clean 2-Tab Navigation (People & Chat) ─── */}
      <div className="flex items-center justify-between border-b border-[#3c4043] px-4 py-3 bg-[#202124]">
        <div className="flex items-center gap-1 bg-[#282a2d] p-1 rounded-lg border border-[#3c4043]">
          <button
            onClick={() => setActiveTab("people")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "people"
                ? "bg-[#3c4043] text-white shadow-sm"
                : "text-[#9aa0a6] hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>People ({participants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "chat"
                ? "bg-[#3c4043] text-white shadow-sm"
                : "text-[#9aa0a6] hover:text-white"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#9aa0a6] hover:text-white hover:bg-[#3c4043] transition-colors cursor-pointer"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ─── Scrollable Tab Content ─── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ─── 1. PEOPLE TAB (VISIBLE TO ALL PARTICIPANTS) ─── */}
        {activeTab === "people" && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 rounded-md bg-[#282a2d] border border-[#3c4043] px-3 py-2 text-xs">
              <Search className="h-3.5 w-3.5 text-[#9aa0a6] shrink-0" />
              <input
                type="text"
                placeholder="Search participants..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder-[#9aa0a6] outline-none text-xs"
              />
            </div>

            {/* Host Screen Share Master Control Toggle (HOST ONLY) */}
            {isHost && (
              <div className="rounded-lg bg-[#282a2d] border border-[#3c4043] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3c4043] text-[#8ab4f8]">
                    <MonitorUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">Allow screen sharing</div>
                    <div className="text-[11px] text-[#9aa0a6]">
                      {allScreenShareAllowed
                        ? "Anyone can share their screen"
                        : "Only permitted users can share"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onToggleAllScreenShare && onToggleAllScreenShare(!allScreenShareAllowed)
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    allScreenShareAllowed ? "bg-[#1a73e8]" : "bg-[#3c4043]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      allScreenShareAllowed ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Meeting Link Share Card */}
            <div className="rounded-lg bg-[#282a2d] border border-[#3c4043] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#9aa0a6]">
                  Share meeting link
                </span>
                <button
                  onClick={handleCopyInvite}
                  className="text-xs font-medium text-[#8ab4f8] hover:text-[#aecbfa] cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/meeting/${roomId}`}
                className="w-full rounded-md bg-[#202124] border border-[#3c4043] px-2.5 py-1.5 font-mono text-[11px] text-[#9aa0a6] select-all cursor-text outline-none"
              />
            </div>

            {/* Participants List */}
            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-medium text-[#9aa0a6] px-1 py-1">
                In this meeting ({filteredParticipants.length})
              </div>
x
              {filteredParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-[#282a2d]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="h-8 w-8 rounded-full object-cover border border-[#3c4043]"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3c4043] text-xs font-medium text-white border border-[#5f6368]">
                          {getInitials(p.name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-medium text-white truncate">
                          {p.name}
                        </span>
                        {p.isLocal && (
                          <span className="text-[11px] text-[#8ab4f8] font-normal">(You)</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#9aa0a6] capitalize">
                        {p.role}
                      </span>
                    </div>
                  </div>

                  {/* Device Status & Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Active Presenting Indicator */}
                    {p.isScreenSharing && (
                      <span className="flex items-center gap-1 rounded-md bg-[#282a2d] border border-[#3c4043] px-2 py-0.5 text-[10px] font-medium text-[#8ab4f8]">
                        <Monitor className="h-3 w-3" />
                        <span>Presenting</span>
                      </span>
                    )}

                    {/* Host action: Force stop screen share (HOST ONLY) */}
                    {isHost && !p.isLocal && p.isScreenSharing && (
                      <button
                        onClick={() =>
                          p.socketId &&
                          onStopParticipantScreenShare &&
                          onStopParticipantScreenShare(p.socketId)
                        }
                        className="rounded-md bg-[#ea4335] hover:bg-[#d93025] px-2 py-1 text-[10px] font-medium text-white transition-colors cursor-pointer"
                        title="Stop this participant's screen share"
                      >
                        Stop
                      </button>
                    )}

                    {/* Host action: Grant / Revoke Screen Share Permission (HOST ONLY) */}
                    {isHost && !p.isLocal && p.role !== "host" && (
                      <button
                        onClick={() =>
                          onSetParticipantScreenShare &&
                          onSetParticipantScreenShare(
                            p.socketId || p.id,
                            p.id,
                            !p.canShareScreen
                          )
                        }
                        className={`flex h-7 px-2 items-center gap-1 rounded-md border text-[10px] font-medium transition-colors cursor-pointer ${
                          p.canShareScreen
                            ? "bg-[#282a2d] border-[#1a73e8] text-[#8ab4f8]"
                            : "bg-[#282a2d] border-[#3c4043] text-[#9aa0a6] hover:text-white"
                        }`}
                        title={
                          p.canShareScreen
                            ? "Revoke screen share permission"
                            : "Grant screen share permission"
                        }
                      >
                        {p.canShareScreen ? (
                          <>
                            <MonitorUp className="h-3 w-3 text-[#8ab4f8]" />
                            <span className="hidden sm:inline">Allowed</span>
                          </>
                        ) : (
                          <>
                            <MonitorOff className="h-3 w-3 text-[#9aa0a6]" />
                            <span className="hidden sm:inline">Allow</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Mic Status Icon */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md ${
                        p.isMuted
                          ? "text-[#ea4335]"
                          : "text-[#9aa0a6]"
                      }`}
                      title={p.isMuted ? "Microphone muted" : "Microphone on"}
                    >
                      {p.isMuted ? (
                        <MicOff className="h-3.5 w-3.5" />
                      ) : (
                        <Mic className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Camera Status Icon */}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-md ${
                        p.isCameraOff
                          ? "text-[#ea4335]"
                          : "text-[#9aa0a6]"
                      }`}
                      title={p.isCameraOff ? "Camera off" : "Camera on"}
                    >
                      {p.isCameraOff ? (
                        <VideoOff className="h-3.5 w-3.5" />
                      ) : (
                        <Video className="h-3.5 w-3.5" />
                      )}
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
                <div className="py-16 text-center text-xs text-[#9aa0a6]">
                  Messages sent here are visible to everyone in the call.
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
                        <span className="text-[11px] font-medium text-[#9aa0a6]">
                          {isOwn ? "You" : msg.senderName}
                        </span>
                        <span className="text-[10px] text-[#5f6368]">
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                          isOwn
                            ? "bg-[#1a73e8] text-white"
                            : "bg-[#282a2d] border border-[#3c4043] text-white"
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
      </div>

      {/* ─── Bottom Chat Input (When on Chat tab) ─── */}
      {activeTab === "chat" && (
        <div className="border-t border-[#3c4043] bg-[#202124] p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Send a message to everyone..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              className="flex-1 rounded-md bg-[#282a2d] border border-[#3c4043] px-3 py-2 text-xs text-white placeholder-[#9aa0a6] outline-none focus:border-[#8ab4f8]"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                chatInput.trim()
                  ? "bg-[#1a73e8] hover:bg-[#1557b0] text-white cursor-pointer"
                  : "bg-[#282a2d] text-[#5f6368] cursor-not-allowed"
              }`}
              title="Send message"
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
