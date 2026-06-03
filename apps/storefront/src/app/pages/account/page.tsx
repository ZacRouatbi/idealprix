import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@lib/context/AuthContext";
import AccountTemplate from "@modules/account/templates";
import { fetchCustomerOrders } from "@lib/data/backend-api";
import type { Order } from "@lib/data/backend-api";

const ORDERS_PER_PAGE = 5;

export default function AccountDashboardPage() {
  const { customer, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPage, setLoadingPage] = useState<number | null>(null);
  const [prefetchedOrders, setPrefetchedOrders] = useState<Record<number, Order[]>>({});

  useEffect(() => {
    if (!isLoading && !token) {
      navigate("/", { replace: true });
    }
  }, [isLoading, token, navigate]);

  const loadOrders = async (page: number) => {
    if (!token) return null;

    const offset = (page - 1) * ORDERS_PER_PAGE;
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000/api"}/orders/customer?limit=${ORDERS_PER_PAGE}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { orders: data.data || [], totalPages: data.totalPages, count: data.count };
    }
    return null;
  };

  useEffect(() => {
    const initOrders = async () => {
      if (!token) return;
      
      try {
        const data = await fetchCustomerOrders(token, {
          limit: ORDERS_PER_PAGE,
          offset: 0,
        });

        setOrders(data.data);
        setTotalPages(data.totalPages);
        setTotalCount(data.count);

        if (data.totalPages > 1 && data.data.length === ORDERS_PER_PAGE) {
          const nextOffset = ORDERS_PER_PAGE;
          fetch(
            `${import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000/api"}/orders/customer?limit=${ORDERS_PER_PAGE}&offset=${nextOffset}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
            .then((res) => res.json())
            .then((nextData) => {
              if (nextData.data) {
                setPrefetchedOrders((prev) => ({ ...prev, 2: nextData.data }));
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (token) {
      initOrders();
    }
  }, [token]);

  const handlePageChange = async (page: number) => {
    if (!token) return;

    if (prefetchedOrders[page]) {
      setOrders(prefetchedOrders[page]);
      setCurrentPage(page);
    } else {
      setLoadingPage(page);
      try {
        const result = await loadOrders(page);
        if (result) {
          setOrders(result.orders);
          setTotalPages(result.totalPages);
          setTotalCount(result.count);
          setCurrentPage(page);
        }
      } catch (err) {
        console.error("Failed to load page:", err);
      } finally {
        setLoadingPage(null);
      }
    }
  };

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

  const adaptedOrders = orders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    total_amount: order.total_amount,
    subtotal: order.subtotal,
    shipping_amount: order.shipping_amount,
    promo_code: order.promo_code,
    discount_amount: order.discount_amount,
    shipping_address: order.shipping_address,
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

  return (
    <AccountTemplate
      customer={customer}
      orders={adaptedOrders}
      ordersPagination={{
        currentPage,
        totalPages,
        onPageChange: handlePageChange,
        loadingPage,
      }}
      ordersLoading={ordersLoading}
    />
  );
}