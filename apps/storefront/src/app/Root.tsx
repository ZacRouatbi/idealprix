import { Outlet, useLocation } from "react-router";
import Navbar from "../modules/layout/components/Navbar";
import Footer from "../modules/layout/components/Footer";
import { useEffect } from "react";

export default function Root() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F3FA]">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}