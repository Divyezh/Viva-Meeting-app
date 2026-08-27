import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "./components/protected_layout";
import ProtectedRoute from "./components/protected_route";
import Dashboard from "./pages/dashboard";
import Pricing from "./pages/pricing";
import Sessions from "./pages/sessions";
import MeetingRoom from "./pages/meeting_room";
import Login from "./pages/login";
import SignUpPage from "./pages/signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login/*" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup/*" element={<SignUpPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected Routes with Layout */}
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
          <Route path="/meeting/:roomId" element={<MeetingRoom />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
