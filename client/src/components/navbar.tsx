import { Link, useLocation } from "react-router-dom";
import { Video, LayoutDashboard, Clock, CreditCard } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from "@clerk/clerk-react";

const navLinks = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Sessions", path: "/sessions", icon: Clock },
  { name: "Pricing", path: "/pricing", icon: CreditCard },
];

const Navbar = () => {
  const location = useLocation();
  const { user } = useUser();

  const displayName = user?.fullName || user?.firstName || "Guest";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/10 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#3f6212] to-[#65a30d] shadow-md shadow-lime-900/20">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Meetup<span className="text-[#65a30d]">.</span>
            </span>
          </Link>

          {/* Desktop Nav Pills */}
          <nav className="hidden items-center gap-1.5 rounded-full bg-emerald-50/60 p-1 border border-emerald-100/60 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#1e3a1e] shadow-xs border border-emerald-100/50"
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

        {/* Right: Clerk User Controls */}
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
              <button className="flex items-center gap-1.5 rounded-full bg-[#3f6212] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#365314] active:scale-95 transition-all">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex border-t border-emerald-100/60 bg-white/90 px-4 py-2 md:hidden">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold ${
                isActive
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-500 hover:text-slate-700"
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
