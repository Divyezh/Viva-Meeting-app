import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Scale,
  CreditCard,
  Video,
  ChevronRight,
  Printer,
  Sparkles,
  MapPin,
  Clock,
  HelpCircle,
  Mail,
  Lock,
} from "lucide-react";
import Footer from "../components/footer";
import BrandLogo from "../components/brand_logo";
import usePageSEO from "../hooks/usePageSEO";

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms & Legal Capacity" },
  { id: "service", title: "2. Description of VIVA WebRTC Service" },
  { id: "account", title: "3. User Accounts & Identity Protection" },
  { id: "conduct", title: "4. Meeting Conduct & Admission Knocking" },
  { id: "recording", title: "5. Meeting Recording & Chat Compliance" },
  { id: "acceptable-use", title: "6. Acceptable Use & Prohibited Conduct" },
  { id: "payments", title: "7. Subscriptions, Billing & Razorpay Terms" },
  { id: "ip", title: "8. Intellectual Property & License" },
  { id: "disclaimers", title: "9. Technical Disclaimers & P2P Latency" },
  { id: "liability", title: "10. Limitation of Liability & Indemnity" },
  { id: "termination", title: "11. Suspension & Account Termination" },
  { id: "governing-law", title: "12. Governing Law & Dispute Resolution (India)" },
  { id: "contact", title: "13. Grievance Redressal & Contact Info" },
];

