import { useState } from "react";
import { Plus, ArrowRight, Shield, Mic, MicOff, Video, VideoOff } from "lucide-react";
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

  usePageSEO({
    title: "Viva Meeting - High Quality Instant Video Calls",
    description:
      "Start instant meetings, create secure room codes, and join video conferences on Viva Meeting.",
    canonicalPath: "/dashboard",
  });

  const activeUserName = user?.fullName || user?.firstName || "Divyesh Soni";

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

      {/* ─── Hero Visual: Realistic Video Tile Grid on Downward Olive-Pista Shader ─── */}
      <div className="mt-12 sm:mt-16 w-full max-w-3xl mx-auto">
        <div className="rounded-3xl border border-white/80 bg-white/85 p-3.5 sm:p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
          {/* 4 Participant Mock Video Tiles (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {/* Tile 1: Active User (Host) */}
            <div className="relative aspect-video rounded-2xl bg-linear-to-br from-[#1b3d22] via-[#122818] to-[#0a180f] border border-lime-400/40 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden shadow-inner">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-white truncate">{activeUserName} (You)</span>
                <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-pulse" />
              </div>
              <div className="my-auto flex items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#3f6212] border border-lime-300/40 flex items-center justify-center text-sm font-bold text-white shadow-md">
                  {activeUserName.charAt(0)}
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[#a3e635]">
                <Mic className="h-3.5 w-3.5" />
                <Video className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Tile 2: Participant 1 */}
            <div className="relative aspect-video rounded-2xl bg-slate-900/90 border border-white/10 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-white">Sarah Jenkins</span>
              </div>
              <div className="my-auto flex items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-800 flex items-center justify-center text-sm font-bold text-emerald-200">
                  SJ
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-slate-400">
                <MicOff className="h-3.5 w-3.5 text-red-400" />
                <Video className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Tile 3: Participant 2 */}
            <div className="relative aspect-video rounded-2xl bg-slate-900/90 border border-white/10 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-white">Alex Rivera</span>
              </div>
              <div className="my-auto flex items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-teal-800 flex items-center justify-center text-sm font-bold text-teal-200">
                  AR
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-slate-400">
                <Mic className="h-3.5 w-3.5 text-emerald-400" />
                <Video className="h-3.5 w-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Tile 4: Participant 3 */}
            <div className="relative aspect-video rounded-2xl bg-slate-900/90 border border-white/10 p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-white">Elena Rostova</span>
              </div>
              <div className="my-auto flex items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                  ER
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-slate-400">
                <MicOff className="h-3.5 w-3.5 text-red-400" />
                <VideoOff className="h-3.5 w-3.5 text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Infrastructure Note ─── */}
      <div className="mt-8 sm:mt-10 text-center pb-2">
        <p className="text-[11px] text-emerald-950/70 font-medium">
          Trusted infrastructure: WebRTC · End-to-end encrypted · Adaptive bitrate
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
