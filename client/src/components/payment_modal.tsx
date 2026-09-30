import { useState } from "react";
import { X, Check, ShieldCheck, Download, Sparkles, Smartphone, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  amount?: string;
  billingCycle?: "monthly" | "annually";
}

export const PaymentModal = ({
  isOpen,
  onClose,
  planName = "Viva Meeting Premium",
  amount = "$8 / ₹699",
  billingCycle = "monthly",
}: PaymentModalProps) => {
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast.success("Payment details submitted successfully! Your account will be upgraded shortly.", {
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
    toast.success("QR code downloaded");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0f1711] border border-emerald-800/50 p-6 sm:p-7 text-white shadow-2xl shadow-black/90 z-10 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-500/10 border border-lime-500/20 text-lime-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Scan QR to Pay</h3>
              <p className="text-xs text-emerald-300/80">Instant UPI & Online Payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isSubmitted ? (
          <div className="mt-4 space-y-4">
            {/* Plan & Amount Summary Pill */}
            <div className="flex items-center justify-between rounded-2xl bg-emerald-950/50 border border-emerald-700/40 p-3.5">
              <div>
                <div className="text-xs font-semibold text-emerald-300">{planName}</div>
                <div className="text-[11px] text-zinc-400 capitalize">
                  {billingCycle} subscription
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white tracking-tight">{amount}</div>
                <div className="text-[10px] text-lime-400 font-semibold">Instant Access</div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="relative mx-auto w-60 h-60 sm:w-68 sm:h-68 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-white p-2.5 shadow-2xl flex items-center justify-center group">
              <img
                src="/paymentQR.jpeg"
                alt="Scan to pay via QR"
                className="w-full h-full object-contain rounded-xl"
              />

              {/* Corner framing brackets */}
              <div className="pointer-events-none absolute top-1 left-1 h-4 w-4 border-t-2 border-l-2 border-lime-500" />
              <div className="pointer-events-none absolute top-1 right-1 h-4 w-4 border-t-2 border-r-2 border-lime-500" />
              <div className="pointer-events-none absolute bottom-1 left-1 h-4 w-4 border-b-2 border-l-2 border-lime-500" />
              <div className="pointer-events-none absolute bottom-1 right-1 h-4 w-4 border-b-2 border-r-2 border-lime-500" />
            </div>

            {/* Supported Payment Apps */}
            <div className="text-center">
              <p className="text-[11px] text-zinc-400 font-medium">
                Scan with any app: <span className="text-white font-semibold">GPay, PhonePe, Paytm, BHIM, CRED</span> or Banking App
              </p>
              <button
                type="button"
                onClick={handleDownloadQR}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-lime-400 hover:text-lime-300 font-medium hover:underline transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save QR Code</span>
              </button>
            </div>

            {/* Confirmation Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-white/10">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Transaction / UTR ID (Optional)
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 4289XXXXXXXX or UPI Reference"
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3f6212] hover:bg-[#4d7c0f] py-3 text-xs font-bold text-white shadow-lg shadow-lime-900/30 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4 text-lime-300" />
                <span>I Have Paid</span>
              </button>
            </form>
          </div>
        ) : (
          /* Payment Completed Success View */
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/40">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Payment Recorded</h4>
              <p className="mt-1 text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                Thank you! Your payment confirmation was recorded. Your account and Premium features are being activated.
              </p>
              {utrNumber && (
                <div className="mt-3 inline-block rounded-lg bg-black/40 border border-white/10 px-3 py-1 font-mono text-[11px] text-lime-300">
                  Ref: {utrNumber}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-lime-600 hover:bg-lime-500 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer"
            >
              Continue to Meeting App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
