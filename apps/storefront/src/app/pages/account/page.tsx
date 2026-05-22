import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@lib/context/AuthContext";
import AccountTemplate from "@modules/account/templates";
import { fetchCustomerOrders } from "@lib/data/backend-api";
import type { Order } from "@lib/data/backend-api";

export default function AccountDashboardPage() {
  const { customer, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
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
        const data = await fetchCustomerOrders(token);
        setOrders(data.data || []);
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

  // Adapt Order to BackendOrder format for AccountTemplate
  const adaptedOrders = orders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    total_amount: order.total_amount,
    subtotal: order.subtotal ?? 0,
    shipping_amount: 0,
    created_at: order.created_at,
    items: order.items?.map((it) => ({
      id: it.id,
      product_name: it.product_name,
      product_sku: it.product_sku,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
      product_image: it.product_image,
    })) ?? [],
  }));

  return <AccountTemplate customer={customer} orders={adaptedOrders} />;
}