import BrandLogo from "./brand_logo";

interface LoaderProps {
  message?: string;
}

const Loader = ({ message = "Loading your workspace..." }: LoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1a1a1a] text-[#f3f4f6]">
      {/* Animated logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full border-2 border-[#383838] animate-pulse" />
        </div>
        <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl bg-[#242424] border border-[#383838] shadow-xl">
          <BrandLogo className="h-10 w-10" color="#10b981" />
        </div>
      </div>

      {/* Brand */}
      <h1 className="mb-3 text-2xl font-bold tracking-tight text-[#f3f4f6]">
        Viva Meeting<span className="text-[#10b981]">.</span>
      </h1>

      {/* Loading bar */}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-[#2a2a2a]">
        <div
          className="h-full rounded-full bg-[#10b981]"
          style={{ animation: "loading-slide 1.4s ease-in-out infinite" }}
        />
      </div>

      <p className="mt-4 text-sm text-[#9ca3af]">{message}</p>
    </div>
  );
};

export default Loader;
