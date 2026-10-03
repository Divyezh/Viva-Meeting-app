import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Keyboard,
  User,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowRight,
  Shield,
  Sparkles,
  LogIn,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import BrandLogo from "../components/brand_logo";
import usePageSEO from "../hooks/usePageSEO";
import { useUser } from "@clerk/clerk-react";

const extractRoomId = (input: string) => {
  let cleaned = input.trim();
  if (cleaned.includes("/meeting/")) {
    cleaned = cleaned.split("/meeting/")[1].split("?")[0].split("#")[0];
  }
  return cleaned.replace(/[^a-zA-Z0-9_-]/g, "");
};

const JoinPage = () => {
  const { meetingId: urlMeetingId } = useParams<{ meetingId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  const queryRoomId = searchParams.get("id") || searchParams.get("room") || urlMeetingId || "";

  usePageSEO({
    title: "Join Meeting | Viva Meeting",
    description: "Join a video meeting instantly with meeting ID or invite link without signing in.",
    canonicalPath: "/join",
  });

  const [meetingCode, setMeetingCode] = useState(queryRoomId);
  const [userName, setUserName] = useState(() => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName) return user.firstName;
    return typeof window !== "undefined" ? localStorage.getItem("meeting_user_name") || "" : "";
  });

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync user name if Clerk loads later
  useEffect(() => {
    if (user && !userName) {
      setUserName(user.fullName || user.firstName || "");
    }
  }, [user, userName]);

  // Handle local camera preview
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: true,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        stream.getVideoTracks().forEach((t) => (t.enabled = !isCameraOff));
        stream.getAudioTracks().forEach((t) => (t.enabled = !isMicMuted));
      } catch (err) {
        console.warn("Camera preview not available:", err);
        setIsCameraOff(true);
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update track state when toggles change
  const handleToggleMic = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
  };

  const handleToggleCamera = () => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = !next));
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractRoomId(meetingCode);

    if (!cleanId || cleanId.length < 3) {
      toast.error("Please enter a valid meeting code or link");
      return;
    }

    const trimmedName = userName.trim() || "Guest Participant";

    // Save preferences for the meeting room
    localStorage.setItem("meeting_user_name", trimmedName);
    localStorage.setItem("prejoin_muted", isMicMuted ? "true" : "false");
    localStorage.setItem("prejoin_camera_off", isCameraOff ? "true" : "false");
    sessionStorage.setItem(`prejoin_confirmed_${cleanId}`, "true");
    sessionStorage.removeItem(`is_host_${cleanId}`);
    localStorage.removeItem(`is_host_${cleanId}`);

    // Stop local preview tracks before entering room
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    toast.success("Connecting to meeting room...", {
      iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
    });

    navigate(`/meeting/${cleanId}`);
  };

  return (
    <div className="bg-app-gradient relative min-h-screen flex flex-col justify-between p-4 sm:p-6 overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      <Toaster position="top-center" />

      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-137.5 w-137.5 rounded-full bg-linear-to-b from-emerald-200/40 via-lime-200/20 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Top Navbar Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 border border-emerald-200/80 shadow-md shadow-lime-900/10 backdrop-blur-md">
            <BrandLogo className="h-6 w-6" color="#4d7c0f" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Viva Meeting<span className="text-[#65a30d]">.</span>
          </span>
        </Link>

        {isSignedIn ? (
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-4 py-1.5 text-xs font-semibold text-[#3f6212] hover:bg-emerald-100 transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-full bg-[#3f6212] hover:bg-[#365314] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-all"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </header>

      {/* Main Join Container */}
      <main className="relative z-10 mx-auto w-full max-w-4xl my-auto py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Live Camera Preview & Media Controls */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-emerald-900/30 shadow-2xl flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  isCameraOff ? "opacity-0" : "opacity-100"
                }`}
              />

              {/* Camera Off Avatar Overlay */}
              {isCameraOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-slate-900 to-slate-950">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 shadow-xl text-2xl font-bold">
                    {userName.trim() ? userName.trim().charAt(0).toUpperCase() : "G"}
                  </div>
                  <span className="mt-3 text-xs font-medium text-slate-400">Camera is off</span>
                </div>
              )}

              {/* Status Badge in Video Preview */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white border border-white/10 flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${isMicMuted ? "bg-red-400" : "bg-lime-400 animate-pulse"}`}
                  />
                  {userName.trim() ? userName.trim() : "Guest Preview"}
                </span>
              </div>

              {/* Floating Quick Media Toggles inside Video Container */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/15 shadow-lg">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 ${
                    isMicMuted
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-95 ${
                    isCameraOff
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span>{isMicMuted ? "Mic is muted" : "Mic is ready"}</span>
              <span>•</span>
              <span>{isCameraOff ? "Camera is off" : "Camera is ready"}</span>
            </div>
          </div>

          {/* Right Column: Join Form Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl">
              {/* Header */}
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-[#3f6212] mb-2.5">
                  <Sparkles className="h-3 w-3 text-[#65a30d]" />
                  <span>Instant Guest Join</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Join a Meeting
                </h1>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Enter your meeting ID or paste invite link to join right away. No Google sign-in required.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleJoin} className="space-y-4">
                {/* Meeting Code / Link Input */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Meeting ID or Link
                  </label>
                  <div className="relative">
                    <Keyboard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4d7c0f]" />
                    <input
                      type="text"
                      required
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      placeholder="e.g. abc-def-ghi or paste link"
                      className="font-mono w-full rounded-2xl bg-[#f8fcf8] border border-emerald-900/15 py-3 pl-10 pr-4 text-sm font-semibold text-[#142417] placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#3f6212] focus:ring-3 focus:ring-[#3f6212]/10 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Display Name Input */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4d7c0f]" />
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-2xl bg-[#f8fcf8] border border-emerald-900/15 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-[#3f6212] focus:ring-3 focus:ring-[#3f6212]/10 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Join CTA Button */}
                <button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#3f6212] hover:bg-[#365314] py-3.5 text-sm font-bold text-white shadow-lg shadow-lime-900/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Join Meeting Now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Extra Info */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#4d7c0f]" />
                  <span>Encrypted WebRTC</span>
                </div>
                {!isSignedIn && (
                  <Link
                    to="/login"
                    className="font-semibold text-[#3f6212] hover:underline"
                  >
                    Want to host? Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-2 text-[11px] text-slate-500">
        Viva Meeting &copy; {new Date().getFullYear()} · High Performance WebRTC Conferencing
      </footer>
    </div>
  );
};

export default JoinPage;
