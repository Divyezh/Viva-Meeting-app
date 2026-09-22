import BrandLogo from "./brand_logo";

interface LoaderProps {
  message?: string;
}

const Loader = ({ message = "Loading your workspace..." }: LoaderProps) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      {/* Animated logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full border-2 border-emerald-200 animate-pulse" />
        </div>
        <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-lg shadow-lime-900/15">
          <BrandLogo className="h-10 w-10" color="#4d7c0f" />
        </div>
      </div>

      {/* Brand */}
      <h1 className="mb-3 text-2xl font-bold tracking-tight text-surface-900">
        Viva Meeting<span className="text-[#65a30d]">.</span>
      </h1>

      {/* Loading bar */}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-100">
        <div
          className="h-full rounded-full bg-[#4d7c0f]"
          style={{ animation: "loading-slide 1.4s ease-in-out infinite" }}
        />
      </div>

      <p className="mt-4 text-sm text-surface-400">{message}</p>
    </div>
  );
};

export default Loader;
