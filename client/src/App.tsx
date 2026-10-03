import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "./components/protected_layout";
import Dashboard from "./pages/dashboard";
import Pricing from "./pages/pricing";
import Sessions from "./pages/sessions";
import MeetingRoom from "./pages/meeting_room";
import Login from "./pages/login";
import SignUpPage from "./pages/signup";
import PrivacyPolicy from "./pages/privacy_policy";
import TermsOfService from "./pages/terms_of_service";
import PaymentPage from "./pages/payment";

import JoinPage from "./pages/join";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth, Legal & Guest Join Routes (No Google/Clerk Login Required) */}
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:meetingId" element={<JoinPage />} />
        <Route path="/meeting/:roomId" element={<MeetingRoom />} />
        <Route path="/login/*" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup/*" element={<SignUpPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />

        {/* Public App Layout with Navigation and Footer - Fully Indexable & Crawlable */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/pay" element={<Navigate to="/payment" replace />} />
          <Route path="/sessions" element={<Sessions />} />
        </Route>

        {/* Fallback redirects to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
