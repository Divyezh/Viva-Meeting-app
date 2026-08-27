import { useState, useEffect, useCallback } from "react";
import socket from "../config/socket";
import type { ChatMessage } from "../types";

export const useChat = (roomId: string, currentUser: { userId: string; userName: string; avatarUrl?: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (!isChatOpen && msg.userId !== currentUser.userId) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("new-chat-message", handleNewMessage);

    return () => {
      socket.off("new-chat-message", handleNewMessage);
    };
  }, [isChatOpen, currentUser.userId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const newMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        meetingId: roomId,
        userId: currentUser.userId,
        senderName: currentUser.userName,
        senderAvatar: currentUser.avatarUrl || "",
        message: text.trim(),
        createdAt: new Date().toISOString(),
      };

      socket.emit("send-chat-message", {
        roomId,
        message: newMsg,
      });
    },
    [roomId, currentUser]
  );

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    messages,
    unreadCount,
    isChatOpen,
    setIsChatOpen,
    sendMessage,
    resetUnreadCount,
  };
};

export default useChat;
