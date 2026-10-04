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

  // Attach and play video track with automatic unmute listener
  // NOTE: Video elements in the grid must ALWAYS be muted (DOM + JSX) so they only render video frames.
  // This prevents acoustic feedback loops on the local mic and eliminates duplicate audio playback for remote peers.
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Strict DOM-level muting: React's JSX `muted` attribute alone does not guarantee audio track muting in WebKit/Blink
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.volume = 0;

    if (!stream) {
      videoEl.srcObject = null;
      return;
    }

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
    videoEl.muted = true;
    videoEl.volume = 0;

    const playVideo = () => {
      if (!videoEl) return;
      videoEl.muted = true;
      videoEl.volume = 0;
      videoEl.play().catch((err) => {
        console.debug(`[DOM Video Notice] Play pending for "${userName}":`, err);
      });
    };

    playVideo();

    console.log(
      `[DOM Video Attach] Tile "${userName}" (isLocal: ${isLocal}) attached stream ${stream.id} [MUTED: true, volume: 0]`
    );

    const handleTrackChange = () => {
      if (videoEl) {
        videoEl.muted = true;
        videoEl.volume = 0;
        if (videoEl.srcObject !== stream) {
          videoEl.srcObject = stream;
        }
        playVideo();
      }
    };

    stream.addEventListener("addtrack", handleTrackChange);
    stream.addEventListener("removetrack", handleTrackChange);
    stream.getVideoTracks().forEach((track) => {
      track.addEventListener("unmute", handleTrackChange);
    });

    return () => {
      stream.removeEventListener("addtrack", handleTrackChange);
      stream.removeEventListener("removetrack", handleTrackChange);
      stream.getVideoTracks().forEach((track) => {
        track.removeEventListener("unmute", handleTrackChange);
      });
      if (videoEl) {
        videoEl.srcObject = null;
      }
    };
  }, [stream, isLocal, userName, isCameraOff, isScreenSharing]);

  // Ensure remote participant voice plays reliably through dedicated audio element ONLY
  // Local audio is NEVER played back to prevent acoustic feedback loops.
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || isLocal) {
      if (audioEl) {
        audioEl.srcObject = null;
        audioEl.muted = true;
      }
      return;
    }

    if (!stream) {
      audioEl.srcObject = null;
      return;
    }

    // Remote audio element must be unmuted and at full volume
    audioEl.muted = false;
    audioEl.volume = 1;

    if (audioEl.srcObject !== stream) {
      audioEl.srcObject = stream;
    }

    const playAudio = () => {
      if (!audioEl || isLocal) return;
      audioEl.muted = false;
      audioEl.volume = 1;
      audioEl.play().catch((err) => {
        console.debug(`[DOM Audio Notice] Remote audio play deferred for "${userName}":`, err);
      });
    };

    playAudio();

    console.log(
      `[DOM Audio Attach] Playing remote audio for "${userName}" (stream: ${stream.id}, tracks: ${stream.getAudioTracks().length})`
    );

    const handleAudioTrack = () => {
      if (audioEl && audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      playAudio();
    };

    stream.addEventListener("addtrack", handleAudioTrack);
    stream.getAudioTracks().forEach((track) => {
      track.addEventListener("unmute", handleAudioTrack);
    });

    // Mobile browser and Chromium autoplay policy unlock: resume audio on user gestures
    const handleUnlock = () => {
      playAudio();
    };
    window.addEventListener("touchstart", handleUnlock, { passive: true });
    window.addEventListener("click", handleUnlock);
    window.addEventListener("keydown", handleUnlock);

    return () => {
      stream.removeEventListener("addtrack", handleAudioTrack);
      stream.getAudioTracks().forEach((track) => {
        track.removeEventListener("unmute", handleAudioTrack);
      });
      window.removeEventListener("touchstart", handleUnlock);
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("keydown", handleUnlock);
      if (audioEl) {
        audioEl.srcObject = null;
        audioEl.muted = true;
      }
    };
  }, [stream, isLocal, userName, isMuted]);

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

  const hasVideoTrack = stream && stream.getVideoTracks().length > 0;
  const showVideo = (!isCameraOff || isScreenSharing) && hasVideoTrack;

  return (
    <div
      className={`group relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-[#202124] border border-[#3c4043] shadow-md transition-all duration-150 ease-out ${
        isSpeaking ? "ring-2 ring-[#1a73e8]" : "hover:border-[#5f6368]"
      }`}
    >
      {/* ─── Dedicated Audio Element for Remote Voice (Never duplicated with video element) ─── */}
      {!isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          onLoadedMetadata={() => audioRef.current?.play().catch(() => {})}
          className="sr-only"
          aria-hidden="true"
        />
      )}

      {/* ─── Video Stream Element (Visual ONLY - Always muted to prevent acoustic feedback loop) ─── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        onLoadedMetadata={() => videoRef.current?.play().catch(() => {})}
        className={`h-full w-full transition-opacity duration-200 ease-out ${
          isScreenSharing ? "object-contain bg-black" : "object-cover"
        } ${showVideo ? "opacity-100" : "opacity-0 absolute"} ${
          isLocal && !isScreenSharing ? "scale-x-[-1]" : ""
        }`}
      />

      {/* ─── Camera Off Fallback: Clean Solid Neutral Canvas + Avatar Circle ─── */}
      {!showVideo && (
        <div className="relative flex h-full w-full items-center justify-center bg-[#282a2d] transition-opacity duration-200 ease-out">
          <div className="relative z-10 flex flex-col items-center justify-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border border-[#3c4043] shadow-md"
              />
            ) : (
              <div
                className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-[#3c4043] text-2xl sm:text-3xl font-semibold text-white border border-[#5f6368] shadow-md transition-transform ${
                  isSpeaking ? "ring-2 ring-[#1a73e8] scale-105" : ""
                }`}
              >
                {getInitials(userName)}
              </div>
            )}

            <span className="text-xs font-medium text-[#9aa0a6]">
              {isLocal ? "Your camera is off" : "Camera off"}
            </span>
          </div>
        </div>
      )}

      {/* ─── Top-Right: Active Speaking Pill (Subtle Blue, Google Meet style) ─── */}
      {isSpeaking && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-[#1a73e8] px-2 py-0.5 text-white font-medium text-[11px] shadow-sm">
          <Volume2 className="h-3 w-3" />
          <span className="hidden sm:inline">Speaking</span>
        </div>
      )}

      {/* ─── Top-Left: Screen Sharing Badge ─── */}
      {isScreenSharing && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-[#202124]/90 border border-[#3c4043] px-2.5 py-1 text-white text-[11px] font-medium backdrop-blur-sm">
          <Monitor className="h-3 w-3 text-[#8ab4f8]" />
          <span>Screen Share</span>
        </div>
      )}

      {/* ─── Bottom-Left: Name Badge Pill ─── */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="flex items-center gap-1.5 rounded-md bg-[#202124]/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm border border-white/10 shadow-sm">
          <span>{isLocal ? `${userName} (You)` : userName}</span>
        </div>
      </div>

      {/* ─── Bottom-Right: Mic Status Indicator ─── */}
      <div className="absolute bottom-3 right-3 z-10">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm shadow-sm transition-colors ${
            isMuted
              ? "bg-[#ea4335] text-white"
              : "bg-[#202124]/85 text-white border border-white/10"
          }`}
          title={isMuted ? "Muted" : "Microphone active"}
        >
          {isMuted ? (
            <MicOff className="h-3.5 w-3.5" />
          ) : (
            <Mic className="h-3.5 w-3.5 text-white" />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTile;
