import { useState, useEffect } from "react";
import { Plus, ArrowRight, Shield, Mic, Video, Clock, Calendar, Sparkles } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import NewMeetingModal from "../components/meeting/new_meeting_modal";
import JoinMeetingModal from "../components/meeting/join_meeting_modal";
import usePageSEO from "../hooks/usePageSEO";

const Dashboard = () => {
  const { user } = useUser();
  const [meetingId, setMeetingId] = useState("");
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isJoinMeetingModalOpen, setIsJoinMeetingModalOpen] = useState(false);

  // Live Date & Time Engine
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  usePageSEO({
    title: "Viva Meeting - High Quality Instant Video Calls",
    description:
      "Start instant meetings, create secure room codes, and join video conferences on Viva Meeting.",
    canonicalPath: "/dashboard",
  });

  const activeUserName = user?.fullName || user?.firstName || "Divyesh Soni";

  // Formatted Time, Day and Date
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDay = currentTime.toLocaleDateString([], {
    weekday: "long",
  });

  const formattedDate = currentTime.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleOpenNewMeeting = () => {
    setIsNewMeetingModalOpen(true);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingId.trim()) {
      setIsJoinMeetingModalOpen(true);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-8 sm:py-14 max-w-5xl mx-auto">
      <Toaster position="top-center" />

      {/* Action Modals */}
      <NewMeetingModal
        isOpen={isNewMeetingModalOpen}
        onClose={() => setIsNewMeetingModalOpen(false)}
        defaultUserName={activeUserName}
      />
      <JoinMeetingModal
        isOpen={isJoinMeetingModalOpen}
        onClose={() => setIsJoinMeetingModalOpen(false)}
        initialMeetingId={meetingId}
        defaultUserName={activeUserName}
      />

      {/* ─── Hero Block: Upper White Section ─── */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-2 sm:pt-6">
        {/* Maximum ONE quiet meta/status pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/95 px-3.5 py-1 text-xs font-semibold text-emerald-900 shadow-xs backdrop-blur-md">
          <Shield className="h-3.5 w-3.5 text-[#4d7c0f]" />
          <span>Secure peer-to-peer video</span>
        </div>

        {/* Headline: Very slim statement on white, key phrase highlighted */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 leading-tight">
          <span className="font-extralight">Online meetings with high quality video calls.</span>{" "}
          <span className="block font-semibold text-[#4d7c0f]">Built for everyone.</span>
        </h1>

        {/* Supporting paragraph: Exactly one sentence */}
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Connect instantly with teammates and clients in crystal-clear HD video with zero downloads
          required.
        </p>

        {/* Call to Action: 1 Primary CTA + Quieter Secondary Input */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {/* Primary CTA Button */}
          <button
            onClick={handleOpenNewMeeting}
            className="flex items-center justify-center gap-2 rounded-full bg-[#3f6212] hover:bg-[#365314] text-white px-7 py-3 text-sm font-semibold shadow-md shadow-lime-900/20 hover:shadow-lg hover:shadow-lime-900/30 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Start Instant Meeting</span>
          </button>

          {/* Secondary Quiet Join Input */}
          <form
            onSubmit={handleJoinSubmit}
            className="flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/95 px-4 py-2 text-xs text-slate-800 shadow-xs focus-within:border-[#4d7c0f] focus-within:ring-2 focus-within:ring-lime-100 transition-all"
          >
            <input
              type="text"
              placeholder="or enter code"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none w-28 sm:w-32"
            />
            <button
              type="submit"
              disabled={!meetingId.trim()}
              className="text-[#3f6212] hover:text-[#1e3a1e] font-bold disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Join</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ─── Hero Visual: Divyesh Soni Live Stage + Real-Time Clock ─── */}
      <div className="mt-12 sm:mt-16 w-full max-w-3xl mx-auto">
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 sm:p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
          {/* Header Bar with Live Clock, Day & Date */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-light tracking-tight text-slate-900 tabular-nums">
                <Clock className="h-5 w-5 text-[#4d7c0f] shrink-0" />
                <span>{formattedTime}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-[#4d7c0f] shrink-0" />
                <span className="font-semibold text-slate-800">{formattedDay}</span>, {formattedDate}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 text-xs font-semibold text-[#3f6212]">
              <span className="h-2 w-2 rounded-full bg-lime-500 animate-pulse" />
              <span>Ready to Connect</span>
            </div>
          </div>

          {/* Single Divyesh Soni Video Tile Preview */}
          <div className="relative aspect-video w-full rounded-2xl bg-linear-to-br from-[#122818] via-[#0b1b10] to-[#07130a] border border-emerald-800/40 p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Top Bar on Video Tile */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-black/60 border border-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-pulse" />
                <span className="font-semibold text-white">{activeUserName} (You)</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-lime-400 bg-emerald-950/80 border border-emerald-700/50 px-3 py-1 rounded-full backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                <span>HD Video Enabled</span>
              </div>
            </div>

            {/* Center: Divyesh Soni Avatar & Status */}
            <div className="my-auto flex flex-col items-center justify-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-linear-to-tr from-[#1b3d22] to-[#3f6212] border-2 border-lime-400/60 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-2xl shadow-lime-950/50">
                  {activeUserName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 flex h-4 w-4 rounded-full bg-[#84cc16] border-2 border-[#0b1b10] shadow-xs" />
              </div>

              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {activeUserName}
                </h3>
                <p className="text-xs text-emerald-200/70 mt-0.5">
                  Microphone and camera are configured and ready
                </p>
              </div>
            </div>

            {/* Bottom Bar: Quick Audio/Video indicators */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-[11px] text-emerald-300/80 font-medium">
                Click <span className="font-bold text-white">Start Instant Meeting</span> above to begin
              </span>

              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/10 text-lime-400"
                  title="Microphone Active"
                >
                  <Mic className="h-4 w-4" />
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/10 text-lime-400"
                  title="Camera Active"
                >
                  <Video className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Infrastructure Note ─── */}
      <div className="mt-8 sm:mt-10 text-center pb-2">
        <p className="text-xs text-white/85 font-medium tracking-wide">
          Trusted infrastructure: WebRTC · End-to-end encrypted · Adaptive bitrate
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
