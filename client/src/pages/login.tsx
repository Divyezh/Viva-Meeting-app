import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { Shield, Video, ArrowRight } from "lucide-react";
import BrandLogo from "../components/brand_logo";
import usePageSEO from "../hooks/usePageSEO";

const Login = () => {
  const { isSignedIn } = useAuth();

  // If already signed in, redirect straight to dashboard
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  usePageSEO({
    title: "Sign In - Viva Meeting",
    description: "Sign in to Viva Meeting to start instant encrypted video calls, manage meetings, and collaborate seamlessly.",
    canonicalPath: "/login",
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 py-12 bg-[#1a1a1a] text-[#f3f4f6]">
      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#242424] border border-[#383838] shadow-md">
            <BrandLogo className="h-8 w-8" color="#10b981" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f3f4f6]">
            Viva Meeting<span className="text-[#10b981]">.</span>
          </h1>
          <p className="mt-1 text-xs text-[#9ca3af]">Ultra-low latency HD video conferencing</p>
        </div>

        {/* Quick Guest Join Banner - No Sign In Required */}
        <div className="w-full mb-4.5 rounded-2xl bg-[#242424] border border-[#383838] p-3.5 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
              <Video className="h-4.5 w-4.5" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#f3f4f6] truncate">Have a meeting ID or link?</div>
              <div className="text-[11px] text-[#34d399] font-medium truncate">Join as guest with zero sign-in</div>
            </div>
          </div>
          <Link
            to="/join"
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#10b981] hover:bg-[#059669] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
          >
            <span>Join Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Official Clerk Sign In Component */}
        <div className="w-full flex justify-center">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
            fallbackRedirectUrl="/"
            forceRedirectUrl="/"
          />
        </div>

        {/* DPDP Act 2023 Statutory Consent & Terms links */}
        <div className="mt-4 text-center text-[11px] text-[#9ca3af] max-w-xs leading-normal">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="text-[#34d399] font-semibold hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-[#34d399] font-semibold hover:underline">
            Privacy Policy
          </Link>{" "}
          governed by the DPDP Act, 2023 (India).
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-[#9ca3af]">
          <Shield className="h-3.5 w-3.5 text-[#10b981]" />
          <span>Secured by Clerk Authentication & End-to-End WebRTC</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
