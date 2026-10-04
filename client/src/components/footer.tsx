import { Link } from "react-router-dom";
import { Shield, Scale } from "lucide-react";
import BrandLogo from "./brand_logo";

const Footer = () => {
  return (
    <footer className="w-full py-5 px-4 sm:px-6 lg:px-8 border-t border-[#383838] bg-[#1a1a1a] relative z-10">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9ca3af]">
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <BrandLogo className="h-4 w-4" color="#10b981" />
          <span className="font-bold text-white tracking-wide">
            VIVA<span className="text-[#10b981]">.</span>
          </span>
          <span className="text-[#4a4a4a]">·</span>
          <span className="font-medium text-[#9ca3af]">
            © {new Date().getFullYear()} Viva Meeting. All rights reserved.
          </span>
        </div>

        {/* Right: Navigation & Legal Links */}
        <div className="flex items-center gap-3 sm:gap-5 font-medium flex-wrap justify-center">
          <Link
            to="/pricing"
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <span className="text-[#4a4a4a]">·</span>
          <Link
            to="/payment"
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            Payment
          </Link>
          <span className="text-[#4a4a4a]">·</span>
          <Link
            to="/sessions"
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            Sessions
          </Link>
          <span className="text-[#4a4a4a]">·</span>
          <Link
            to="/terms"
            className="flex items-center gap-1.5 text-[#9ca3af] hover:text-white transition-colors"
          >
            <Scale className="h-3.5 w-3.5 text-[#10b981]" />
            <span>Terms</span>
          </Link>
          <span className="text-[#4a4a4a]">·</span>
          <Link
            to="/privacy"
            className="flex items-center gap-1.5 text-[#9ca3af] hover:text-white transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-[#10b981]" />
            <span>Privacy</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
