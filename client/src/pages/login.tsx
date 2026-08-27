import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { Video, Shield } from "lucide-react";

const Login = () => {
  const { isSignedIn } = useAuth();

  // If already signed in, redirect straight to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bg-app-gradient relative flex min-h-screen items-center justify-center p-4 py-12 overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-137.5 w-137.5 -translate-x-1/2 rounded-full bg-linear-to-b from-emerald-200/40 via-lime-200/20 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Concentric orbital rings decoration */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full border border-emerald-300/20 opacity-50 animate-pulse" />
        <div className="absolute h-137.5 w-137.5 rounded-full border border-lime-300/15 opacity-40" />
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#3f6212] to-[#65a30d] shadow-lg shadow-lime-900/25">
            <Video className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Meetup<span className="text-[#65a30d]">.</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ultra-low latency WebRTC video conferencing
          </p>
        </div>

        {/* Official Clerk Sign In Component */}
        <div className="w-full flex justify-center">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Shield className="h-3.5 w-3.5 text-[#4d7c0f]" />
          <span>Secured by Clerk Authentication & End-to-End WebRTC</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
