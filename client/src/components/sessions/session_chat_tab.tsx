import type { ChatMessage } from "../../types";

interface SessionChatTabProps {
  messages: ChatMessage[];
}

const SessionChatTab = ({ messages }: SessionChatTabProps) => {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate a consistent color from name
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-brand-600/20 text-brand-400",
      "bg-emerald-600/20 text-emerald-400",
      "bg-amber-600/20 text-amber-400",
      "bg-sky-600/20 text-sky-400",
      "bg-rose-600/20 text-rose-400",
      "bg-violet-600/20 text-violet-400",
    ];
    const index = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-surface-500">No messages in this session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-1">
      {messages.map((msg, index) => {
        const showAvatar =
          index === 0 || messages[index - 1].userId !== msg.userId;

        return (
          <div key={msg.id} className={`flex items-start gap-3 ${showAvatar ? "mt-4 first:mt-0" : "mt-0.5"}`}>
            {/* Avatar */}
            <div className="w-8 shrink-0">
              {showAvatar && (
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(
                    msg.senderName
                  )}`}
                >
                  {getInitials(msg.senderName)}
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div className="flex-1 min-w-0">
              {showAvatar && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-surface-200">
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-surface-600">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              )}
              <div className="rounded-lg rounded-tl-sm bg-surface-800/70 px-3 py-2 text-sm text-surface-200">
                {msg.message}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionChatTab;
