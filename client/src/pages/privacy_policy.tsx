import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  Lock,
  UserCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Printer,
  Scale,
  Sparkles,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Footer from "../components/footer";
import BrandLogo from "../components/brand_logo";
import usePageSEO from "../hooks/usePageSEO";

const sections = [
  { id: "preamble", title: "1. Preamble & Statutory Framework" },
  { id: "definitions", title: "2. Statutory Definitions (DPDP Act 2023)" },
  { id: "data-collected", title: "3. Digital Personal Data We Collect" },
  { id: "purpose", title: "4. Specified Lawful Purposes of Processing" },
  { id: "consent", title: "5. Consent & Right to Withdraw Consent" },
  { id: "principal-rights", title: "6. Rights of the Data Principal" },
  { id: "children-data", title: "7. Processing of Personal Data of Children" },
  { id: "security-breach", title: "8. Reasonable Security Safeguards & Breach Protocol" },
  { id: "cross-border", title: "9. Cross-Border Data Transfers" },
  { id: "retention", title: "10. Data Retention & Erasure Schedule" },
  { id: "grievance", title: "11. Grievance Redressal Officer & Escalation" },
  { id: "amendments", title: "12. Periodic Review & Amendments" },
];

const PrivacyPolicy = () => {
  usePageSEO({
    title: "Privacy Policy (DPDP Act 2023) | Viva Meeting",
    description:
      "Privacy Policy for Viva Meeting under India's Digital Personal Data Protection (DPDP) Act, 2023. Learn about your data rights and privacy safeguards.",
    canonicalPath: "/privacy",
  });

  const [activeSection, setActiveSection] = useState("preamble");

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
              DPDP Act, 2023 (India)
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              title="Print Policy"
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
            <span>Statutory Privacy Disclosure</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Digital Personal Data Privacy Policy
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Formulated in strict adherence to the{" "}
            <strong className="text-slate-900 font-semibold">
              Digital Personal Data Protection (DPDP) Act, 2023
            </strong>{" "}
            (Act No. 22 of 2023, Government of India) and the Information Technology Act, 2000.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 border border-emerald-100 px-3 py-1">
              <Clock className="h-3.5 w-3.5 text-[#3f6212]" />
              Effective Date: September 22, 2026
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 border border-emerald-100 px-3 py-1">
              <MapPin className="h-3.5 w-3.5 text-[#3f6212]" />
              Jurisdiction: Republic of India
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 border border-emerald-100 px-3 py-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Version 2.4 (DPDP Aligned)
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
                <span>Table of Contents</span>
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
                  <span>Statutory Compliance</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                  All personal data processing conforms with Sections 4 through 16 of the Digital Personal Data Protection Act, 2023.
                </p>
              </div>
            </div>
          </aside>

          {/* Right Detailed Legal Sections */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-8">
            {/* Section 1 */}
            <section
              id="preamble"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Shield className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  1. Preamble & Statutory Framework
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  This Privacy Policy governs the collection, recording, organization, structuring,
                  storage, adaptation, retrieval, consultation, use, alignment, erasure, or destruction
                  of <strong>digital personal data</strong> by{" "}
                  <strong>VIVA Meeting Platform</strong> (&quot;VIVA&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), an Indian video
                  conferencing and real-time collaboration application.
                </p>
                <p>
                  This document constitutes a statutory notice issued in compliance with{" "}
                  <strong>Section 5</strong> of the{" "}
                  <strong>Digital Personal Data Protection Act, 2023 (&quot;DPDP Act 2023&quot;)</strong>,
                  enacted by the Parliament of India, read alongside the Information Technology Act,
                  2000 and the Information Technology (Reasonable Security Practices and Procedures and
                  Sensitive Personal Data or Information) Rules, 2011.
                </p>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200/70 p-4 text-xs text-emerald-950 font-medium">
                  <strong>Notice to Data Principals:</strong> By accessing or using VIVA, you acknowledge
                  having read and understood this Policy. When required by law, we seek your explicit,
                  affirmative consent prior to processing your digital personal data.
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="definitions"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  2. Statutory Definitions (Under DPDP Act 2023)
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>In accordance with Section 2 of the DPDP Act 2023, the following terms have specific statutory meanings:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <li className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5">
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-1">
                      Data Principal [Sec. 2(j)]
                    </strong>
                    The individual to whom the personal data relates. In the context of VIVA, this is you, the registered user, meeting host, or participating attendee.
                  </li>
                  <li className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5">
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-1">
                      Data Fiduciary [Sec. 2(i)]
                    </strong>
                    Any person who alone or in conjunction with other persons determines the purpose and means of processing of personal data. VIVA operates as the primary Data Fiduciary.
                  </li>
                  <li className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5">
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-1">
                      Data Processor [Sec. 2(k)]
                    </strong>
                    Any person who processes personal data on behalf of a Data Fiduciary (e.g., our cloud hosting providers and Razorpay payment gateway).
                  </li>
                  <li className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5">
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-1">
                      Consent Manager [Sec. 2(g)]
                    </strong>
                    A person registered with the Data Protection Board of India who serves as a single point of contact to enable a Data Principal to give, manage, review, and withdraw consent.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="data-collected"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <UserCheck className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  3. Digital Personal Data We Collect (Itemized Notice)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                Under Section 5(1) of the DPDP Act 2023, a Data Fiduciary must give itemized notice of personal data sought. We collect only the minimum personal data strictly necessary to provide real-time video communications:
              </p>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-950 text-white font-semibold">
                      <th className="p-3">Data Category</th>
                      <th className="p-3">Specific Elements</th>
                      <th className="p-3">Statutory Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">Identity & Profile Data</td>
                      <td className="p-3">Full name, email address, profile avatar image, Clerk user identifier</td>
                      <td className="p-3">User account authentication, session management, participant display names in calls</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">WebRTC Signaling Metadata</td>
                      <td className="p-3">Socket ID, Session Description Protocol (SDP), ICE Candidates, IP address, device media capability</td>
                      <td className="p-3">Establishing peer-to-peer encrypted audio/video transmission between call participants</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">Meeting Session Data</td>
                      <td className="p-3">Meeting room ID, meeting start/end timestamps, participant attendee list, chat messages exchanged</td>
                      <td className="p-3">Session history, user dashboard, real-time in-call collaboration</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">Financial & Transaction Data</td>
                      <td className="p-3">Razorpay payment ID, Razorpay order ID, subscription tier, billing email (no raw card data stored by us)</td>
                      <td className="p-3">Processing premium tier subscriptions in Indian Rupees (INR) with Razorpay signature verification</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">Audio/Video Media Streams</td>
                      <td className="p-3">Real-time camera frames and microphone audio</td>
                      <td className="p-3">
                        Transmitted in real-time between peers via DTLS-SRTP encryption. <strong>We do not record or store your live audio/video on our servers</strong> unless the host explicitly activates cloud recording with on-screen notice to all participants.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="purpose"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  4. Specified Lawful Purposes of Processing
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Pursuant to Section 4 of the DPDP Act 2023, personal data shall be processed only for a lawful purpose for which the Data Principal has given consent or for certain legitimate uses:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Provision of WebRTC Service</h4>
                    <p className="text-xs text-slate-600">Connecting your browser to peer attendees, streaming audio/video, managing the waiting room knock flow, and chat messaging.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Account & Security Verification</h4>
                    <p className="text-xs text-slate-600">Authenticating accounts via Clerk, preventing unauthorized knocking or zoombombing, and preventing spam.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Accounting & Transaction Records</h4>
                    <p className="text-xs text-slate-600">Maintaining transaction verification records and security logs for payment integrity.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Grievance Resolution</h4>
                    <p className="text-xs text-slate-600">Responding to complaints, queries, and exercising of statutory rights submitted to our Grievance Redressal Officer.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="consent"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  5. Consent & Right to Withdraw Consent (Section 6)
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Under Section 6(1) of the DPDP Act 2023, consent given by the Data Principal must be{" "}
                  <strong>free, specific, informed, unconditional, and unambiguous</strong> with a clear affirmative action.
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Right to Withdraw Consent [Section 6(4)]
                  </h4>
                  <p className="text-xs text-slate-700">
                    You have the statutory right to withdraw your consent at any time. The withdrawal of consent shall not affect the legality of processing of the personal data based on consent before its withdrawal.
                  </p>
                  <p className="text-xs text-slate-700 mt-2">
                    To withdraw consent, you may either:
                  </p>
                  <ul className="list-disc list-inside mt-1.5 text-xs text-slate-700 space-y-1">
                    <li>Delete your account directly via the user profile controls; or</li>
                    <li>Submit an email request to our Grievance Redressal Officer at <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[#142417]">privacy@viva-app.in</code> with the subject &quot;Withdrawal of Consent - DPDP Act 2023&quot;.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="principal-rights"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Scale className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  6. Statutory Rights of the Data Principal (Sections 11–14)
                </h2>
              </div>
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  The Digital Personal Data Protection Act, 2023 guarantees the following fundamental rights to all Indian Data Principals:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold text-[#3f6212] block mb-1">Section 11</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right to Access Information</h4>
                    <p className="text-xs text-slate-600">
                      Right to obtain a summary of personal data being processed, identity of all Data Fiduciaries and Processors with whom it has been shared, and any other relevant information.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold text-[#3f6212] block mb-1">Section 12</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right to Correction & Erasure</h4>
                    <p className="text-xs text-slate-600">
                      Right to correct misleading or inaccurate personal data, complete incomplete data, update outdated records, and request immediate erasure of data no longer needed.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold text-[#3f6212] block mb-1">Section 13</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right of Grievance Redressal</h4>
                    <p className="text-xs text-slate-600">
                      Right to readily available means of grievance redressal provided by VIVA regarding any act or omission in respect of our obligations or your rights.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
                    <span className="text-xs font-bold text-[#3f6212] block mb-1">Section 14</span>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right to Nominate</h4>
                    <p className="text-xs text-slate-600">
                      Right to nominate in the prescribed manner any other individual who shall, in the event of death or incapacity of the Data Principal, exercise statutory rights on their behalf.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950">
                  <strong>Duties of the Data Principal [Section 15]:</strong> The DPDP Act 2023 obligates users not to impersonate another person, not to suppress material information when providing data, and not to register false or frivolous grievances.
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="children-data"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <UserCheck className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  7. Processing Personal Data of Children (Section 9)
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Under Section 9(1) of the DPDP Act 2023, a Data Fiduciary must obtain{" "}
                  <strong>verifiable parental consent</strong> (or consent of a lawful guardian) before processing any personal data of a child (an individual who has not completed 18 years of age).
                </p>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                  <p className="font-semibold text-slate-900">Strict Prohibitions Under Section 9(2) & 9(3):</p>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    <li>VIVA does not undertake tracking or behavioral monitoring of children.</li>
                    <li>VIVA does not serve targeted advertising directed at children.</li>
                    <li>VIVA strictly prohibits processing personal data likely to cause detrimental effects on the well-being of a child.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="security-breach"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Lock className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  8. Reasonable Security Safeguards & Breach Protocol (Section 8)
                </h2>
              </div>
              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Section 8(5) of the DPDP Act 2023 requires Data Fiduciaries to implement reasonable security safeguards to prevent personal data breach:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <li className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <strong className="block text-slate-900 font-bold mb-0.5">DTLS-SRTP WebRTC Encryption</strong>
                    Real-time voice and video packets are encrypted end-to-end between communicating peers using Datagram Transport Layer Security (DTLS) and Secure Real-time Transport Protocol (SRTP).
                  </li>
                  <li className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <strong className="block text-slate-900 font-bold mb-0.5">TLS 1.3 Signaling Security</strong>
                    All WebSocket signaling messages, chat messages, and API tokens are transmitted over TLS 1.3 encrypted HTTPS/WSS channels.
                  </li>
                  <li className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <strong className="block text-slate-900 font-bold mb-0.5">HMAC Cryptographic Verification</strong>
                    All webhook events and payment confirmations are validated using HMAC-SHA256 digital signatures to prevent tampering.
                  </li>
                  <li className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                    <strong className="block text-slate-900 font-bold mb-0.5">Host Admission Control</strong>
                    Private rooms enforce host admission knock barriers, stopping unauthorized access or eavesdropping.
                  </li>
                </ul>

                <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs text-red-950">
                  <strong>Mandatory Breach Notification [Section 8(6)]:</strong> In the unlikely event of a personal data breach, VIVA will notify the <strong>Data Protection Board of India (DPBI)</strong> and each affected Data Principal in the form and manner prescribed by Central Government rules.
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section
              id="cross-border"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <ExternalLink className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  9. Cross-Border Data Transfers (Section 16)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                In compliance with Section 16 of the DPDP Act 2023, personal data collected by VIVA is hosted on secure cloud infrastructure located within India or countries not restricted by the Central Government. VIVA ensures that any cross-border processing adheres strictly to the notifications, whitelists, or blacklists formulated by the Government of India.
              </p>
            </section>

            {/* Section 10 */}
            <section
              id="retention"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Clock className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  10. Data Retention & Erasure Schedule (Section 8(7))
                </h2>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Section 8(7) mandates that a Data Fiduciary must erase personal data upon the Data Principal withdrawing consent, or as soon as it is reasonable to assume that the specified purpose is no longer being served:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-1">
                  <li><strong>WebRTC Media Streams:</strong> Never retained; ephemeral in-memory transport.</li>
                  <li><strong>Room Signatures & Temporary Chat:</strong> Cleared from active memory upon host closing the room session.</li>
                  <li><strong>User Account Profile:</strong> Retained until the user requests account deletion or withdraws consent.</li>
                  <li><strong>Payment Logs:</strong> Retained for transaction verification and accounting records in compliance with applicable laws.</li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section
              id="grievance"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  11. Grievance Redressal Officer & Statutory Escalation
                </h2>
              </div>
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Under Section 13 of the DPDP Act 2023, VIVA has appointed a dedicated{" "}
                  <strong>Grievance Redressal Officer (GRO)</strong> based in India to address any concerns regarding the processing of your personal data:
                </p>

                {/* Grievance Card */}
                <div className="rounded-2xl bg-linear-to-br from-emerald-950 to-[#081307] text-white p-5 border border-emerald-700/50 shadow-md">
                  <div className="flex items-center gap-2.5 mb-3 text-lime-400 font-bold text-sm">
                    <Scale className="h-4 w-4" />
                    <span>Office of the Grievance Redressal Officer</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-100/90">
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Officer Name</span>
                      <strong className="text-white text-sm">Divyesh Soni</strong>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Designation</span>
                      <span>Grievance Redressal Officer & Data Protection Lead</span>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Official Email</span>
                      <a href="mailto:grievance@viva-app.in" className="text-lime-300 hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" /> grievance@viva-app.in
                      </a>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 block text-[10px] uppercase font-bold">Physical Address</span>
                      <span>Technology Hub, Gujarat / Maharashtra, Republic of India</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-800/60 text-[11px] text-emerald-200/80">
                    <strong>Response Timeline:</strong> All grievances received will be acknowledged within 48 hours and redressed within a maximum statutory period of <strong>30 days</strong>.
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Escalation to Data Protection Board of India (DPBI)
                  </h4>
                  <p className="text-xs text-slate-600">
                    If you are not satisfied with the resolution provided by our Grievance Redressal Officer, or if no response is received within the statutory timeframe, you have the right under{" "}
                    <strong>Section 13(3)</strong> and <strong>Section 27</strong> of the DPDP Act 2023 to register an appeal or complaint with the:
                  </p>
                  <p className="font-semibold text-slate-900 text-xs mt-1.5">
                    Data Protection Board of India (DPBI)<br />
                    Department of Telecommunications / Ministry of Electronics and Information Technology (MeitY), New Delhi, India.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12 */}
            <section
              id="amendments"
              className="rounded-3xl bg-white/95 border border-emerald-900/10 p-6 sm:p-8 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-2.5 mb-4 text-[#3f6212]">
                <Clock className="h-5 w-5" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  12. Periodic Review & Amendments
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                VIVA reserves the right to modify this Privacy Policy in response to rules, regulations, or notifications issued by the Data Protection Board of India or the Ministry of Electronics and Information Technology (MeitY). Any substantive revisions will be prominently displayed with an updated effective date.
              </p>
            </section>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
