import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "./components/protected_layout";
import ProtectedRoute from "./components/protected_route";
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
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Protected App Routes (Requires Login or Sign Up) */}
        <Route
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/pay" element={<PaymentPage />} />
        </Route>

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
