import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@lib/context/AuthContext";
import AccountTemplate from "@modules/account/templates";

export default function AccountDashboardPage() {
  const { customer, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !token) {
      navigate("/", { replace: true });
    }
  }, [isLoading, token, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      setOrdersLoading(true);
      try {
        const BACKEND_URL = (import.meta as any).env?.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";
        const PUB_KEY = (import.meta as any).env?.VITE_MEDUSA_PUBLISHABLE_KEY || "";
        
        const res = await fetch(`${BACKEND_URL}/store/orders`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(PUB_KEY ? { "x-publishable-api-key": PUB_KEY } : {}),
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else {
          const errData = await res.text().catch(() => "");
          console.error("Failed to fetch orders:", res.status, errData);
          setOrders([]);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [token]);

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

  return <AccountTemplate customer={customer} orders={orders} ordersLoading={ordersLoading} />;
}