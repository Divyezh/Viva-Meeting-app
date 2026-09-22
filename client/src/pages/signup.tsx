import { SignUp, useAuth } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { Shield } from "lucide-react";
import BrandLogo from "../components/brand_logo";
import usePageSEO from "../hooks/usePageSEO";

const SignUpPage = () => {
  const { isSignedIn } = useAuth();

  // If already signed in, redirect straight to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  usePageSEO({
    title: "Create an Account - Viva Meeting",
    description: "Sign up for Viva Meeting. Start free, high-definition video calls with no downloads needed.",
    canonicalPath: "/signup",
  });

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
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-white/90 border border-emerald-200/80 shadow-lg shadow-lime-900/10 backdrop-blur-md">
            <BrandLogo className="h-8 w-8" color="#4d7c0f" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Viva Meeting<span className="text-[#65a30d]">.</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Create an account to start instant video meetings
          </p>
        </div>

        {/* Official Clerk Sign Up Component */}
        <div className="w-full flex justify-center">
          <SignUp
            path="/signup"
            routing="path"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>

        {/* DPDP Act 2023 Statutory Consent & Terms links */}
        <div className="mt-4 text-center text-[11px] text-slate-500 max-w-xs leading-normal">
          By signing up, you agree to our{" "}
          <Link to="/terms" className="text-[#3f6212] font-semibold hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-[#3f6212] font-semibold hover:underline">
            Privacy Policy
          </Link>{" "}
          governed by the DPDP Act, 2023 (India).
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <Shield className="h-3.5 w-3.5 text-[#4d7c0f]" />
          <span>Secured by Clerk Authentication & End-to-End WebRTC</span>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
