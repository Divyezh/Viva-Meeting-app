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
import { extractRoomId, prepareGuestJoin } from "../utils/meetingJoin";

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
  const [isJoining, setIsJoining] = useState(false);
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
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.defaultMuted = true;
          videoRef.current.volume = 0;
          videoRef.current.srcObject = new MediaStream(stream.getVideoTracks());
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
    if (isJoining) return;
    const cleanId = extractRoomId(meetingCode);

    if (!cleanId || cleanId.length < 3) {
      toast.error("Please enter a valid meeting code or link");
      return;
    }

    setIsJoining(true);

    prepareGuestJoin({
      roomId: cleanId,
      userName,
      muted: isMicMuted,
      cameraOff: isCameraOff,
    });

    // Stop local preview tracks before entering room
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }

    toast.success("Connecting to meeting room...", {
      iconTheme: { primary: "#10b981", secondary: "#ffffff" },
    });

    setTimeout(() => {
      navigate(`/meeting/${cleanId}`);
    }, 160);
  };

  return (
    <div className="bg-[#1a1a1a] text-[#f3f4f6] relative min-h-screen flex flex-col justify-between p-4 sm:p-6 overflow-hidden selection:bg-[#10b981]/30 selection:text-white">
      <Toaster position="top-center" />

      {/* Top Navbar Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a2a2a] border border-[#383838] shadow-xs">
            <BrandLogo className="h-6 w-6" color="#10b981" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Viva Meeting<span className="text-[#10b981]">.</span>
          </span>
        </Link>

        {isSignedIn ? (
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full bg-[#2a2a2a] border border-[#383838] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#333333] transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all"
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
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#1e1e1e] border border-[#383838] shadow-xl flex items-center justify-center">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2a2a2a] border border-[#383838] text-white shadow-md text-2xl font-semibold">
                    {userName.trim() ? userName.trim().charAt(0).toUpperCase() : "G"}
                  </div>
                  <span className="mt-3 text-xs font-medium text-[#9ca3af]">Camera is off</span>
                </div>
              )}

              {/* Status Badge in Video Preview */}
              <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                <span className="rounded-md bg-[#242424]/90 px-3 py-1 text-[11px] font-medium text-white border border-[#383838] flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${isMicMuted ? "bg-[#ea4335]" : "bg-[#10b981] animate-pulse"}`}
                  />
                  {userName.trim() ? userName.trim() : "Guest Preview"}
                </span>
              </div>

              {/* Floating Quick Media Toggles inside Video Container */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#242424]/90 p-2 rounded-full border border-[#383838] shadow-lg">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-95 cursor-pointer ${
                    isMicMuted
                      ? "bg-[#ea4335] text-white"
                      : "bg-[#333333] hover:bg-[#3d3d3d] text-white"
                  }`}
                  title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMicMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-95 cursor-pointer ${
                    isCameraOff
                      ? "bg-[#ea4335] text-white"
                      : "bg-[#333333] hover:bg-[#3d3d3d] text-white"
                  }`}
                  title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-[#9ca3af] font-medium">
              <span>{isMicMuted ? "Mic is muted" : "Mic is ready"}</span>
              <span>•</span>
              <span>{isCameraOff ? "Camera is off" : "Camera is ready"}</span>
            </div>
          </div>

          {/* Right Column: Join Form Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-[#242424] border border-[#383838] p-6 sm:p-8 shadow-xl">
              {/* Header */}
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#2a2a2a] border border-[#383838] px-2.5 py-0.5 text-[11px] font-medium text-[#10b981] mb-2.5">
                  <Sparkles className="h-3 w-3" />
                  <span>Instant Guest Join</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Join a Meeting
                </h1>
                <p className="mt-1 text-xs text-[#9ca3af] leading-relaxed">
                  Enter your meeting ID or paste invite link to join right away. No Google sign-in required.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleJoin} className="space-y-4">
                {/* Meeting Code / Link Input */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
                    Meeting ID or Link
                  </label>
                  <div className="relative">
                    <Keyboard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10b981]" />
                    <input
                      type="text"
                      required
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      placeholder="e.g. abc-def-ghi or paste link"
                      className="font-mono w-full rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 pl-10 pr-4 text-sm font-semibold text-white placeholder:text-[#9ca3af] outline-none transition-colors focus:border-[#10b981]"
                    />
                  </div>
                </div>

                {/* Display Name Input */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#d1d5db]">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#10b981]" />
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full rounded-xl bg-[#1e1e1e] border border-[#383838] py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-[#9ca3af] outline-none transition-colors focus:border-[#10b981]"
                    />
                  </div>
                </div>

                {/* Join CTA Button */}
                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] py-3 text-sm font-medium text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-75"
                >
                  {isJoining ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Connecting to Meeting...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Meeting Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Extra Info */}
              <div className="mt-5 pt-4 border-t border-[#383838] flex items-center justify-between text-[11px] text-[#9ca3af]">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-[#10b981]" />
                  <span>Encrypted WebRTC</span>
                </div>
                {!isSignedIn && (
                  <Link
                    to="/login"
                    className="font-medium text-[#10b981] hover:text-[#34d399] transition-colors"
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
      <footer className="relative z-10 text-center py-2 text-[11px] text-[#9ca3af]">
        Viva Meeting &copy; {new Date().getFullYear()} · High Performance WebRTC Conferencing
      </footer>
    </div>
  );
};

export default JoinPage;
