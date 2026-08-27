import { Video } from "lucide-react";

interface LoaderProps {
  message?: string;
}

const Loader = ({ message = "Loading your workspace..." }: LoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Animated logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full border-2 border-brand-200 animate-pulse-soft" />
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3f6212] shadow-lg shadow-lime-900/20">
          <Video className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Brand */}
      <h1 className="mb-3 text-2xl font-bold tracking-tight text-surface-900">
        Meetup<span className="text-[#65a30d]">.</span>
      </h1>

      {/* Loading bar */}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-100">
        <div
          className="h-full rounded-full bg-[#4d7c0f]"
          style={{ animation: "loading-slide 1.4s ease-in-out infinite" }}
        />
      </div>

      <p className="mt-4 text-sm text-surface-400">
        {message}
      </p>
    </div>
  );
};

export default Loader;
