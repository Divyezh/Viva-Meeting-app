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
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1a] p-6 text-center text-[#f3f4f6]">
          <div className="w-full max-w-md rounded-2xl border border-[#383838] bg-[#242424] p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-red-400">Application Error</h2>
            <p className="mt-3 text-sm text-[#9ca3af]">
              {this.state.error?.message || "An unexpected error occurred while loading the app."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-[#10b981] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#059669] cursor-pointer"
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
    colorPrimary: "#10b981",
    colorText: "#f3f4f6",
    colorTextSecondary: "#9ca3af",
    colorBackground: "#242424",
    colorInputBackground: "#1e1e1e",
    colorInputText: "#f3f4f6",
    borderRadius: "1rem",
    colorDanger: "#ef4444",
    colorSuccess: "#10b981",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  elements: {
    card: "w-full rounded-3xl border border-[#383838] shadow-2xl bg-[#242424] text-[#f3f4f6]",
    headerTitle: "text-2xl font-bold tracking-tight text-[#f3f4f6]",
    headerSubtitle: "text-xs text-[#9ca3af] mt-1",
    socialButtonsBlockButton:
      "border border-[#383838] hover:border-[#10b981] hover:bg-[#2a2a2a] bg-[#1e1e1e] rounded-2xl py-2.5 transition-all shadow-xs",
    socialButtonsBlockButtonText: "font-semibold text-[#f3f4f6] text-sm",
    socialButtonsProviderIcon: "w-5 h-5",
    dividerRow: "my-4",
    dividerLine: "bg-[#383838]",
    dividerText: "text-xs uppercase tracking-wider text-[#9ca3af] font-medium",
    formFieldLabel: "text-xs font-semibold text-[#f3f4f6] mb-1.5",
    formFieldInput:
      "rounded-xl border border-[#383838] bg-[#1e1e1e] text-sm py-2.5 px-3.5 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] text-[#f3f4f6] transition-all",
    formButtonPrimary:
      "rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2.5 shadow-md transition-all active:scale-[0.98]",
    footerAction: "mt-4 pt-2 border-t border-[#383838]",
    footerActionText: "text-xs text-[#9ca3af]",
    footerActionLink: "text-xs font-bold text-[#34d399] hover:text-[#10b981] hover:underline",
    identityPreviewText: "text-sm font-medium text-[#f3f4f6]",
    identityPreviewEditButton: "text-[#34d399] hover:text-[#10b981] font-semibold text-xs",
    formFieldSuccessText: "text-xs text-[#10b981]",
    formFieldErrorText: "text-xs text-red-400",
    userButtonPopoverCard:
      "rounded-2xl border border-[#383838] shadow-2xl bg-[#242424] text-[#f3f4f6]",
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
