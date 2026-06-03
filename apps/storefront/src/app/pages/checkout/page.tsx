import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  ChevronRight,
  Check,
  Truck,
  Zap,
  Shield,
  CreditCard,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useCart } from "../../../lib/context/CartContext";
import { useAuth } from "../../../lib/context/AuthContext";
import { formatPrice } from "../../../lib/data/products";
import { fetchShippingProviders, type ShippingProvider } from "../../../lib/data/backend-api";
import { z } from "zod";

const postalCodeSchema = z.string().regex(/^\d+$/, "Postal code must contain only numbers");

type Step = 1 | 2 | 3 | 4;
type PaymentMethod = "online" | "cod";

type AddressForm = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

const TUNISIAN_CITIES = [
  "Tunis","Sfax","Sousse","Kairouan","Bizerte","Gabès",
  "Ariana","La Marsa","Ben Arous","Monastir","Nabeul","Hammamet",
];

const API_BASE_URL =
  (import.meta as any).env?.VITE_BACKEND_API_URL || 
  (import.meta as any).env?.VITE_BACKEND_URL || 
  "http://localhost:3000/api";

async function checkoutFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      },
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err?.error || `Request failed: ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timeout - please check if the server is running');
    }
    if (err.message?.includes('Failed to fetch') || err.message?.includes('ECONNREFUSED')) {
      throw new Error('Cannot connect to server. Please ensure the backend is running on localhost:3000.');
    }
    throw err;
  }
}

export default function CheckoutPage() {
  const { cart, subtotal, total: discountedTotal, clearCart } = useCart();
  const { customer, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [address, setAddress] = useState<AddressForm>({
    fullName: "", phone: "", email: "", address: "", city: "", postalCode: "", notes: "",
  });
  const [shippingProviders, setShippingProviders] = useState<ShippingProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShippingProviders().then(providers => {
      setShippingProviders(providers);
      if (providers.length > 0) {
        setSelectedProviderId(providers[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (customer && !authLoading) {
      setAddress(prev => ({
        ...prev,
        fullName: customer.first_name && customer.last_name 
          ? `${customer.first_name} ${customer.last_name}` 
          : customer.first_name || prev.fullName,
        phone: customer.phone || prev.phone,
        email: customer.email || prev.email,
      }));
    }
  }, [customer, authLoading]);

  const selectedProvider = shippingProviders.find(p => p.id === selectedProviderId);
  const shippingCost = selectedProvider?.price ?? 0;
  const total = discountedTotal + shippingCost;

  const steps = [
    { n: 1, label: "Address" },
    { n: 2, label: "Delivery" },
    { n: 3, label: "Payment" },
    { n: 4, label: "Confirmation" },
  ];

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (!address.fullName || !address.email || !address.phone || !address.address || !address.city) {
        throw new Error("Please fill in all required fields.");
      }
      const postalCodeResult = postalCodeSchema.safeParse(address.postalCode);
      if (!postalCodeResult.success) {
        throw new Error(postalCodeResult.error.issues[0].message);
      }
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || "Validation error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (cart.items.length === 0) {
        throw new Error("Cart is empty.");
      }

      const orderPayload = {
        items: cart.items.map((item) => ({
          productId: item.product.id,
          productName: item.product.title,
          productSku: (item.product as any).sku || null,
          quantity: item.quantity,
          unitPrice: item.product.price,
          productImage: (item.product as any).image,
        })),
        customerEmail: address.email,
        customerName: address.fullName,
        customerPhone: address.phone,
        shippingAddress: {
          fullName: address.fullName,
          address: address.address,
          city: address.city,
          postalCode: address.postalCode,
          countryCode: "tn",
          phone: address.phone,
        },
        subtotal: subtotal,
        discount: subtotal - discountedTotal,
        total: discountedTotal,
        promoCode: cart.promoCode?.code || null,
        shippingProviderId: selectedProviderId,
        notes: address.notes || undefined,
      };

      const result = await checkoutFetch<{ order: { id: string; order_number: string } }>(
        "/public/checkout",
        {
          method: "POST",
          body: JSON.stringify(orderPayload),
        }
      );

      setPlacedOrderId(result.order.order_number);
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      setError(err.message || "Failed to create order.");
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F0F3FA] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#717182] mb-4">Your cart is empty.</p>
          <Link
            to="/products"
            className="bg-[#D4302A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b82a22] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Shop Products
          </Link>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F9F8F7] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2
            className="text-[#1E1E1E] mb-2"
            style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}
          >
            Order Confirmed!
          </h2>
          {placedOrderId && (
            <p className="text-xs text-[#717182] mb-1">
              Order #: <span className="font-mono">{placedOrderId}</span>
            </p>
          )}
          <p className="text-[#717182] text-sm mb-4">
            {paymentMethod === "cod" 
              ? "You will pay cash on delivery." 
              : "Your online payment has been processed."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#D4302A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b82a22] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F7]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-5">
          <Link to="/" className="hover:text-[#D4302A]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/cart" className="hover:text-[#D4302A]">Cart</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">Checkout</span>
        </nav>

        {/* Title */}
        <h1
          className="text-[#1E1E1E] mb-6"
          style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}
        >
          Checkout
        </h1>

        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          {steps.map((step, idx) => (
            <div key={step.n} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep > step.n
                      ? "bg-green-500 text-white"
                      : currentStep === step.n
                      ? "bg-[#D4302A] text-white"
                      : "bg-[#E5E5E5] text-[#717182]"
                  }`}
                >
                  {currentStep > step.n ? <Check className="w-4 h-4" /> : step.n}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    currentStep === step.n ? "text-[#D4302A]"
                    : currentStep > step.n ? "text-green-500"
                    : "text-[#717182]"
                  }`}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mb-4 transition-colors ${
                    currentStep > step.n ? "bg-green-500" : "bg-[#E5E5E5]"
                  }`}
                  style={{ minWidth: "3rem" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Global error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ─── Left panel ─── */}
          <div className="flex-1">

            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1E1E1E] mb-5" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                  Delivery Information
                </h2>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Full Name</label>
                    <input type="text" required value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="First Last"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Phone</label>
                    <input type="tel" required value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+216 XX XXX XXX"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Email</label>
                    <input type="email" required value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Address</label>
                    <input type="text" required value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      placeholder="Street address"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">City</label>
                      <div className="relative">
                        <select required value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full appearance-none border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7] cursor-pointer">
                          <option value="">Select</option>
                          {TUNISIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182] pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Postal Code</label>
                      <input type="text" value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="Postal Code"
                        className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#717182] mb-1.5">Notes (optional)</label>
                    <textarea value={address.notes}
                      onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                      placeholder="Additional information..." rows={3}
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7] resize-none" />
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
                      : <>Continue to Delivery <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Delivery */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1E1E1E] mb-1" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                  Delivery Method
                </h2>
                <p className="text-sm text-[#717182] mb-5">Choose your delivery option</p>

                <div className="space-y-3 mb-6">
                  {shippingProviders.map((provider) => {
                    const Icon = provider.service_type === "pickup" ? Check : Truck;
                    return (
                      <label key={provider.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedProviderId === provider.id
                            ? "border-[#D4302A] bg-red-50"
                            : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                        }`}>
                        <input type="radio" name="delivery" value={provider.id}
                          checked={selectedProviderId === provider.id}
                          onChange={() => setSelectedProviderId(provider.id)}
                          className="accent-[#D4302A]" />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedProviderId === provider.id ? "bg-[#D4302A] text-white" : "bg-[#F9F8F7] text-[#717182]"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {provider.name}
                          </p>
                        </div>
                        <span className="font-bold text-[#1E1E1E] text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                          {provider.price > 0 ? formatPrice(provider.price) : "Free"}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(1)} disabled={isLoading}
                    className="flex-1 border border-[#E5E5E5] text-[#1E1E1E] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F8F7] transition-colors disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    ← Back
                  </button>
                  <button onClick={() => setCurrentStep(3)} disabled={isLoading || !selectedProviderId}
                    className="flex-grow bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    <>Continue to Payment <ChevronRight className="w-4 h-4" /></>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1E1E1E] mb-1" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                  Payment Method
                </h2>
                <p className="text-sm text-[#717182] mb-5">
                  All transactions are secure and encrypted.
                </p>

                {/* Payment method options */}
                <div className="space-y-3 mb-6">
                  {/* COD — available */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === "cod" ? "border-[#D4302A] bg-red-50" : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                  }`}>
                    <input type="radio" name="payment" value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="accent-[#D4302A]" />
                    <span className="text-xl">💵</span>
                    <div>
                      <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Payment Upon Delivery
                      </p>
                      <p className="text-xs text-[#717182]">Pay cash when you receive your order</p>
                    </div>
                  </label>

                  {/* Online Payment - template */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === "online" ? "border-[#D4302A] bg-red-50" : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                  }`}>
                    <input type="radio" name="payment" value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="accent-[#D4302A]" />
                    <CreditCard className="w-5 h-5 text-[#D4302A]" />
                    <div>
                      <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Online Payment
                      </p>
                      <p className="text-xs text-[#717182]">Credit/Debit card (coming soon)</p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#717182] mb-5">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure payment — your data is protected</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(2)} disabled={isLoading}
                    className="flex-1 border border-[#E5E5E5] text-[#1E1E1E] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F8F7] transition-colors disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    ← Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    disabled={isLoading || paymentMethod === "online"}
                    className="flex-grow bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    {paymentMethod === "online"
                      ? "Online Payment — coming soon"
                      : <>Continue to Confirmation <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1E1E1E] mb-1" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                  Order Confirmation
                </h2>
                <p className="text-sm text-[#717182] mb-5">
                  Review your information before placing the order.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">Delivery to</p>
                    <p className="text-sm text-[#1E1E1E]">{address.fullName}</p>
                    <p className="text-sm text-[#717182]">{address.address}</p>
                    <p className="text-sm text-[#717182]">{address.city} {address.postalCode}</p>
                    <p className="text-sm text-[#717182]">{address.phone}</p>
                  </div>

                  <div className="border-t border-[#E5E5E5] pt-3">
                    <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">Delivery Method</p>
                    <p className="text-sm text-[#1E1E1E]">{selectedProvider?.name || "Not selected"}</p>
                  </div>

                  <div className="border-t border-[#E5E5E5] pt-3">
                    <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">Payment Method</p>
                    <p className="text-sm text-[#1E1E1E]">
                      {paymentMethod === "cod" ? "Payment Upon Delivery" : "Online Payment"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#717182]">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Secure checkout — your data is protected</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(3)} disabled={isLoading}
                    className="flex-1 border border-[#E5E5E5] text-[#1E1E1E] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F8F7] transition-colors disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    ← Back
                  </button>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isLoading}
                    className="flex-grow bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      : <>Confirm Order <Check className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right: Order Summary ─── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sticky top-20">
              <h2 className="font-semibold text-[#1E1E1E] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                {cart.items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F9F8F7] rounded-lg overflow-hidden border border-[#E5E5E5] flex-shrink-0">
                      <img src={(product as any).image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#1E1E1E] font-medium truncate">{product.title}</p>
                      <p className="text-xs text-[#717182]">× {quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#1E1E1E] whitespace-nowrap">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E5E5E5] pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#717182]">Subtotal</span>
                  <span className="font-medium text-[#1E1E1E]">{formatPrice(subtotal)}</span>
                </div>
                {cart.promoCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#717182]">
                      Discount ({cart.promoCode.code})
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatPrice(subtotal - discountedTotal)}
                    </span>
                  </div>
                )}
                {selectedProvider && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#717182]">{selectedProvider.name}</span>
                    <span className="font-medium text-[#1E1E1E]">{selectedProvider.price > 0 ? formatPrice(selectedProvider.price) : "Free"}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E5E5E5] mt-3 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>Total</span>
                  <span className="font-bold text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.1rem" }}>
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}