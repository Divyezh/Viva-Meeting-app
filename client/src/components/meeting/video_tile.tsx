import { useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Monitor } from "lucide-react";

interface VideoTileProps {
  userName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
  stream: MediaStream | null;
  avatarUrl?: string;
  isLocal?: boolean;
  isScreenSharing?: boolean;
}

const VideoTile = ({
  userName,
  isMuted,
  isCameraOff,
  isSpeaking,
  stream,
  avatarUrl,
  isLocal = false,
  isScreenSharing = false,
}: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Ensure remote participant voice plays reliably through dedicated audio element
  useEffect(() => {
    if (audioRef.current && stream && !isLocal) {
      if (audioRef.current.srcObject !== stream) {
        audioRef.current.srcObject = stream;
        audioRef.current.play().catch((err) => {
          console.debug("Remote audio play notice:", err);
        });
      }
    }
  }, [stream, isLocal]);

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

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
  const showVideo = !isCameraOff && hasVideoTrack;

  return (
    <div
      className={`group relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl bg-[#0b180e] border border-emerald-900/30 shadow-lg ${
        isSpeaking
          ? "ring-2 ring-[#84cc16] shadow-xl shadow-lime-500/20"
          : "hover:border-emerald-700/50"
      }`}
    >
      {/* ─── Dedicated Audio Element for Remote Voice (Never muted or cut off) ─── */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          className="hidden"
        />
      )}

      {/* ─── Video Stream Element ─── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video playback to avoid acoustic feedback loop
        className={`h-full w-full object-cover ${
          showVideo ? "opacity-100" : "opacity-0 absolute"
        } ${isLocal && !isScreenSharing ? "scale-x-[-1]" : ""}`}
      />

      {/* ─── Camera Off Fallback: Modern Ambient Gradient + Initials Badge ─── */}
      {!showVideo && (
        <div className="relative flex h-full w-full items-center justify-center bg-linear-to-br from-[#122415] via-[#0b180e] to-[#070e08] overflow-hidden">
          {/* Subtle luminous background aura */}
          <div className="pointer-events-none absolute h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col items-center justify-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-2xl"
              />
            ) : (
              <div
                className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-linear-to-tr from-[#1b3820] to-[#2d5e35] text-2xl sm:text-3xl font-bold text-emerald-100 ring-4 shadow-2xl transition-transform ${
                  isSpeaking ? "ring-[#84cc16] scale-105" : "ring-emerald-500/30"
                }`}
              >
                {getInitials(userName)}
              </div>
            )}

            <span className="text-xs font-medium text-emerald-300/80">
              {isLocal ? "Your camera is off" : "Camera off"}
            </span>
          </div>
        </div>
      )}

      {/* ─── Top-Right: Active Speaking Wave Pill ─── */}
      {isSpeaking && (
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 rounded-full bg-[#84cc16] px-2.5 py-1 text-slate-950 font-bold text-[10px] shadow-md animate-pulse">
          <Volume2 className="h-3 w-3" />
          <span className="hidden sm:inline">Speaking</span>
        </div>
      )}

      {/* ─── Top-Left: Screen Sharing Badge ─── */}
      {isScreenSharing && (
        <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-emerald-300 text-[10px] font-semibold backdrop-blur-md">
          <Monitor className="h-3 w-3 text-emerald-400" />
          <span>Screen Share</span>
        </div>
      )}

      {/* ─── Bottom-Left: Name Badge Pill ─── */}
      <div className="absolute bottom-3.5 left-3.5 z-10">
        <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/10 shadow-sm">
          <span>{isLocal ? `${userName} (You)` : userName}</span>
        </div>
      </div>

      {/* ─── Bottom-Right: Mic Status Pill ─── */}
      <div className="absolute bottom-3.5 right-3.5 z-10">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-colors ${
            isMuted
              ? "bg-red-500/90 text-white"
              : "bg-black/60 text-emerald-300 border border-white/10"
          }`}
          title={isMuted ? "Muted" : "Microphone active"}
        >
          {isMuted ? (
            <MicOff className="h-3.5 w-3.5" />
          ) : (
            <Mic className="h-3.5 w-3.5 text-[#a3e635]" />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
