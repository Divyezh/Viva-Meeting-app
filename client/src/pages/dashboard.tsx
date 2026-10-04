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
    title: "Viva Meeting - Free HD Video Calling & Instant Online Conferencing",
    description:
      "Host and join instant HD video meetings with Viva Meeting. Crystal-clear video, screen sharing, waiting room security, and live Hindi-to-English translation. Zero downloads required.",
    canonicalPath: "/",
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

      {/* ─── Hero Block: Upper Dark Charcoal Section ─── */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-2 sm:pt-6">
        {/* Quiet meta/status pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#383838] bg-[#242424] px-3.5 py-1 text-xs font-medium text-[#d1d5db] shadow-xs">
          <Shield className="h-3.5 w-3.5 text-[#10b981]" />
          <span>Secure peer-to-peer video</span>
        </div>

        {/* Headline: Clean typography on dark charcoal, key phrase highlighted in accent */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
          <span className="font-extralight">Online meetings with high quality video calls.</span>{" "}
          <span className="block font-semibold text-[#10b981]">Built for everyone.</span>
        </h1>

        {/* Supporting paragraph */}
        <p className="text-base sm:text-lg text-[#9ca3af] max-w-xl mx-auto leading-relaxed">
          Connect instantly with teammates and clients in crystal-clear HD video with zero downloads
          required.
        </p>

        {/* Call to Action: 1 Primary CTA + Quieter Secondary Input */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {/* Primary CTA Button: Solid Accent Fill */}
          <button
            onClick={handleOpenNewMeeting}
            className="flex items-center justify-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] text-white px-7 py-3 text-sm font-medium shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Start Instant Meeting</span>
          </button>

          {/* Secondary Quiet Join Input */}
          <form
            onSubmit={handleJoinSubmit}
            className="flex items-center gap-2 rounded-full border border-[#383838] bg-[#242424] px-4 py-2 text-xs text-white shadow-xs focus-within:border-[#10b981] transition-all"
          >
            <input
              type="text"
              placeholder="or enter code"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-white placeholder-[#9ca3af] outline-none w-28 sm:w-32"
            />
            <button
              type="submit"
              disabled={!meetingId.trim()}
              className="text-[#10b981] hover:text-[#34d399] font-semibold disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Join</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ─── Hero Visual: Divyesh Soni Live Stage + Real-Time Clock ─── */}
      <div className="mt-12 sm:mt-16 w-full max-w-3xl mx-auto">
        <div className="rounded-3xl border border-[#383838] bg-[#242424] p-4 sm:p-6 shadow-xl">
          {/* Header Bar with Live Clock, Day & Date */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 pb-3 border-b border-[#383838]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-light tracking-tight text-white tabular-nums">
                <Clock className="h-5 w-5 text-[#10b981] shrink-0" />
                <span>{formattedTime}</span>
              </div>
              <div className="h-6 w-px bg-[#383838] hidden sm:block" />
              <div className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[#9ca3af]">
                <Calendar className="h-3.5 w-3.5 text-[#10b981] shrink-0" />
                <span className="font-semibold text-[#d1d5db]">{formattedDay}</span>, {formattedDate}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-[#2a2a2a] border border-[#383838] px-3.5 py-1 text-xs font-medium text-[#10b981]">
              <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Ready to Connect</span>
            </div>
          </div>

          {/* Single Divyesh Soni Video Tile Preview */}
          <div className="relative aspect-video w-full rounded-2xl bg-[#1e1e1e] border border-[#383838] p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-md">
            {/* Top Bar on Video Tile */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-[#242424] border border-[#383838] px-3 py-1 text-xs font-medium text-white shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="font-semibold text-white">{activeUserName} (You)</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#10b981] bg-[#2a2a2a] border border-[#383838] px-3 py-1 rounded-full">
                <Sparkles className="h-3 w-3" />
                <span>HD Video Enabled</span>
              </div>
            </div>

            {/* Center: Divyesh Soni Avatar & Status */}
            <div className="my-auto flex flex-col items-center justify-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#2a2a2a] border border-[#383838] flex items-center justify-center text-2xl sm:text-3xl font-semibold text-white shadow-md">
                  {activeUserName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 flex h-4 w-4 rounded-full bg-[#10b981] border-2 border-[#1e1e1e]" />
              </div>

              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {activeUserName}
                </h3>
                <p className="text-xs text-[#9ca3af] mt-0.5">
                  Microphone and camera are configured and ready
                </p>
              </div>
            </div>

            {/* Bottom Bar: Quick Audio/Video indicators */}
            <div className="flex items-center justify-between pt-2 border-t border-[#383838] text-xs">
              <span className="text-[11px] text-[#9ca3af] font-medium">
                Click <span className="font-semibold text-white">Start Instant Meeting</span> above to begin
              </span>

              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] border border-[#383838] text-[#10b981]"
                  title="Microphone Active"
                >
                  <Mic className="h-4 w-4" />
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2a2a2a] border border-[#383838] text-[#10b981]"
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
        <p className="text-xs text-[#9ca3af] font-medium tracking-wide">
          Trusted infrastructure: WebRTC · End-to-end encrypted · Adaptive bitrate
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
