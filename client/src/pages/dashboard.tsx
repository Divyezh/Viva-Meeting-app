import { useState, useEffect } from "react";
import {
  Plus,
  ArrowRight,
  Shield,
  Keyboard,
  Crown,
  Calendar,
  Mail,
  BarChart2,
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import { getSavedMeetings } from "../utils/session_storage";
import NewMeetingModal from "../components/meeting/new_meeting_modal";
import JoinMeetingModal from "../components/meeting/join_meeting_modal";

const Dashboard = () => {
  const { user } = useUser();
  const [meetingId, setMeetingId] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isJoinMeetingModalOpen, setIsJoinMeetingModalOpen] = useState(false);

  const savedMeetings = getSavedMeetings();
  const meetingsUsed = savedMeetings.length;
  const meetingsLimit = 30;

  const activeUserName = user?.fullName || user?.firstName || "Divyesh Soni";
  const activeUserEmail = user?.primaryEmailAddress?.emailAddress || "divyesh@meetup.app";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenNewMeeting = () => {
    setIsNewMeetingModalOpen(true);
  };

  const handleJoinMeeting = () => {
    setIsJoinMeetingModalOpen(true);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="relative w-full py-8 md:py-16 overflow-hidden">
      <Toaster position="top-center" />

      {/* New Meeting Configuration Modal */}
      <NewMeetingModal
        isOpen={isNewMeetingModalOpen}
        onClose={() => setIsNewMeetingModalOpen(false)}
        defaultUserName={activeUserName}
      />

      {/* Join Meeting Configuration Modal */}
      <JoinMeetingModal
        isOpen={isJoinMeetingModalOpen}
        onClose={() => setIsJoinMeetingModalOpen(false)}
        initialMeetingId={meetingId}
        defaultUserName={activeUserName}
      />

      {/* Decorative luminous orbital glow in background inspired by reference */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-137.5 w-137.5 -translate-x-1/2 rounded-full bg-linear-to-b from-emerald-200/40 via-lime-200/25 to-transparent blur-3xl opacity-70" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ─── Left Column: Hero & Action Controls ─── */}
          <div className="lg:col-span-7">
            {/* Small pill badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 shadow-xs backdrop-blur-md">
              <Shield className="h-3.5 w-3.5 text-[#4d7c0f]" />
              Secure Peer-to-Peer Encryption
            </div>

            {/* Headline */}
            <h1 className="mb-4 font-display text-4xl font-extralight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight">
              Online meeting with high quality video calls.
              <span className="block font-semibold text-[#4d7c0f]">Built for everyone.</span>
            </h1>

            {/* Supporting paragraph */}
            <p className="mb-8 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
              Crystal clear HD video, ultra-low latency audio, and seamless
              real-time messaging — all in one unified platform.
            </p>

            {/* Action Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Primary button: New Meeting */}
              <button
                onClick={handleOpenNewMeeting}
                className="group flex items-center justify-center gap-2 rounded-full bg-[#3f6212] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#3f6212]/20 transition-all hover:bg-[#365314] hover:shadow-lg hover:shadow-lime-900/30 active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                New Meeting
              </button>

              {/* Input field + Join Button Group */}
              <div className="flex flex-1 items-center gap-2">
                <div className="flex flex-1 items-center gap-2.5 rounded-full border border-emerald-200/80 bg-white/95 px-4 py-2.5 shadow-xs focus-within:border-[#65a30d] focus-within:ring-2 focus-within:ring-lime-100">
                  <Keyboard className="h-4 w-4 text-emerald-700/60 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter meeting code (e.g. abc-def-ghi)"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
                    className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none sm:text-sm"
                  />
                </div>

                <button
                  onClick={handleJoinMeeting}
                  className="flex items-center gap-1.5 rounded-full bg-[#142417] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950/20 transition-all hover:bg-[#1e3820] hover:shadow-lg active:scale-95 shrink-0 cursor-pointer"
                >
                  Join
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ─── Right Column: Floating Status & Clock Card ─── */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            {/* Concentric orbital decorative rings behind card like reference */}
            <div className="pointer-events-none absolute -inset-6 -z-10 flex items-center justify-center">
              <div className="h-80 w-80 rounded-full border border-emerald-300/30 opacity-60 animate-pulse" />
              <div className="absolute h-95 w-95 rounded-full border border-lime-300/20 opacity-50" />
            </div>

            <div className="glass-panel w-full max-w-sm rounded-3xl p-6 sm:p-7">
              {/* Greeting */}
              <div className="mb-4">
                <span className="text-xs font-medium text-slate-500">Hi,</span>
                <h2 className="text-xl font-bold text-slate-900">
                  {activeUserName}
                </h2>
              </div>

              {/* Live Time Display */}
              <div className="mb-5 rounded-2xl bg-emerald-50/50 p-4 border border-emerald-100/70">
                <div className="font-mono text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {formatTime(currentTime)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#4d7c0f]">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(currentTime)}
                </div>
              </div>

              {/* Logged in Info */}
              <div className="mb-5 flex items-center justify-between border-b border-emerald-100/60 pb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 truncate mr-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activeUserEmail}</span>
                </div>
                <span
                  className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 bg-[#3f6212] text-white"
                >
                  <Crown className="h-3 w-3" />
                  Free Plan
                </span>
              </div>

              {/* Stat Sub-Card */}
              <div className="rounded-2xl bg-white/70 border border-emerald-100/60 p-4 shadow-2xs">
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <BarChart2 className="h-3.5 w-3.5 text-[#4d7c0f]" />
                    Monthly Meetings
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {meetingsUsed} / {meetingsLimit}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 mt-2">
                  {meetingsUsed} Created{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({meetingsLimit - meetingsUsed} remaining)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100/70">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#4d7c0f] to-[#84cc16] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, (meetingsUsed / meetingsLimit) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Art / Capability Ribbon on Dark Olive Shader ─── */}
        <div className="mt-14 sm:mt-20 pt-8 border-t border-emerald-500/20 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200/80 mb-5">
            Enterprise-Grade Real-Time Video Infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-950/40 px-4 py-2 text-xs font-medium text-emerald-200 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Ultra-Low Latency WebRTC
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-950/40 px-4 py-2 text-xs font-medium text-emerald-200 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-lime-400" />
              End-to-End Encrypted Media
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-950/40 px-4 py-2 text-xs font-medium text-emerald-200 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Lossless Screen Sharing
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-950/40 px-4 py-2 text-xs font-medium text-emerald-200 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-lime-300" />
              Dynamic Adaptive Bitrate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
