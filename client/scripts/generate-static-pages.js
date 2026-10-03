import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");

if (!fs.existsSync(distDir)) {
  console.error("dist directory not found. Please run vite build first.");
  process.exit(1);
}

const templatePath = path.join(distDir, "index.html");
if (!fs.existsSync(templatePath)) {
  console.error("dist/index.html not found.");
  process.exit(1);
}

const baseTemplate = fs.readFileSync(templatePath, "utf-8");

const BASE_URL = "https://viva-meeting-app.vercel.app";

const pages = [
  {
    path: "/",
    title: "Viva Meeting - Free HD Video Calling & Instant Online Conferencing",
    description:
      "Host and join instant HD video meetings with Viva Meeting. Crystal-clear video, screen sharing, waiting room security, and live Hindi-to-English translation. Zero downloads required.",
    keywords:
      "Viva Meeting, Viva Meeting App, free video conferencing, HD video calling, WebRTC meeting app, screen sharing online, instant video call, Indian video conference, secure meeting app",
    canonical: `${BASE_URL}/`,
    heading: "Online meetings with high quality video calls. Built for everyone.",
    subheading:
      "Connect instantly in crystal-clear HD video with zero downloads required. Enjoy WebRTC end-to-end media streams, screen sharing, Hindi-to-English translation captions, and encrypted waiting rooms.",
    schemaType: "WebPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` }
    ],
    htmlContent: `
      <header style="max-width: 760px; margin: 0 auto; text-align: center;">
        <div style="display: inline-block; padding: 0.35rem 1rem; border-radius: 9999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(163,230,53,0.3); font-size: 0.8rem; font-weight: 600; color: #a3e635; margin-bottom: 1.5rem;">
          Secure Peer-to-Peer HD Video Calling
        </div>
        <h1 style="font-size: 2.75rem; font-weight: 800; color: #ffffff; line-height: 1.15; margin-bottom: 1.25rem; letter-spacing: -0.02em;">
          Online meetings with high quality video calls. <span style="color: #a3e635;">Built for everyone.</span>
        </h1>
        <p style="font-size: 1.125rem; color: #cbd5e1; max-width: 620px; margin: 0 auto 2.25rem; line-height: 1.6;">
          Connect instantly in crystal-clear HD video with zero downloads required. Enjoy WebRTC end-to-end media streams, screen sharing, Hindi-to-English translation captions, and encrypted waiting rooms.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2.5rem;">
          <a href="/" style="background: #3f6212; color: #ffffff; padding: 0.85rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(63,98,18,0.4);">
            Start Instant Meeting
          </a>
          <a href="/join" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; padding: 0.85rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 0.95rem;">
            Join with Code
          </a>
          <a href="/pricing" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(163,230,53,0.3); color: #a3e635; padding: 0.85rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 0.95rem;">
            View Pricing
          </a>
        </div>
      </header>
      <section style="margin-top: 1rem; max-width: 700px; width: 100%;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; text-align: left;">
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.25rem;">
            <h2 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 0.5rem;">Instant Meetings</h2>
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.5;">Create custom meeting codes and connect immediately without waiting.</p>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.25rem;">
            <h2 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 0.5rem;">Screen Share &amp; Chat</h2>
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.5;">Share your entire screen or tabs with host permission controls and live chat.</p>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.25rem;">
            <h2 style="font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 0.5rem;">Live Hindi Captions</h2>
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0; line-height: 1.5;">AI speech-to-text with Hindi-to-English live subtitles for accessible meetings.</p>
          </div>
        </div>
      </section>`
  },
  {
    path: "/pricing",
    title: "Pricing Plans & Features - Free & Pro | Viva Meeting",
    description:
      "Compare affordable Viva Meeting plans. Free tier with instant HD calls and 8 participants, or Pro tier with unlimited duration, recordings, and priority support.",
    keywords:
      "Viva Meeting pricing, video conference pricing, free video meeting app, Pro video calling plan, cheap video conferencing, Viva meeting subscription",
    canonical: `${BASE_URL}/pricing`,
    heading: "Simple, Transparent Pricing for Viva Meeting",
    subheading: "Choose the perfect plan for your team. Start for free and upgrade anytime.",
    schemaType: "ItemPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Pricing", url: `${BASE_URL}/pricing` }
    ],
    htmlContent: `
      <header style="max-width: 760px; margin: 0 auto; text-align: center;">
        <h1 style="font-size: 2.5rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 1rem;">
          Upgrade your <span style="color: #a3e635;">plan.</span>
        </h1>
        <p style="font-size: 1.1rem; color: #cbd5e1; max-width: 580px; margin: 0 auto 2.5rem; line-height: 1.5;">
          Choose the plan that's right for you and unlock all features of Viva Meeting.
        </p>
      </header>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; max-width: 800px; width: 100%; margin: 0 auto;">
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 1.5rem; padding: 2rem; text-align: left;">
          <h2 style="font-size: 1.35rem; font-weight: 700; color: #ffffff; margin-bottom: 0.5rem;">Free Tier</h2>
          <div style="font-size: 2.2rem; font-weight: 800; color: #a3e635; margin-bottom: 1rem;">₹0 <span style="font-size: 0.9rem; color: #94a3b8; font-weight: 500;">/ forever</span></div>
          <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem;">Ideal for personal calls, one-on-one sessions, and quick team meetups.</p>
          <ul style="list-style: none; padding: 0; margin: 0 0 2rem 0; font-size: 0.9rem; color: #e2e8f0; line-height: 2;">
            <li>✓ Up to 8 participants</li>
            <li>✓ 40-minute meeting limit</li>
            <li>✓ Standard HD video quality</li>
            <li>✓ Screen sharing &amp; in-call chat</li>
            <li>✓ Live Hindi captions</li>
          </ul>
          <a href="/" style="display: block; text-align: center; background: rgba(255,255,255,0.1); color: #ffffff; padding: 0.75rem 1.5rem; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">
            Get Started Free
          </a>
        </div>
        <div style="background: rgba(63,98,18,0.25); border: 2px solid #a3e635; border-radius: 1.5rem; padding: 2rem; text-align: left; position: relative;">
          <div style="position: absolute; top: -12px; right: 24px; background: #a3e635; color: #142417; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 9999px; text-transform: uppercase;">Most Popular</div>
          <h2 style="font-size: 1.35rem; font-weight: 700; color: #ffffff; margin-bottom: 0.5rem;">Pro Tier</h2>
          <div style="font-size: 2.2rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem;">₹699 <span style="font-size: 0.9rem; color: #a3e635; font-weight: 500;">/ month</span></div>
          <p style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 1.5rem;">For businesses, professionals, and teams requiring unlimited duration and cloud recording.</p>
          <ul style="list-style: none; padding: 0; margin: 0 0 2rem 0; font-size: 0.9rem; color: #e2e8f0; line-height: 2;">
            <li>✓ Up to 100 participants</li>
            <li>✓ No duration limits (24 hours)</li>
            <li>✓ Priority HD video &amp; audio</li>
            <li>✓ Cloud meeting recordings</li>
            <li>✓ Full chat history &amp; notes</li>
            <li>✓ Priority 24/7 customer support</li>
          </ul>
          <a href="/payment" style="display: block; text-align: center; background: #a3e635; color: #142417; padding: 0.75rem 1.5rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.9rem;">
            Upgrade to Pro Now
          </a>
        </div>
      </div>`
  },
  {
    path: "/join",
    title: "Join Instant Video Meeting | Viva Meeting",
    description:
      "Join a Viva Meeting in seconds directly in your web browser. Enter your meeting code or click your invite link for secure HD video calling. No app required.",
    keywords:
      "join Viva meeting, join video call, join meeting online, web video conference join, enter meeting code",
    canonical: `${BASE_URL}/join`,
    heading: "Join an Instant Video Meeting",
    subheading: "Enter your meeting code or invite link to connect immediately.",
    schemaType: "WebPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Join Meeting", url: `${BASE_URL}/join` }
    ],
    htmlContent: `
      <header style="max-width: 580px; margin: 0 auto; text-align: center;">
        <h1 style="font-size: 2.5rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 1rem;">
          Join a <span style="color: #a3e635;">Meeting</span>
        </h1>
        <p style="font-size: 1.05rem; color: #cbd5e1; margin-bottom: 2rem;">
          Enter your meeting code or paste your invite URL to connect with high-definition audio and video.
        </p>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 1.5rem; padding: 2rem; text-align: center; max-width: 440px; margin: 0 auto;">
          <h2 style="font-size: 1.1rem; color: #ffffff; margin-bottom: 1rem; font-weight: 600;">Ready to connect?</h2>
          <p style="font-size: 0.85rem; color: #94a3b8; line-height: 1.5; margin-bottom: 1.5rem;">
            Viva Meeting works in Chrome, Edge, Safari, Firefox, and mobile browsers with zero software download needed.
          </p>
          <a href="/" style="display: inline-block; background: #3f6212; color: #ffffff; padding: 0.75rem 2rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.95rem;">
            Go to Meeting Dashboard
          </a>
        </div>
      </header>`
  },
  {
    path: "/payment",
    title: "Upgrade to Pro - UPI & Razorpay Payment | Viva Meeting",
    description:
      "Upgrade your Viva Meeting account to Pro. Instant activation via UPI QR code, Google Pay, PhonePe, Paytm, Debit/Credit Card, or Net Banking.",
    keywords:
      "Viva Meeting payment, upgrade Pro, Viva meeting UPI, video conferencing subscription, pay for Viva meeting",
    canonical: `${BASE_URL}/payment`,
    heading: "Upgrade to Viva Meeting Pro",
    subheading: "Quick and secure payment with instant feature activation.",
    schemaType: "ItemPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Payment", url: `${BASE_URL}/payment` }
    ],
    htmlContent: `
      <header style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h1 style="font-size: 2.4rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 1rem;">
          Upgrade to <span style="color: #a3e635;">Viva Pro</span>
        </h1>
        <p style="font-size: 1rem; color: #cbd5e1; margin-bottom: 2rem;">
          Enjoy unlimited call durations, up to 100 participants, and cloud recordings for ₹699/month.
        </p>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 1.5rem; padding: 2rem; text-align: left;">
          <h2 style="font-size: 1.15rem; color: #ffffff; margin-bottom: 0.75rem; font-weight: 700;">Supported Payment Methods:</h2>
          <ul style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.8; margin-bottom: 1.5rem; padding-left: 1.25rem;">
            <li>UPI (Google Pay, PhonePe, Paytm, BHIM, Cred)</li>
            <li>Debit and Credit Cards (Visa, MasterCard, RuPay)</li>
            <li>Net Banking from 50+ major Indian banks</li>
          </ul>
          <a href="/pricing" style="color: #a3e635; font-size: 0.85rem; font-weight: 600; text-decoration: underline;">
            ← Compare all plan features on Pricing page
          </a>
        </div>
      </header>`
  },
  {
    path: "/sessions",
    title: "Meeting History & Past Sessions | Viva Meeting",
    description:
      "View your past video conference session logs, participant counts, call durations, and notes on Viva Meeting.",
    keywords:
      "Viva Meeting history, past video meetings, conference logs, meeting sessions Viva",
    canonical: `${BASE_URL}/sessions`,
    heading: "Meeting History & Past Sessions",
    subheading: "Access logs, participant details, and records of your past conferences.",
    schemaType: "WebPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Sessions", url: `${BASE_URL}/sessions` }
    ],
    htmlContent: `
      <header style="max-width: 680px; margin: 0 auto; text-align: center;">
        <h1 style="font-size: 2.4rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 1rem;">
          Meeting <span style="color: #a3e635;">History</span>
        </h1>
        <p style="font-size: 1rem; color: #cbd5e1; margin-bottom: 2rem;">
          Keep track of your past conferences, participant attendance, and meeting durations.
        </p>
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1.5rem; padding: 2rem; text-align: center;">
          <h2 style="font-size: 1.1rem; color: #ffffff; font-weight: 600; margin-bottom: 0.5rem;">Sign In to View Your History</h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 1.5rem;">
            Connect with your Viva Meeting account to sync meeting logs across all your devices.
          </p>
          <a href="/login" style="background: #3f6212; color: #ffffff; padding: 0.75rem 1.75rem; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 0.9rem;">
            Sign In to Account
          </a>
        </div>
      </header>`
  },
  {
    path: "/login",
    title: "Sign In | Viva Meeting",
    description:
      "Sign in to your Viva Meeting account to start, host, schedule, and join secure encrypted video conferences.",
    keywords: "Viva Meeting sign in, login Viva meeting, access video calls",
    canonical: `${BASE_URL}/login`,
    heading: "Sign In to Viva Meeting",
    subheading: "Access your dashboard, host meetings, and manage recordings.",
    schemaType: "WebPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Sign In", url: `${BASE_URL}/login` }
    ],
    htmlContent: `
      <header style="max-width: 480px; margin: 0 auto; text-align: center;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 1rem;">
          Welcome <span style="color: #a3e635;">Back</span>
        </h1>
        <p style="font-size: 0.95rem; color: #cbd5e1; margin-bottom: 2rem;">
          Sign in to your Viva Meeting account to start instant meetings and manage your settings.
        </p>
      </header>`
  },
  {
    path: "/signup",
    title: "Create Account | Viva Meeting",
    description:
      "Create your free Viva Meeting account. Host instant HD video conferences with screen sharing and encrypted waiting rooms.",
    keywords: "create Viva meeting account, register video conference, free meeting signup",
    canonical: `${BASE_URL}/signup`,
    heading: "Create Your Free Account",
    subheading: "Get started with Viva Meeting in seconds.",
    schemaType: "WebPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Sign Up", url: `${BASE_URL}/signup` }
    ],
    htmlContent: `
      <header style="max-width: 480px; margin: 0 auto; text-align: center;">
        <h1 style="font-size: 2.2rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 1rem;">
          Get Started with <span style="color: #a3e635;">Viva Meeting</span>
        </h1>
        <p style="font-size: 0.95rem; color: #cbd5e1; margin-bottom: 2rem;">
          Join thousands of professionals using Viva Meeting for secure, high-definition communication.
        </p>
      </header>`
  },
  {
    path: "/privacy",
    title: "Privacy Policy (DPDP Act 2023) | Viva Meeting",
    description:
      "Privacy Policy for Viva Meeting in strict compliance with India's Digital Personal Data Protection (DPDP) Act, 2023. Learn about your data rights and privacy safeguards.",
    keywords:
      "Viva Meeting privacy policy, DPDP Act 2023 compliance, data protection video call, user privacy Viva",
    canonical: `${BASE_URL}/privacy`,
    heading: "Privacy Policy (DPDP Act 2023)",
    subheading: "Our statutory commitments to data protection, transparency, and Data Principal rights.",
    schemaType: "ItemPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Privacy Policy", url: `${BASE_URL}/privacy` }
    ],
    htmlContent: `
      <article style="max-width: 800px; margin: 0 auto; text-align: left; color: #cbd5e1; line-height: 1.7;">
        <header style="margin-bottom: 2rem; text-align: center;">
          <h1 style="font-size: 2.4rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 0.5rem;">
            Privacy Policy <span style="color: #a3e635;">(DPDP Act 2023)</span>
          </h1>
          <p style="font-size: 0.85rem; color: #94a3b8;">
            Effective Date: September 22, 2026 | Digital Personal Data Protection Act, 2023 Compliance
          </p>
        </header>
        <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.15rem; color: #ffffff; font-weight: 700; margin-bottom: 0.75rem;">1. Preamble &amp; Statutory Framework</h2>
          <p style="font-size: 0.9rem; margin: 0;">
            Viva Meeting is committed to protecting your personal data in strict adherence to the Digital Personal Data Protection (DPDP) Act, 2023 of the Republic of India. Peer-to-peer audio and video streams are encrypted end-to-end via WebRTC protocols.
          </p>
        </section>
        <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.15rem; color: #ffffff; font-weight: 700; margin-bottom: 0.75rem;">2. Rights of the Data Principal</h2>
          <p style="font-size: 0.9rem; margin: 0;">
            Under the DPDP Act 2023, you have the right to access a summary of personal data processed, request correction or erasure of personal data, and nominate any other individual in event of death or incapacity.
          </p>
        </section>
        <p style="text-align: center; margin-top: 2rem;">
          <a href="/" style="color: #a3e635; font-size: 0.9rem; font-weight: 600; text-decoration: underline;">
            ← Return to Viva Meeting Home
          </a>
        </p>
      </article>`
  },
  {
    path: "/terms",
    title: "Terms of Service | Viva Meeting",
    description:
      "Terms of Service and user agreement governing the use of Viva Meeting video conferencing services and platform.",
    keywords:
      "Viva Meeting terms of service, terms of use video conferencing, legal user agreement Viva",
    canonical: `${BASE_URL}/terms`,
    heading: "Terms of Service",
    subheading: "The agreement governing your use of Viva Meeting.",
    schemaType: "ItemPage",
    breadcrumbs: [
      { name: "Home", url: `${BASE_URL}/` },
      { name: "Terms of Service", url: `${BASE_URL}/terms` }
    ],
    htmlContent: `
      <article style="max-width: 800px; margin: 0 auto; text-align: left; color: #cbd5e1; line-height: 1.7;">
        <header style="margin-bottom: 2rem; text-align: center;">
          <h1 style="font-size: 2.4rem; font-weight: 800; color: #ffffff; line-height: 1.2; margin-bottom: 0.5rem;">
            Terms of <span style="color: #a3e635;">Service</span>
          </h1>
          <p style="font-size: 0.85rem; color: #94a3b8;">
            Last Revised: September 22, 2026 | Viva Meeting
          </p>
        </header>
        <section style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.15rem; color: #ffffff; font-weight: 700; margin-bottom: 0.75rem;">1. Acceptance of Terms</h2>
          <p style="font-size: 0.9rem; margin: 0;">
            By accessing or using Viva Meeting, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>
        </section>
        <p style="text-align: center; margin-top: 2rem;">
          <a href="/" style="color: #a3e635; font-size: 0.9rem; font-weight: 600; text-decoration: underline;">
            ← Return to Viva Meeting Home
          </a>
        </p>
      </article>`
  }
];

