import { useEffect, useState } from "react";

export interface EmojiReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderAvatar?: string;
  userId: string;
  timestamp: number;
  leftPercent: number; // 15% to 85% across screen
}

interface FloatingReactionsProps {
  reactions: EmojiReaction[];
  onRemoveReaction: (id: string) => void;
}

export const FloatingReactions = ({
  reactions,
  onRemoveReaction,
}: FloatingReactionsProps) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {reactions.map((reaction) => (
        <FloatingItem
          key={reaction.id}
          reaction={reaction}
          onDone={() => onRemoveReaction(reaction.id)}
        />
      ))}
    </div>
  );
};

const FloatingItem = ({
  reaction,
  onDone,
}: {
  reaction: EmojiReaction;
  onDone: () => void;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance transition on mount
    const animFrame = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      onDone();
    }, 2800);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(timer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        left: `${reaction.leftPercent}%`,
        bottom: visible ? "45%" : "8%",
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, ${visible ? "-60px" : "0px"}) scale(${visible ? 1.1 : 0.6})`,
        transition: "bottom 2.8s cubic-bezier(0.1, 0.8, 0.3, 1), transform 2.8s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.6s ease-in 2.2s",
      }}
      className="absolute flex flex-col items-center gap-1.5 will-change-transform"
    >
      {/* Sender Name Pill */}
      <div className="flex items-center gap-1 rounded-full bg-[#1e1e1e]/90 border border-[#383838] px-2.5 py-0.5 shadow-xl backdrop-blur-md">
        {reaction.senderAvatar ? (
          <img
            src={reaction.senderAvatar}
            alt={reaction.senderName}
            className="h-3.5 w-3.5 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#10b981]/20 border border-[#10b981]/30 text-[8px] font-bold text-[#34d399]">
            {reaction.senderName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="text-[10px] font-semibold text-white tracking-tight">
          {reaction.senderName}
        </span>
      </div>

      {/* Bursting / Floating Emoji */}
      <span className="text-4xl sm:text-5xl drop-shadow-2xl select-none filter">
        {reaction.emoji}
      </span>
    </div>
  );
};

export default FloatingReactions;
