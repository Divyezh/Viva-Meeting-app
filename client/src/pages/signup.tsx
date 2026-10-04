import { SignUp, useAuth } from "@clerk/clerk-react";
import { Navigate, Link } from "react-router-dom";
import { Shield } from "lucide-react";
import BrandLogo from "../components/brand_logo";
import usePageSEO from "../hooks/usePageSEO";

const SignUpPage = () => {
  const { isSignedIn } = useAuth();

  // If already signed in, redirect straight to dashboard
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  usePageSEO({
    title: "Create an Account - Viva Meeting",
    description: "Sign up for Viva Meeting. Start free, high-definition video calls with no downloads needed.",
    canonicalPath: "/signup",
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 py-12 bg-[#1a1a1a] text-[#f3f4f6]">
      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#242424] border border-[#383838] shadow-md">
            <BrandLogo className="h-8 w-8" color="#10b981" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#f3f4f6]">
            Viva Meeting<span className="text-[#10b981]">.</span>
          </h1>
          <p className="mt-1 text-xs text-[#9ca3af]">
            Create an account to start instant video meetings
          </p>
        </div>

        {/* Official Clerk Sign Up Component */}
        <div className="w-full flex justify-center">
          <SignUp
            path="/signup"
            routing="path"
            signInUrl="/login"
            fallbackRedirectUrl="/"
            forceRedirectUrl="/"
          />
        </div>

        {/* DPDP Act 2023 Statutory Consent & Terms links */}
        <div className="mt-4 text-center text-[11px] text-[#9ca3af] max-w-xs leading-normal">
          By signing up, you agree to our{" "}
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

export default SignUpPage;
