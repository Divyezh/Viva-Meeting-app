import { Camera, Mic, ShieldCheck, Sparkles, ArrowUp } from "lucide-react";
import BrandLogo from "../brand_logo";

interface ConnectingScreenProps {
  roomId: string;
  userName: string;
  isWaitingForPermissions: boolean;
  connectionPhase:
    | "idle"
    | "requesting-media"
    | "waiting-permission"
    | "connecting-socket"
    | "joining-room"
    | "ready";
  isExiting?: boolean;
}

export const ConnectingScreen = ({
  roomId,
  userName,
  isWaitingForPermissions,
  connectionPhase,
  isExiting = false,
}: ConnectingScreenProps) => {
  const isPermissionPrompt =
    isWaitingForPermissions || connectionPhase === "waiting-permission";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07130a] text-white overflow-hidden transition-all duration-300 ease-out ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
    >
      {/* ─── Ambient Atmospheric Background Glows ─── */}
      <div className="pointer-events-none absolute -top-40 left-1/3 h-120 w-120 rounded-full bg-emerald-500/15 blur-3xl opacity-80" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-120 w-120 rounded-full bg-lime-500/15 blur-3xl opacity-80" />

      {/* Concentric orbital rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-80 w-80 sm:h-96 sm:w-96 rounded-full border border-emerald-400/20 opacity-40 animate-pulse" />
        <div className="absolute h-96 w-96 sm:h-136 sm:w-136 rounded-full border border-lime-400/15 opacity-30" />
      </div>

      {/* Permission prompt helper: points towards browser URL bar / popup area */}
      {isPermissionPrompt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 rounded-full bg-lime-400/15 border border-lime-400/50 px-4 py-2 backdrop-blur-md shadow-lg shadow-black/40 animate-bounce">
          <ArrowUp className="h-4 w-4 text-lime-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-lime-300">
            Click &quot;Allow&quot; in the browser prompt above
          </span>
        </div>
      )}

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#0b1a0e]/92 border border-emerald-700/40 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-2xl animate-scale-up">
        {/* Animated Brand / Device Orb */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          {/* Orbital spin border */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-800/40 border-t-lime-400 animate-spin" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/90 border border-emerald-600/40 text-lime-400 shadow-xl shadow-lime-950/60">
            {isPermissionPrompt ? (
              <div className="flex items-center gap-1">
                <Camera className="h-5 w-5 text-lime-300 animate-pulse" />
                <Mic className="h-5 w-5 text-lime-300 animate-pulse" />
              </div>
            ) : (
              <BrandLogo className="h-8 w-8" color="#a3e635" />
            )}
          </div>
        </div>

        {/* Phase Pill Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/50 px-3.5 py-1 text-xs font-semibold text-lime-300">
          {isPermissionPrompt ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Permission Required</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 text-lime-400" />
              <span>
                {connectionPhase === "connecting-socket"
                  ? "Connecting Signaling..."
                  : connectionPhase === "joining-room"
                    ? "Joining Room..."
                    : "Connecting to Meeting"}
              </span>
            </>
          )}
        </div>

        {/* Main Title & Description */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
          {isPermissionPrompt
            ? "Waiting for Camera & Mic"
            : "Preparing Your Meeting"}
        </h2>

        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-emerald-200/70 max-w-sm mx-auto">
          {isPermissionPrompt
            ? "Please click 'Allow' on your browser prompt so participants can see and hear you."
            : "Establishing secure peer connection, optimizing audio, and syncing room state."}
        </p>

        {/* Smooth Shimmer Progress Bar */}
        <div className="mt-6 w-full rounded-full bg-emerald-950/70 p-0.5 border border-emerald-800/40 overflow-hidden">
          <div className="h-1.5 w-full rounded-full animate-shimmer-progress" />
        </div>

        {/* Connection Step Checklist */}
        <div className="mt-6 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 p-3.5 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-emerald-300/70 font-medium">Meeting Code</span>
            <span className="font-mono font-bold text-lime-300">{roomId}</span>
          </div>
          <div className="flex items-center justify-between border-t border-emerald-900/40 pt-2">
            <span className="text-emerald-300/70 font-medium">Joining As</span>
            <span className="font-semibold text-white truncate max-w-44">{userName}</span>
          </div>
          <div className="flex items-center justify-between border-t border-emerald-900/40 pt-2 text-[11px]">
            <span className="text-emerald-400/60 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              End-to-End WebRTC Media
            </span>
            <span className="text-lime-400/90 font-mono">256-bit Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectingScreen;
