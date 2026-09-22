import { Link } from "react-router-dom";
import { Shield, Scale } from "lucide-react";
import BrandLogo from "./brand_logo";

const Footer = () => {
  return (
    <footer className="w-full py-5 px-4 sm:px-6 lg:px-8 border-t border-emerald-900/15 bg-black/5 backdrop-blur-xs relative z-10">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-950/80">
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <BrandLogo className="h-4 w-4" color="#2e5210" />
          <span className="font-bold text-slate-900">
            VIVA<span className="text-[#3f6212]">.</span>
          </span>
          <span className="text-emerald-950/70">·</span>
          <span className="font-medium text-emerald-950/90">
            © 2026 Viva Meeting. All rights reserved.
          </span>
        </div>

        {/* Right: Legal & Policy Links */}
        <div className="flex items-center gap-4 sm:gap-6 font-medium">
          <Link
            to="/terms"
            className="flex items-center gap-1.5 text-emerald-950/80 hover:text-slate-900 hover:underline transition-colors"
          >
            <Scale className="h-3.5 w-3.5 text-emerald-800" />
            <span>Terms of Service</span>
          </Link>

          <span className="text-emerald-900/30">·</span>

          <Link
            to="/privacy"
            className="flex items-center gap-1.5 text-emerald-950/80 hover:text-slate-900 hover:underline transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-emerald-800" />
            <span>Privacy Policy</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
