import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import type { ChatMessage } from "../../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

const ChatPanel = ({ messages, currentUserId, onSendMessage, onClose }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-surface-900">In-Meeting Chat</h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-surface-400">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.userId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
            >
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-[11px] font-medium text-surface-500">
                  {isOwn ? "You" : msg.senderName}
                </span>
                <span className="text-[10px] text-surface-400">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                  isOwn
                    ? "rounded-br-md bg-brand-600 text-white"
                    : "rounded-bl-md bg-surface-100 text-surface-700"
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-100 p-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-surface-50 px-4 py-2.5 text-sm text-surface-900 placeholder-surface-400 outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
              input.trim()
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-surface-100 text-surface-400"
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