const TermsOfService = () => {
  usePageSEO({
    title: "Terms of Service | Viva Meeting",
    description:
      "Terms of Service for Viva Meeting video conferencing platform. Review usage rules, P2P encryption, and service guidelines.",
    canonicalPath: "/terms",
  });

  const [activeSection, setActiveSection] = useState("acceptance");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-app-gradient min-h-screen text-[#142417] flex flex-col selection:bg-emerald-900 selection:text-emerald-100">
      {/* ─── Top Header Bar ─── */}
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-full bg-emerald-50/80 border border-emerald-200/60 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/70 transition-all active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to App</span>
            </Link>

            <div className="h-4 w-px bg-emerald-900/15 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 shadow-xs">
                <BrandLogo className="h-5 w-5" color="#4d7c0f" />
              </div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900">
                VIVA <span className="text-[#65a30d]">Legal</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-[#3f6212]">
              <Scale className="h-3 w-3" />
              Governed by Laws of India
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              title="Print Terms"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero Banner ─── */}
      <div className="relative border-b border-emerald-900/10 bg-linear-to-b from-white/90 via-emerald-50/40 to-transparent py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-700/50 px-3.5 py-1 text-xs font-semibold shadow-xs mb-4">
            <Sparkles className="h-3.5 w-3.5 text-lime-400" />
            <span>User Agreement & Platform Terms</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Terms of Service
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Please read these Terms carefully before using the VIVA Meeting Platform. Governed by the{" "}
            <strong className="text-slate-900 font-semibold">Indian Contract Act, 1872</strong>, the{" "}
            <strong className="text-slate-900 font-semibold">Information Technology Act, 2000</strong>, and the{" "}
            <strong className="text-slate-900 font-semibold">Digital Personal Data Protection Act, 2023</strong>.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 border border-emerald-100 px-3 py-1">
              <Clock className="h-3.5 w-3.5 text-[#3f6212]" />
              Last Revised: September 22, 2026
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 border border-emerald-100 px-3 py-1">
              <MapPin className="h-3.5 w-3.5 text-[#3f6212]" />
              Jurisdiction: Republic of India
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 border border-emerald-100 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Binding Contract
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Content Layout with Sidebar ─── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sticky Table of Contents */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 rounded-3xl bg-white/90 border border-emerald-900/10 p-5 shadow-lg shadow-emerald-950/5 backdrop-blur-md">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <FileText className="h-4 w-4 text-[#3f6212]" />
                <span>Sections</span>
              </div>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer ${
                      activeSection === s.id
                        ? "bg-[#3f6212] text-white font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-950"
                    }`}
                  >
                    <span className="truncate">{s.title}</span>
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 transition-transform ${
                        activeSection === s.id ? "text-white" : "text-slate-400 group-hover:translate-x-0.5"
                      }`}
                    />
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100 bg-emerald-50/50 rounded-2xl p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3f6212]">
                  <Scale className="h-3.5 w-3.5" />
                  <span>Indian Legal Jurisdiction</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                  All disputes are subject to the exclusive jurisdiction of the competent courts in the Republic of India.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Detailed Legal Sections */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-8">
            {/* Section 1 */}
            <section
              id="acceptance"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  1. Acceptance of Terms & Legal Capacity
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you
                  (&quot;User&quot;, &quot;You&quot;, or &quot;Data Principal&quot;) and <strong>VIVA Meeting Platform</strong> (&quot;VIVA&quot;, &quot;we&quot;,
                  &quot;us&quot;, or &quot;our&quot;) regarding your use of our real-time video conferencing services,
                  collaboration tools, and website.
                </p>
                <p>
                  By registering an account, clicking &quot;I Agree&quot;, hosting a meeting, or joining a call via
                  meeting link, you affirm that you are at least <strong>18 years of age</strong> and legally
                  competent to enter into a binding contract under the <strong>Indian Contract Act, 1872</strong>.
                  If you are under 18 years of age, you may only access VIVA under the supervision and with
                  the verifiable consent of a parent or legal guardian in compliance with Section 9 of the
                  Digital Personal Data Protection (DPDP) Act, 2023.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="service"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Video className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  2. Description of VIVA WebRTC Service
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  VIVA is a next-generation real-time video conferencing application delivering peer-to-peer
                  (P2P) voice and video communications powered by the standard WebRTC protocol and
                  WebSocket signaling infrastructure. Features include:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-1">
                  <li>Instant one-click meeting creation with secure room codes;</li>
                  <li>Waiting room admission control and knock barriers for host verification;</li>
                  <li>Ultra-clear voice synthesis, echo cancellation, and screen sharing;</li>
                  <li>Real-time ephemeral in-call chat and session summary notes;</li>
                  <li>Premium subscription tiers processed securely via Razorpay.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="account"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Lock className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  3. User Accounts & Identity Protection
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  User identity authentication is managed through Clerk. You agree to provide true, accurate,
                  and complete registration details. Under <strong>Section 15 of the DPDP Act 2023</strong>,
                  you are legally obligated not to impersonate another individual or register under false
                  credentials.
                </p>
                <p>
                  You are solely responsible for maintaining the confidentiality of your credentials and for
                  all activities taking place under your account. You agree to notify us immediately of any
                  unauthorized use or security breach.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="conduct"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Shield className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  4. Meeting Conduct & Admission Knocking
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  VIVA enforces a secure <strong>Host Admission Protocol</strong> (&quot;Knock Barrier&quot;) for private meetings:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Host Authority</h4>
                    <p className="text-xs text-slate-600">The meeting host retains absolute discretion to Admit or Decline any knock request from incoming attendees, and may remove disruptive participants at any time.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Guest Etiquette</h4>
                    <p className="text-xs text-slate-600">Guests waiting in the admission room must not spam repeated knock attempts. If a host declines an admission request, the guest must respect the decision.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="recording"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  5. Meeting Recording & Chat Compliance (DPDP Act)
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-950 font-medium">
                  <strong>Mandatory Statutory Notice:</strong> In accordance with Sections 5 &amp; 6 of the DPDP Act 2023, recording a meeting without the clear, informed, and unambiguous consent of all participants constitutes a violation of privacy rights and Indian law.
                </div>
                <p>When recording features or transcription tools are activated by a host:</p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-1">
                  <li>An unmistakable visual banner and audio chime notify all attendees that recording is in progress;</li>
                  <li>Attendees who do not consent to being recorded retain the right to mute camera/mic or leave the call;</li>
                  <li>Recorded files remain under the custody of the host, who acts as an independent Data Fiduciary with respect to secondary distribution.</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="acceptable-use"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  6. Acceptable Use & Prohibited Conduct
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  You agree to use VIVA in compliance with all applicable laws of India, including the{" "}
                  <strong>Information Technology Act, 2000</strong>, the{" "}
                  <strong>Bharatiya Nyaya Sanhita, 2023 (BNS)</strong>, and the DPDP Act, 2023.
                </p>
                <p className="font-semibold text-slate-900">You strictly agree NOT to:</p>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                  <ul className="list-disc list-inside text-slate-700 space-y-1.5">
                    <li>Transmit any obscene, defamatory, harassing, sexually explicit, or unlawful material (Section 67 IT Act);</li>
                    <li>Conduct unauthorized surveillance, stream pirated broadcasts, or infringe third-party copyrights;</li>
                    <li>Generate, transmit, or manipulate unconsented synthetic media, deepfakes, or voice clones;</li>
                    <li>Attempt to intercept, decrypt, or tamper with WebRTC DTLS-SRTP media packets or signaling servers;</li>
                    <li>Harm, exploit, or collect personal data relating to children in violation of Section 9 of the DPDP Act 2023.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="payments"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <CreditCard className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  7. Subscriptions, Billing & Razorpay Payments
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  VIVA offers paid subscription tiers (&quot;Pro&quot;, &quot;Enterprise&quot;). All financial transactions are billed in{" "}
                  <strong>Indian Rupees (INR)</strong> and processed securely via{" "}
                  <strong>Razorpay</strong>, an RBI-licensed payment aggregator.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">Pricing & Fees</strong>
                    All listed prices are transparent flat fees with no hidden taxes or additional surcharges added at checkout. Digital payment confirmations are issued upon successful transaction completion.
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 font-bold mb-1">Cancellation & Refunds</strong>
                    You may cancel your recurring subscription at any time via your dashboard. Refunds are subject to statutory consumer protection regulations in India.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="ip"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Shield className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  8. Intellectual Property & License
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                All platform trademarks, logos, visual designs, algorithms, codebases, and brand assets
                are the exclusive intellectual property of VIVA. You retain all ownership rights in any
                original content, presentation slides, or materials you present during your meetings.
              </p>
            </section>

            {/* Section 9 */}
            <section
              id="disclaimers"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  9. Technical Disclaimers & P2P Latency
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                VIVA is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Because WebRTC operates across decentralized
                Internet Service Providers (ISPs), local NAT firewalls, and hardware variations, we do not
                warrant that audio/video transmission will be uninterrupted, zero-latency, or entirely error-free.
              </p>
            </section>

            {/* Section 10 */}
            <section
              id="liability"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  10. Limitation of Liability & Indemnification
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                To the maximum extent permitted under applicable Indian law, VIVA shall not be liable for any indirect,
                incidental, consequential, or punitive damages arising out of your use of the platform. You agree to
                indemnify and hold harmless VIVA, its directors, and officers against any claims, losses, or legal costs
                resulting from your violation of these Terms or the statutory rights of third parties.
              </p>
            </section>

            {/* Section 11 */}
            <section
              id="termination"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  11. Suspension & Account Termination
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                We reserve the right to suspend or terminate your access to VIVA immediately and without prior notice
                in the event of any material breach of these Terms, abusive behavior towards meeting participants, or
                upon direction from competent law enforcement authorities in India.
              </p>
            </section>

            {/* Section 12 */}
            <section
              id="governing-law"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  12. Governing Law & Dispute Resolution (Republic of India)
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  These Terms shall be governed by and construed in accordance with the substantive laws of the{" "}
                  <strong>Republic of India</strong>, without giving effect to conflict of laws principles.
                </p>
                <p>
                  Any dispute, controversy, or claim arising out of or relating to these Terms shall be referred to
                  and finally resolved by arbitration in accordance with the{" "}
                  <strong>Arbitration and Conciliation Act, 1996</strong> of India. Subject to arbitration, the courts
                  having territorial jurisdiction in India shall have exclusive jurisdiction over all matters arising hereunder.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section
              id="contact"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  13. Grievance Redressal & Contact Information
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code)
                  Rules, 2021 and Section 13 of the DPDP Act 2023, the details of our Grievance Officer are:
                </p>

                <div className="rounded-2xl bg-linear-to-br from-emerald-950 to-[#081307] text-white p-5 border border-emerald-700/50 shadow-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-100/90">
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Officer Name</span>
                      <strong className="text-white text-sm">Divyesh Soni</strong>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Designation</span>
                      <span>Nodal &amp; Grievance Officer</span>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Email</span>
                      <a href="mailto:grievance@viva-app.in" className="text-lime-300 hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" /> grievance@viva-app.in
                      </a>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Jurisdiction</span>
                      <span>Republic of India</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;
