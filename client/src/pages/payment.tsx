import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShieldCheck, Download, Smartphone, ArrowLeft, Sparkles, QrCode } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import usePageSEO from "../hooks/usePageSEO";
import BrandLogo from "../components/brand_logo";

const PaymentPage = () => {
  usePageSEO({
    title: "Make a Payment - Viva Meeting Premium",
    description: "Scan the official QR code to pay via Google Pay, PhonePe, Paytm, or any UPI app for instant Viva Meeting upgrade.",
    canonicalPath: "/payment",
  });

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const amountDisplay = billingCycle === "monthly" ? "₹699 ($8 / month)" : "₹6,400 ($76.80 / year)";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast.success("Payment details submitted successfully! Your account will be upgraded.", {
      duration: 5000,
      iconTheme: { primary: "#4d7c0f", secondary: "#ffffff" },
    });
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = "/paymentQR.jpeg";
    link.download = "viva-meeting-payment-qr.jpeg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded to your device");
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl mx-auto">
      <Toaster position="top-center" />

      {/* Top Breadcrumb Link */}
      <div className="mb-6">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Plans & Pricing</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Column: Plan Details & Instructions */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-900 shadow-xs mb-3">
              <Sparkles className="h-3.5 w-3.5 text-lime-600" />
              <span>Instant QR Payment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Upgrade to <span className="text-[#3f6212]">Premium.</span>
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Scan the QR code with any UPI app on your phone to complete your payment and activate unlimited meeting minutes, cloud recordings, and up to 100 participants.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200/80 p-1.5 shadow-xs">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-[#3f6212] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly (₹699)
            </button>
            <button
              onClick={() => setBillingCycle("annually")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                billingCycle === "annually"
                  ? "bg-[#3f6212] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual (₹6,400)</span>
              <span className="rounded-full bg-lime-100 px-1.5 py-0.5 text-[9px] font-extrabold text-[#365314]">
                -20%
              </span>
            </button>
          </div>

          {/* Key Plan Perks */}
          <div className="space-y-2.5 rounded-2xl bg-white/80 border border-slate-200/80 p-4 shadow-xs">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
              Included in this upgrade:
            </div>
            {[
              "Up to 100 participants in high definition",
              "Unlimited meeting duration (no 40-minute timeout)",
              "Priority audio clarity with crystal mic synthesizer",
              "Live captions with real-time Hindi-to-English translation",
            ].map((perk) => (
              <div key={perk} className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="h-4 w-4 text-[#4d7c0f] shrink-0" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="h-4 w-4 text-[#3f6212]" />
            <span>End-to-end verified transaction & immediate activation</span>
          </div>
        </div>

        {/* Right Column: QR Code Card & Verification */}
        <div className="md:col-span-6">
          <div className="relative rounded-3xl bg-[#0b170e] border border-emerald-800/60 p-6 sm:p-8 text-white shadow-2xl shadow-emerald-950/30">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-500/20 text-lime-400 border border-lime-500/30">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Scan to Pay</h3>
                  <p className="text-[11px] text-emerald-300/80">{amountDisplay}</p>
                </div>
              </div>
              <span className="rounded-full bg-lime-500/20 text-lime-300 border border-lime-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                UPI QR
              </span>
            </div>

            {!isSubmitted ? (
              <div className="space-y-4">
                {/* QR Code Graphic Container */}
                <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-white p-2.5 shadow-2xl flex items-center justify-center">
                  <img
                    src="/paymentQR.jpeg"
                    alt="Official Payment QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  {/* Corner accents */}
                  <div className="pointer-events-none absolute top-1 left-1 h-4 w-4 border-t-2 border-l-2 border-lime-500" />
                  <div className="pointer-events-none absolute top-1 right-1 h-4 w-4 border-t-2 border-r-2 border-lime-500" />
                  <div className="pointer-events-none absolute bottom-1 left-1 h-4 w-4 border-b-2 border-l-2 border-lime-500" />
                  <div className="pointer-events-none absolute bottom-1 right-1 h-4 w-4 border-b-2 border-r-2 border-lime-500" />
                </div>

                {/* Instructions */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-300 font-medium">
                    <Smartphone className="h-3.5 w-3.5 text-lime-400" />
                    <span>Works with GPay, PhonePe, Paytm, BHIM, CRED</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-lime-400 hover:text-lime-300 font-semibold hover:underline cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download QR Code Image</span>
                  </button>
                </div>

                {/* Confirmation Input */}
                <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-white/10">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1">
                      UTR / Transaction Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 4289XXXXXXXX"
                      className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3f6212] hover:bg-[#4d7c0f] py-3 text-xs font-bold text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="h-4 w-4 text-lime-300" />
                    <span>I Have Completed the Payment</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Success View */
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/40">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-bold text-white">Payment Submitted</h4>
                <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                  Thank you! Your payment verification has been received. Your upgrade will be applied to your account.
                </p>
                {utrNumber && (
                  <div className="inline-block rounded-lg bg-black/50 border border-white/10 px-3 py-1 font-mono text-[11px] text-lime-300">
                    Ref ID: {utrNumber}
                  </div>
                )}
                <div className="pt-4">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center rounded-xl bg-lime-600 hover:bg-lime-500 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all"
                  >
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
