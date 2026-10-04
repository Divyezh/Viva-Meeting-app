import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../config/socket";
import { translateText } from "../utils/translator";
import toast from "react-hot-toast";

export interface LiveCaption {
  id: string;
  userId: string;
  senderName: string;
  senderAvatar?: string;
  originalText: string;
  text: string; // Translated text (e.g. English)
  spokenLang: string;
  targetLang: string;
  timestamp: number;
  isLocal?: boolean;
}

interface UseCaptionsProps {
  roomId: string;
  currentUser: {
    userId: string;
    userName: string;
    avatarUrl?: string;
  };
  isMuted: boolean;
  enabled?: boolean;
}

// Browser Web Speech API interface declarations
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const useCaptions = ({
  roomId,
  currentUser,
  isMuted,
  enabled = true,
}: UseCaptionsProps) => {
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
  const [spokenLang, setSpokenLang] = useState<string>("hi-IN"); // Default: Hindi
  const [captionLang, setCaptionLang] = useState<string>("en"); // Default: English
  const [activeCaption, setActiveCaption] = useState<LiveCaption | null>(null);
  const [captionHistory, setCaptionHistory] = useState<LiveCaption[]>([]);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const captionClearTimeoutRef = useRef<any>(null);
  const isSpeechSupported = typeof window !== "undefined" && !!(
    (window as unknown as IWindow).SpeechRecognition ||
    (window as unknown as IWindow).webkitSpeechRecognition
  );

  // Set active caption with auto-dismiss timer
  const displayCaption = useCallback((caption: LiveCaption) => {
    setActiveCaption(caption);
    setCaptionHistory((prev) => [...prev.slice(-49), caption]);

    if (captionClearTimeoutRef.current) {
      clearTimeout(captionClearTimeoutRef.current);
    }
    captionClearTimeoutRef.current = setTimeout(() => {
      setActiveCaption(null);
    }, 4500);
  }, []);

  // ─── 1. Receive Captions Broadcasted from Sockets ───
  useEffect(() => {
    const handleNewCaption = (cap: LiveCaption) => {
      if (cap.userId === currentUser.userId) {
        return; // Already displayed locally
      }
      if (isCaptionsEnabled) {
        displayCaption({ ...cap, isLocal: false });
      }
    };

    socket.on("new-caption", handleNewCaption);
    return () => {
      socket.off("new-caption", handleNewCaption);
    };
  }, [currentUser.userId, isCaptionsEnabled, displayCaption]);

  // ─── 2. Speech Recognition Engine Setup ───
  const startRecognition = useCallback(() => {
    if (!isSpeechSupported || !enabled || isMuted || !isCaptionsEnabled) {
      return;
    }

    try {
      const SpeechRec =
        (window as unknown as IWindow).SpeechRecognition ||
        (window as unknown as IWindow).webkitSpeechRecognition;
      if (!SpeechRec) return;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = spokenLang;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = async (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const rawText = (finalTranscript || interimTranscript).trim();
        if (!rawText) return;

        // Perform real-time translation (e.g. Hindi -> English)
        const { translatedText, originalText } = await translateText(
          rawText,
          spokenLang,
          captionLang
        );

        const captionItem: LiveCaption = {
          id: `cap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: currentUser.userId,
          senderName: currentUser.userName,
          senderAvatar: currentUser.avatarUrl,
          originalText,
          text: translatedText,
          spokenLang,
          targetLang: captionLang,
          timestamp: Date.now(),
          isLocal: true,
        };

        // Render locally
        displayCaption(captionItem);

        // Broadcast to meeting peers if final or substantial text
        if (finalTranscript || rawText.length > 12) {
          socket.emit("send-caption", {
            roomId,
            caption: captionItem,
          });
        }
      };

      rec.onerror = (err: any) => {
        if (err.error !== "no-speech") {
          console.debug("Captions speech recognition notice:", err.error);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        // Automatically restart speech recognition if captions are still active and user is not muted
        if (isCaptionsEnabled && !isMuted) {
          try {
            rec.start();
          } catch {
            // ignore
          }
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      setIsListening(false);
    }
  }, [
    isSpeechSupported,
    enabled,
    isMuted,
    isCaptionsEnabled,
    spokenLang,
    captionLang,
    currentUser,
    roomId,
    displayCaption,
  ]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Sync recognition lifecycle when user toggles captions, mutes, or changes language
  useEffect(() => {
    if (isCaptionsEnabled && !isMuted) {
      startRecognition();
    } else {
      stopRecognition();
    }

    return () => {
      stopRecognition();
    };
  }, [isCaptionsEnabled, isMuted, spokenLang, captionLang, startRecognition, stopRecognition]);

  const toggleCaptions = useCallback(() => {
    setIsCaptionsEnabled((prev) => {
      const next = !prev;
      if (next) {
        toast.success(
          spokenLang.startsWith("hi")
            ? "Captions ON (Hindi Speech → English Captions)"
            : "Live Captions Enabled",
          {
            style: { background: "#1e1e1e", color: "#f3f4f6", border: "1px solid #10b981" },
          }
        );
      } else {
        toast("Live captions turned off", {
          style: { background: "#1e1e1e", color: "#f3f4f6", border: "1px solid #383838" },
        });
        setActiveCaption(null);
      }
      return next;
    });
  }, [spokenLang]);

  return {
    isCaptionsEnabled,
    spokenLang,
    captionLang,
    activeCaption,
    captionHistory,
    isListening,
    isSpeechSupported,
    toggleCaptions,
    setSpokenLang,
    setCaptionLang,
  };
};

export default useCaptions;
