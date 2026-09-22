import { Link } from "react-router-dom";
import { Shield, Scale } from "lucide-react";
import BrandLogo from "./brand_logo";

const Footer = () => {
  return (
    <footer className="py-8 px-4 relative z-10 border-t border-emerald-900/20 bg-black/10 backdrop-blur-xs">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/70">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-4.5 w-4.5" color="#84cc16" />
          <span className="font-semibold text-white tracking-tight">VIVA<span className="text-[#84cc16]">.</span></span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>

        {/* DPDP Act Compliance & Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs">
          <Link
            to="/privacy"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Shield className="h-3 w-3 text-emerald-400" />
            <span>Privacy Policy</span>
          </Link>

          <span className="text-emerald-900/60 hidden sm:inline">·</span>

          <Link
            to="/terms"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Scale className="h-3 w-3 text-emerald-400" />
            <span>Terms of Service</span>
          </Link>

          <span className="text-emerald-900/60 hidden sm:inline">·</span>

          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium rounded-full bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5">
            DPDP Act, 2023 (India)
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
