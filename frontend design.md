You are an elite Frontend UI/UX Architect specializing in React, Tailwind CSS, and polished modern design patterns. 
make every code files in typescript + swc
Your task is to build the entire frontend interface for a video-conferencing SaaS app called "Meetup" (a clone of Zoom and Google Meet). The frontend must be beautiful, cohesive, ultra-responsive, and have highly polished micro-interactions (hover states, spring transitions, state toggles).

### 1. Visual Identity & Theme
- Color Palette: "Slate Dark" aesthetic. 
  - Backgrounds: Dark slate/zinc grays (bg-slate-950, bg-slate-900, bg-slate-900/50 for cards).
  - Borders: Crisp, thin borders (border-slate-800).
  - Primary Brand Accent: Indigo/Violet (indigo-600, hover:indigo-500, active:indigo-700).
  - Text: High-contrast typography (text-slate-100 for titles, text-slate-400 for secondary, text-indigo-400 for accent text).
- Typography: Inter/Sans-serif style, clean tracking, medium/semibold headings.
- Animations: Smooth, spring-like transitions on hover, focus, and state toggles (e.g., transition-all duration-200 ease-in-out).

### 2. Component-by-Component Specifications

#### A. Global Layout & Navigation (ProtectedLayout)
- Navbar: Fixed to the top, semi-transparent background (bg-slate-950/80 backdrop-blur-md) with a thin bottom border.
  - Left side: Meetup logo (minimalist icon with text "meetup" in bold white and a colored dot "." in brand violet). Beside it, navigation tabs (Dashboard, Sessions, Pricing) with smooth underline hover states and an active link highlight.
  - Right side: User welcome tag ("Welcome, [Name]") in slate-400, and a user profile button wrapper designed to house Clerk’s <UserButton /> component.
- Footer: Lightweight, sticky bottom footer with subtle copyright text and social links in text-slate-500, styled to disappear on the active video meeting page.

#### B. Dashboard Page (dashboard.jsx)
- Left Hero Column:
  - Small, high-contrast pills (e.g., "✓ Secure peer-to-peer encryption" with a lock icon).
  - A bold, punchy H1 headline: "High-quality video calls. Built for everyone." where "everyone" is highlighted in violet.
  - A friendly, short description of the platform's features (HD video, sub-100ms lag, real-time messaging).
- Action Console:
  - "New Meeting" Action: A prominent button with a plus icon, colored in brand violet.
  - "Join Meeting" Action: A unified search-input group. Includes an input field (dark slate, crisp border) where users can paste a Meeting ID, and an inline "Join" button that lights up when the ID format is valid.
- Right Hero Column:
  - A dashboard card displaying a real-time, beautifully formatted Digital Clock/Calendar Widget.
  - A mini Profile/Stats card displaying user statistics (Active Plan: Free vs Premium, meetings hosted, and usage meter showing limit bars: e.g., 2/30 meetings used).

#### C. Pricing Page (pricing.jsx)
- A clear, symmetrical pricing deck comparing "Free" and "Premium" side-by-side.
- Free Tier Card: Simple border, listing core features (up to 4 participants, 40-minute limit, 30 meetings/month) with a "Current Plan" disabled slate button.
- Premium Tier Card: Featured glow border (border-indigo-500) with a "Popular" badge at the top. Lists advanced features (unlimited meetings, up to 100 participants, priority HD quality) and a bold "Upgrade to Premium" button that transitions from indigo-600 to indigo-500 on hover.

#### D. Meeting History Logs (sessions.jsx)
- Fallback State: If no history exists, display an empty-state illustration using slate icon styling with the title "No sessions recorded yet."
- Sessions Table/List: Chronological rows representing past calls. Each card displays:
  - Title & Date/Time Badge.
  - Participant counter pill (e.g., "👤 12").
  - "View Details" button which slides open a details modal.
- Slide-over / Modal Details Window:
  - Dynamic tab control: Toggle between a "Chat Log" tab and a "Participants List" tab.
  - Chat Log Tab: Beautiful transcript feed with message bubbles, sender labels, and timestamping.
  - Participants Tab: List of past attendees with joining timestamps and duration metrics.

#### E. Active Meeting Room (meeting_room.jsx)
- Core Interface Layout: Absolute full-screen viewport (h-screen w-screen overflow-hidden bg-slate-950) hosting a primary video stream layout, a bottom control overlay, and a collapsible sidebar.
- Video Streaming Grid (video_grid.jsx):
  - Responsive, dynamic container that reflows automatically based on participant count (1 tile: full-screen; 2 tiles: split-screen side-by-side or stacked; 3+ tiles: grid matrix).
  - Video Tile (video_tile.jsx):
    - Dark gray background placeholder with smooth rounded corners (rounded-2xl) and subtle drop shadow.
    - Overlay HUD: Bottom-left participant name badge (semi-transparent bg-slate-950/60). Top-right audio status indicator (microphone-off icon in red if muted).
    - Camera Disabled View: If the webcam is off, smoothly hide the video feed and animate a central, pulsating profile avatar avatar icon (with active wave concentric rings in the background).
    - Active Speaker Highlight: Add a 2px glowing violet outline to the tile of the participant currently speaking.
- Sticky Control Bar (control_bar.jsx):
  - Floating, rounded dock centered horizontally at the bottom of the screen (bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl py-3 px-6 shadow-2xl).
  - Buttons: Media controllers (Mic Mute/Unmute, Camera Toggle, Screen Share, Open Chat, Open Participants).
  - State Indicators: Active states are represented with clean slate backgrounds; disabled/muted states are represented by background transitions to red (bg-red-500/20 text-red-500 border border-red-500/30).
  - End Call Button: Highly distinct, vibrant red button (bg-red-600, hover:bg-red-500) labeled "Leave Meeting" (or "End Meeting for All" if host).
- Collapsible Sidebar Panel:
  - Slides out smoothly from the right side. Occupies 350px on desktop, full-width on mobile.
  - Chat Mode: Interactive input bar at the bottom with a paper-airplane send button. Message list supports auto-scroll and handles scroll-anchoring.
  - Participants Mode: List of current users with active microphone/camera icon indicators next to their names.

Deliver the CSS tailwind config settings and full React UI code matching this layout. Let's make it look incredibly clean, professional, and production-ready.