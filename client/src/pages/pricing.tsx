import { useState } from "react";
import { Check, QrCode } from "lucide-react";
import usePageSEO from "../hooks/usePageSEO";
import PaymentModal from "../components/payment_modal";

const freeFeatures = [
  "Up to 8 participants",
  "40-minute meeting limit",
  "30 meetings per month",
  "Standard video quality",
  "In-meeting chat",
  "Screen sharing",
];

const premiumFeatures = [
  "Up to 100 participants",
  "No duration limit",
  "Unlimited meetings",
  "Priority HD quality",
  "Meeting recordings",
  "Full chat history",
];

const Pricing = () => {
  usePageSEO({
    title: "Pricing & Plans - Free & Pro | Viva Meeting",
    description:
      "Compare affordable Viva Meeting plans. Free plan with up to 8 participants and 40-minute HD video calling, or Pro plan with unlimited group conferences and recordings.",
    canonicalPath: "/pricing",
  });

  const [isAnnual, setIsAnnual] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  return (
    <div className="w-full py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Upgrade your <span className="text-[#10b981]">plan.</span>
          </h1>
          <p className="mx-auto max-w-lg text-sm text-[#9ca3af] sm:text-base">
            Choose the plan that's right for you and unlock all the features of Viva Meeting.
          </p>

          {/* Annual Toggle */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#242424] border border-[#383838] p-1 text-xs font-medium">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-4 py-1.5 transition-colors cursor-pointer ${
                !isAnnual
                  ? "bg-[#2a2a2a] text-white shadow-xs border border-[#4a4a4a]"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors cursor-pointer ${
                isAnnual
                  ? "bg-[#2a2a2a] text-white shadow-xs border border-[#4a4a4a]"
                  : "text-[#9ca3af] hover:text-white"
              }`}
            >
              Billed annually
              <span className="rounded-full bg-[#10b981]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#34d399] border border-[#10b981]/30">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Free Tier Card */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#242424] border border-[#383838] p-6 sm:p-8 shadow-xl text-white">
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Free</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                </div>
                <p className="mt-1 text-xs text-[#9ca3af]">Always free for personal use</p>
              </div>

              {/* Feature Checklist */}
              <div className="my-6 space-y-3 border-t border-[#383838] pt-6">
                {freeFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] border border-[#383838] text-[#9ca3af]">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium text-[#d1d5db] sm:text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <button className="w-full rounded-full bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] py-2.5 text-xs font-medium text-white transition-colors cursor-pointer sm:text-sm">
              Current Plan
            </button>
          </div>

          {/* Premium Tier Card */}
          <div className="relative flex flex-col justify-between rounded-2xl bg-[#282a2d] border-2 border-[#10b981] p-6 sm:p-8 text-white shadow-xl">
            {/* Active Badge */}
            <div className="absolute right-6 top-6">
              <span className="rounded-full bg-[#10b981] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                Popular
              </span>
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Premium</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    {isAnnual ? "$6.40" : "$8"}
                  </span>
                  <span className="text-xs text-[#9ca3af]">/month</span>
                </div>
                <p className="mt-1 text-xs text-[#9ca3af]">
                  {isAnnual ? "Billed annually ($76.80/yr)" : "Billed monthly"}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="my-6 space-y-3 border-t border-[#383838] pt-6">
                {premiumFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#10b981]/20 border border-[#10b981]/40 text-[#34d399]">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium text-[#f3f4f6] sm:text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#10b981] hover:bg-[#059669] py-3 text-xs font-medium text-white shadow-md active:scale-95 transition-all sm:text-sm cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>Pay with QR Code (Instant Upgrade)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Payment QR Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        planName="Viva Meeting Premium"
        amount={isAnnual ? "$76.80 (₹6,400 / yr)" : "$8 (₹699 / mo)"}
        billingCycle={isAnnual ? "annually" : "monthly"}
      />
    </div>
  );
};

export default Pricing;
