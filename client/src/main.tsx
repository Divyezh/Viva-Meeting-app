import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZW5hYmxlZC1zaGFkLTY1ODkuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  console.warn(
    "Using fallback Clerk publishable key. For production, set VITE_CLERK_PUBLISHABLE_KEY in Vercel Environment Variables."
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6faf5] p-6 text-center text-slate-800">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
            <h2 className="text-xl font-bold text-red-600">Application Error</h2>
            <p className="mt-3 text-sm text-slate-600">
              {this.state.error?.message || "An unexpected error occurred while loading the app."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#3f6212] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#365314]"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    logoPlacement: "inside" as const,
  },
  variables: {
    colorPrimary: "#3f6212",
    colorText: "#142417",
    colorTextSecondary: "#64748b",
    colorBackground: "#ffffff",
    colorInputBackground: "#f8fcf8",
    colorInputText: "#142417",
    borderRadius: "1rem",
    colorDanger: "#dc2626",
    colorSuccess: "#16a34a",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  elements: {
    card: "w-full rounded-3xl border border-emerald-900/10 shadow-2xl bg-white/95 backdrop-blur-xl",
    headerTitle: "text-2xl font-bold tracking-tight text-slate-900",
    headerSubtitle: "text-xs text-slate-500 mt-1",
    socialButtonsBlockButton:
      "border border-emerald-900/15 hover:border-emerald-700/40 hover:bg-emerald-50/60 rounded-2xl py-2.5 transition-all shadow-xs",
    socialButtonsBlockButtonText: "font-semibold text-slate-700 text-sm",
    socialButtonsProviderIcon: "w-5 h-5",
    dividerRow: "my-4",
    dividerLine: "bg-emerald-900/10",
    dividerText: "text-xs uppercase tracking-wider text-slate-400 font-medium",
    formFieldLabel: "text-xs font-semibold text-slate-700 mb-1.5",
    formFieldInput:
      "rounded-xl border border-emerald-900/20 bg-[#f8fcf8] text-sm py-2.5 px-3.5 focus:border-[#3f6212] focus:ring-2 focus:ring-[#3f6212]/15 text-slate-900 transition-all",
    formButtonPrimary:
      "rounded-xl bg-[#3f6212] hover:bg-[#365314] text-white font-semibold py-2.5 shadow-md shadow-lime-900/20 hover:shadow-lg transition-all active:scale-[0.98]",
    footerAction: "mt-4 pt-2 border-t border-emerald-900/5",
    footerActionText: "text-xs text-slate-500",
    footerActionLink: "text-xs font-bold text-[#3f6212] hover:text-[#365314] hover:underline",
    identityPreviewText: "text-sm font-medium text-slate-800",
    identityPreviewEditButton: "text-[#3f6212] hover:text-[#365314] font-semibold text-xs",
    formFieldSuccessText: "text-xs text-emerald-600",
    formFieldErrorText: "text-xs text-red-600",
    userButtonPopoverCard:
      "rounded-2xl border border-emerald-900/10 shadow-2xl bg-white/95 backdrop-blur-xl",
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/login"
        appearance={clerkAppearance}
      >
        <App />
      </ClerkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
