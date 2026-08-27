import { useState } from "react";
import { Check } from "lucide-react";

const freeFeatures = [
  "Up to 4 participants",
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
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="w-full py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Upgrade your <span className="text-[#4d7c0f]">plan.</span>
          </h1>
          <p className="mx-auto max-w-lg text-sm text-slate-600 sm:text-base">
            Choose the plan that's right for you and unlock all the features of VIVA.
          </p>

          {/* Annual Toggle */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-emerald-50/80 border border-emerald-100/70 p-1 text-xs font-semibold">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-4 py-1.5 transition-all ${
                !isAnnual
                  ? "bg-white text-slate-900 shadow-xs border border-emerald-100/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all ${
                isAnnual
                  ? "bg-white text-slate-900 shadow-xs border border-emerald-100/50"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Billed annually
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-[#2d5218]">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Free Tier Card */}
          <div className="glass-panel flex flex-col justify-between rounded-3xl p-6 sm:p-8">
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">Free</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Always free for personal use</p>
              </div>

              {/* Feature Checklist */}
              <div className="my-6 space-y-3 border-t border-emerald-100/60 pt-6">
                {freeFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 sm:text-sm">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <button className="w-full rounded-full bg-slate-900 py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 sm:text-sm">
              Switch to this plan
            </button>
          </div>

          {/* Premium Tier Card */}
          <div className="glass-panel relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 ring-2 ring-emerald-500/30">
            {/* Active Badge */}
            <div className="absolute right-6 top-6">
              <span className="rounded-full bg-[#142417] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Active
              </span>
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">Premium</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {isAnnual ? "$6.40" : "$8"}
                  </span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {isAnnual ? "Billed annually ($76.80/yr)" : "Billed monthly"}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="my-6 space-y-3 border-t border-emerald-100/60 pt-6">
                {premiumFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#4d7c0f]">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium text-slate-700 sm:text-sm">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <button className="w-full rounded-full bg-[#3f6212] py-3 text-xs font-semibold text-white shadow-md shadow-[#3f6212]/20 transition-all hover:bg-[#365314] hover:shadow-lg active:scale-95 sm:text-sm">
              Manage plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
