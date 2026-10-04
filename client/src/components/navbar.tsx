import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Clock, CreditCard } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from "@clerk/clerk-react";
import BrandLogo from "./brand_logo";

const navLinks = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 rounded-2xl border border-[#383838] bg-[#242424] shadow-md pointer-events-auto transition-all">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95 group"
          >
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-[#2a2a2a] border border-[#383838] shadow-xs group-hover:border-[#4a4a4a] transition-colors">
              <BrandLogo className="h-5 w-5" color="#10b981" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              VIVA<span className="text-[#10b981]"> Meeting</span>
            </span>
          </Link>

          {/* Desktop Nav Pills */}
          <nav className="hidden items-center gap-1 rounded-full bg-[#1a1a1a] p-1 border border-[#383838] md:flex">
            {navLinks.map((link) => {
              const isActive =
                link.path === "/"
                  ? location.pathname === "/" || location.pathname === "/dashboard"
                  : location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#2a2a2a] text-white shadow-xs border border-[#4a4a4a]"
                      : "text-[#9ca3af] hover:text-white"
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
            <span className="hidden text-xs text-[#9ca3af] sm:inline-block">
              Welcome, <strong className="font-semibold text-white">{displayName}</strong>
            </span>
            <div className="flex items-center">
              <UserButton
                afterSignOutUrl="/login"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 ring-2 ring-[#10b981]/30 shadow-xs",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex items-center gap-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] px-4 py-1.5 text-xs font-medium text-white shadow-sm active:scale-95 transition-all cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile Navigation Dock */}
      <div className="mx-auto mt-2 flex max-w-sm items-center justify-around rounded-full border border-[#383838] bg-[#242424] px-3 py-1.5 shadow-md md:hidden pointer-events-auto">
        {navLinks.map((link) => {
          const isActive =
            link.path === "/"
              ? location.pathname === "/" || location.pathname === "/dashboard"
              : location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#2a2a2a] text-[#34d399] border border-[#4a4a4a]"
                  : "text-[#9ca3af] hover:text-white"
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
