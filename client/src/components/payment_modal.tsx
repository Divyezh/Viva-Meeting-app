import { useState } from "react";
import { X, Check, ShieldCheck, Download, Smartphone } from "lucide-react";
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
      style: {
        background: "#242424",
        color: "#f3f4f6",
        border: "1px solid #383838",
      },
    });
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = "/paymentQR.jpeg";
    link.download = "viva-meeting-payment-qr.jpeg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded", {
      style: {
        background: "#242424",
        color: "#f3f4f6",
        border: "1px solid #383838",
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#242424] border border-[#383838] p-6 sm:p-7 text-white shadow-2xl z-10 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a2a2a] border border-[#383838] text-[#10b981]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Scan QR to Pay</h3>
              <p className="text-xs text-[#9ca3af]">Instant UPI & Online Payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2a2a2a] border border-[#383838] text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isSubmitted ? (
          <div className="mt-4 space-y-4">
            {/* Plan & Amount Summary Pill */}
            <div className="flex items-center justify-between rounded-xl bg-[#2a2a2a] border border-[#383838] p-3.5">
              <div>
                <div className="text-xs font-semibold text-[#10b981]">{planName}</div>
                <div className="text-[11px] text-[#9ca3af] capitalize">
                  {billingCycle} subscription
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white tracking-tight">{amount}</div>
                <div className="text-[10px] text-[#34d399] font-medium">Instant Access</div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="relative mx-auto w-60 h-60 sm:w-64 sm:h-64 rounded-xl overflow-hidden border border-[#383838] bg-white p-2.5 shadow-md flex items-center justify-center">
              <img
                src="/paymentQR.jpeg"
                alt="Scan to pay via QR"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            {/* Supported Payment Apps */}
            <div className="text-center">
              <p className="text-[11px] text-[#9ca3af]">
                Scan with any app: <span className="text-white font-medium">GPay, PhonePe, Paytm, BHIM, CRED</span> or Banking App
              </p>
              <button
                type="button"
                onClick={handleDownloadQR}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#10b981] hover:text-[#34d399] font-medium transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save QR Code</span>
              </button>
            </div>

            {/* Confirmation Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-[#383838]">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#d1d5db] mb-1">
                  Transaction / UTR ID (Optional)
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 4289XXXXXXXX or UPI Reference"
                  className="w-full rounded-xl bg-[#1e1e1e] border border-[#383838] px-3.5 py-2.5 text-xs text-white placeholder-[#9ca3af] outline-none focus:border-[#10b981] transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] py-2.5 text-xs font-medium text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>I Have Paid</span>
              </button>
            </form>
          </div>
        ) : (
          /* Payment Completed Success View */
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Payment Recorded</h4>
              <p className="mt-1 text-xs text-[#9ca3af] leading-relaxed max-w-xs mx-auto">
                Thank you! Your payment confirmation was recorded. Your account and Premium features are being activated.
              </p>
              {utrNumber && (
                <div className="mt-3 inline-block rounded-lg bg-[#1e1e1e] border border-[#383838] px-3 py-1 font-mono text-[11px] text-[#34d399]">
                  Ref: {utrNumber}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-[#10b981] hover:bg-[#059669] py-2.5 text-xs font-medium text-white transition-colors cursor-pointer"
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