// Generate breadcrumb structured data
function getBreadcrumbsSchema(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

let generatedCount = 0;

for (const page of pages) {
  let html = baseTemplate;

  // 1. Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${page.title}</title>`);

  // 2. Replace Meta Description
  html = html.replace(
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${page.description}" />`
  );

  // 3. Replace Meta Keywords
  if (page.keywords) {
    html = html.replace(
      /<meta\s+name="keywords"\s+content=".*?"\s*\/?>/i,
      `<meta name="keywords" content="${page.keywords}" />`
    );
  }

  // 4. Replace Canonical URL
  html = html.replace(
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${page.canonical}" />`
  );

  // 5. Replace Open Graph Tags
  html = html.replace(
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:url" content="${page.canonical}" />`
  );

  // 6. Replace Twitter Tags
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:url" content="${page.canonical}" />`
  );

  // 7. Inject Breadcrumbs JSON-LD schema before </head>
  const breadcrumbsSchema = JSON.stringify(getBreadcrumbsSchema(page.breadcrumbs));
  const breadcrumbTag = `\n    <!-- Breadcrumbs Structured Data -->\n    <script type="application/ld+json">\n    ${breadcrumbsSchema}\n    </script>\n  `;
  html = html.replace("</head>", `${breadcrumbTag}</head>`);

  // 8. Replace root container pre-rendered content for fast crawling & hydration
  const renderedWrapper = `
    <div id="root">
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; min-height: 100vh; background: #081307; color: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 2rem 1.5rem; text-align: center;">
        <nav style="display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 960px; margin-bottom: 2.5rem; padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.06); border-radius: 9999px; border: 1px solid rgba(255,255,255,0.12); backdrop-blur: 10px;">
          <a href="/" style="font-size: 1.25rem; font-weight: 800; color: #ffffff; text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
            <span>VIVA</span><span style="color: #a3e635;">Meeting</span>
          </a>
          <div style="display: flex; gap: 1.25rem; font-size: 0.85rem; font-weight: 600;">
            <a href="/" style="color: #e2e8f0; text-decoration: none;">Dashboard</a>
            <a href="/pricing" style="color: #e2e8f0; text-decoration: none;">Pricing</a>
            <a href="/join" style="color: #e2e8f0; text-decoration: none;">Join</a>
            <a href="/sessions" style="color: #e2e8f0; text-decoration: none;">Sessions</a>
            <a href="/login" style="color: #a3e635; text-decoration: none;">Sign In</a>
          </div>
        </nav>
        <main style="max-width: 900px; width: 100%; display: flex; flex-direction: column; align-items: center;">
          ${page.htmlContent}
        </main>
        <footer style="margin-top: 3rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; width: 100%; max-width: 960px;">
          <div style="display: flex; gap: 1.5rem; justify-content: center; font-size: 0.85rem; color: #94a3b8; flex-wrap: wrap;">
            <a href="/" style="color: #a3e635; text-decoration: none; font-weight: 500;">Home</a>
            <a href="/pricing" style="color: #a3e635; text-decoration: none; font-weight: 500;">Pricing</a>
            <a href="/payment" style="color: #a3e635; text-decoration: none; font-weight: 500;">Payment</a>
            <a href="/join" style="color: #a3e635; text-decoration: none; font-weight: 500;">Join Meeting</a>
            <a href="/sessions" style="color: #a3e635; text-decoration: none; font-weight: 500;">Sessions</a>
            <a href="/terms" style="color: #a3e635; text-decoration: none; font-weight: 500;">Terms</a>
            <a href="/privacy" style="color: #a3e635; text-decoration: none; font-weight: 500;">Privacy Policy</a>
          </div>
          <p style="margin-top: 1rem; font-size: 0.75rem; color: #64748b;">
            &copy; 2026 Viva Meeting. End-to-end encrypted WebRTC. DPDP Act 2023 Compliant.
          </p>
        </footer>
      </div>
    </div>`;

  html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<script type="module"/i, `${renderedWrapper}\n    <script type="module"`);

  // Target output file path
  let targetFile = path.join(distDir, "index.html");
  if (page.path !== "/") {
    const pageDir = path.join(distDir, page.path.replace(/^\//, ""));
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }
    targetFile = path.join(pageDir, "index.html");
  }

  fs.writeFileSync(targetFile, html, "utf-8");
  console.log(`✓ Generated static page: ${page.path} -> ${path.relative(distDir, targetFile)}`);
  generatedCount++;
}

console.log(`\nSuccessfully pre-rendered ${generatedCount} static pages for SEO & Google Search Indexing!`);
