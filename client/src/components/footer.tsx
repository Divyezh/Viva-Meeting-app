import { Link } from "react-router-dom";
import { Shield, Scale } from "lucide-react";
import BrandLogo from "./brand_logo";

const Footer = () => {
  return (
    <footer className="w-full py-5 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black/30 backdrop-blur-md relative z-10">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/90">
        {/* Left: Brand & Copyright */}
        <div className="flex items-center gap-2">
          <BrandLogo className="h-4 w-4" color="#a3e635" />
          <span className="font-bold text-white tracking-wide">
            VIVA<span className="text-lime-400">.</span>
          </span>
          <span className="text-white/40">·</span>
          <span className="font-medium text-white/85">
            © {new Date().getFullYear()} Viva Meeting. All rights reserved.
          </span>
        </div>

        {/* Right: Legal & Policy Links */}
        <div className="flex items-center gap-4 sm:gap-6 font-medium">
          <Link
            to="/terms"
            className="flex items-center gap-1.5 text-white/85 hover:text-white hover:underline transition-colors"
          >
            <Scale className="h-3.5 w-3.5 text-lime-400" />
            <span>Terms of Service</span>
          </Link>

          <span className="text-white/30">·</span>

          <Link
            to="/privacy"
            className="flex items-center gap-1.5 text-white/85 hover:text-white hover:underline transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-lime-400" />
            <span>Privacy Policy</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
