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
    <div className="bg-app-gradient flex min-h-screen flex-col selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar />
      <main className="flex-1 flex flex-col justify-center">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default ProtectedLayout;
