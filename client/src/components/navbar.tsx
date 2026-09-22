import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Clock, CreditCard } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from "@clerk/clerk-react";
import BrandLogo from "./brand_logo";

const navLinks = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Sessions", path: "/sessions", icon: Clock },
  { name: "Pricing", path: "/pricing", icon: CreditCard },
];

interface NavbarProps {
  onOpenNewMeeting?: () => void;
  onOpenJoinMeeting?: () => void;
}

const Navbar = ({
  onOpenNewMeeting: _onOpenNewMeeting,
  onOpenJoinMeeting: _onOpenJoinMeeting,
}: NavbarProps) => {
  const location = useLocation();
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || "Guest";

  return (
    <header className="sticky top-3.5 z-50 w-full px-3 sm:px-6 lg:px-8 pointer-events-none">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm pointer-events-auto transition-all">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95 group"
          >
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 shadow-xs group-hover:border-emerald-300 transition-colors">
              <BrandLogo className="h-5 w-5" color="#4d7c0f" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              VIVA<span className="text-[#4d7c0f]"> Meeting</span>
            </span>
          </Link>

          {/* Desktop Nav Pills */}
          <nav className="hidden items-center gap-1 rounded-full bg-slate-100/80 p-1 border border-slate-200/60 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#1e3a1e] shadow-xs font-bold border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User Welcome & Clerk User Controls */}
        <div className="flex items-center gap-3">
          <SignedIn>
            <span className="hidden text-xs text-slate-600 sm:inline-block">
              Welcome, <strong className="font-semibold text-slate-900">{displayName}</strong>
            </span>
            <div className="flex items-center">
              <UserButton
                afterSignOutUrl="/login"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 ring-2 ring-emerald-500/20 shadow-xs",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center gap-1.5 rounded-full bg-[#3f6212] hover:bg-[#365314] px-4 py-1.5 text-xs font-semibold text-white shadow-xs active:scale-95 transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile Navigation Dock */}
      <div className="mx-auto mt-2 flex max-w-sm items-center justify-around rounded-full border border-slate-200/80 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md md:hidden pointer-events-auto">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;
