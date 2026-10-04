import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./navbar";
import Footer from "./footer";

const ProtectedLayout = () => {
  const location = useLocation();
  const isMeetingRoom = location.pathname.startsWith("/meeting/");

  if (isMeetingRoom) {
    return <Outlet />;
  }

  return (
    <div className="bg-[#1a1a1a] text-[#f3f4f6] flex min-h-screen flex-col selection:bg-[#10b981]/30 selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ProtectedLayout;
