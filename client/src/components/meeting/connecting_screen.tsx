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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a1a] text-[#f3f4f6] overflow-hidden transition-all duration-300 ease-out ${
        isExiting
          ? "opacity-0 scale-105 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
    >
      {/* Permission prompt helper: points towards browser URL bar / popup area */}
      {isPermissionPrompt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 px-4 py-2 backdrop-blur-md shadow-lg shadow-black/40 animate-bounce">
          <ArrowUp className="h-4 w-4 text-[#10b981] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-[#34d399]">
            Click &quot;Allow&quot; in the browser prompt above
          </span>
        </div>
      )}

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-[#242424] border border-[#383838] p-6 sm:p-8 text-center shadow-2xl animate-scale-up">
        {/* Animated Brand / Device Orb */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          {/* Orbital spin border */}
          <div className="absolute inset-0 rounded-full border-2 border-[#383838] border-t-[#10b981] animate-spin" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1e1e1e] border border-[#383838] text-[#10b981] shadow-xl">
            {isPermissionPrompt ? (
              <div className="flex items-center gap-1">
                <Camera className="h-5 w-5 text-[#34d399] animate-pulse" />
                <Mic className="h-5 w-5 text-[#34d399] animate-pulse" />
              </div>
            ) : (
              <BrandLogo className="h-8 w-8" color="#10b981" />
            )}
          </div>
        </div>

        {/* Phase Pill Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#1e1e1e] border border-[#383838] px-3.5 py-1 text-xs font-semibold text-[#34d399]">
          {isPermissionPrompt ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Permission Required</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 text-[#10b981]" />
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
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f3f4f6] mt-1">
          {isPermissionPrompt
            ? "Waiting for Camera & Mic"
            : "Preparing Your Meeting"}
        </h2>

        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#9ca3af] max-w-sm mx-auto">
          {isPermissionPrompt
            ? "Please click 'Allow' on your browser prompt so participants can see and hear you."
            : "Establishing secure peer connection, optimizing audio, and syncing room state."}
        </p>

        {/* Smooth Shimmer Progress Bar */}
        <div className="mt-6 w-full rounded-full bg-[#1e1e1e] p-0.5 border border-[#383838] overflow-hidden">
          <div className="h-1.5 w-full rounded-full animate-shimmer-progress bg-linear-to-r from-transparent via-[#10b981] to-transparent" />
        </div>

        {/* Connection Step Checklist */}
        <div className="mt-6 rounded-2xl bg-[#1e1e1e] border border-[#383838] p-3.5 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#9ca3af] font-medium">Meeting Code</span>
            <span className="font-mono font-bold text-[#34d399]">{roomId}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#383838] pt-2">
            <span className="text-[#9ca3af] font-medium">Joining As</span>
            <span className="font-semibold text-[#f3f4f6] truncate max-w-44">{userName}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#383838] pt-2 text-[11px]">
            <span className="text-[#9ca3af] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#10b981]" />
              End-to-End WebRTC Media
            </span>
            <span className="text-[#34d399] font-mono">256-bit Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectingScreen;
