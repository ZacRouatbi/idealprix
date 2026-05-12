import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@lib/context/AuthContext";
import AccountTemplate from "@modules/account/templates";

export default function AccountDashboardPage() {
  const { customer, isLoading, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !token) {
      navigate("/", { replace: true });
    }
  }, [isLoading, token, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4302A] mx-auto mb-4"></div>
          <p className="text-[#717182]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return <AccountTemplate customer={customer} orders={null} />;
}