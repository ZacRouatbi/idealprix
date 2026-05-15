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

type Step = 1 | 2 | 3;
type PaymentMethod = "cod" | "card";

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

const BACKEND_URL =
  (import.meta as any).env?.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUB_KEY =
  (import.meta as any).env?.VITE_MEDUSA_PUBLISHABLE_KEY || "";

const defaultHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  ...(PUB_KEY ? { "x-publishable-api-key": PUB_KEY } : {}),
};

async function medusaFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { ...defaultHeaders, ...((options.headers as Record<string, string>) || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function ensureMedusaCart(
   localItems: { variantId: string; quantity: number }[]
 ): Promise<string> {
  let stored = sessionStorage.getItem("medusa_cart_id");

  // Validate stored cart or create new one
  if (!stored) {
    const { regions } = await medusaFetch<{ regions: { id: string }[] }>("/store/regions");
    if (!regions?.length) throw new Error("Aucune région disponible.");

    const { cart } = await medusaFetch<{ cart: { id: string } }>("/store/carts", {
      method: "POST",
      body: JSON.stringify({ region_id: regions[0].id }),
    });
    stored = cart.id;
    sessionStorage.setItem("medusa_cart_id", stored);
  }

  // Verify cart still exists
  try {
    await medusaFetch(`/store/carts/${stored}`);
  } catch {
    sessionStorage.removeItem("medusa_cart_id");
    return ensureMedusaCart(localItems);
  }

  // Fetch cart with line items (including line item IDs)
  const { cart } = await medusaFetch<{
    cart: {
      items: { id: string; variant_id: string; quantity: number }[];
    };
  }>(`/store/carts/${stored}`);

  console.log("Cart items from Medusa:", cart.items.map(i => ({ variant_id: i.variant_id })));
  const medusaItems = new Map(
    cart.items.map((item) => [`${item.variant_id}`, { id: item.id, quantity: item.quantity }])
  );

// Add or update items
   for (const item of localItems) {
     const existing = medusaItems.get(item.variantId);
     if (existing && existing.quantity !== item.quantity) {
       await medusaFetch(`/store/carts/${stored}/line-items/${existing.id}`, {
         method: "POST",
         body: JSON.stringify({ quantity: item.quantity }),
       }).catch((e) => { console.warn(`Failed to update line item for variant ${item.variantId}:`, e); });
     } else if (!existing) {
       await medusaFetch(`/store/carts/${stored}/line-items`, {
         method: "POST",
         body: JSON.stringify({ variant_id: item.variantId, quantity: item.quantity }),
       }).catch((e) => { console.warn(`Failed to add line item for variant ${item.variantId}:`, e); });
     }
   }

  // Remove items that are no longer in local cart
  for (const [variantId, item] of medusaItems) {
    if (!localItems.find((i) => i.variantId === variantId)) {
      await medusaFetch(`/store/carts/${stored}/line-items/${item.id}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }

  return stored;
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const { customer, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

const [currentStep, setCurrentStep] = useState<Step>(1);
   const [address, setAddress] = useState<AddressForm>({
     fullName: "", phone: "", email: "", address: "", city: "", postalCode: "", notes: "",
   });
  const [shippingOptions, setShippingOptions] = useState<
    { id: string; name: string; amount: number; shipping_profile_id?: string }[]
  >([]);
  const [shippingOptionId, setShippingOptionId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [cardInfo, setCardInfo] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedShipping = shippingOptions.find((o) => o.id === shippingOptionId);
  const shippingCost = selectedShipping?.amount ?? 0;
  const total = subtotal + shippingCost;

  const steps = [
    { n: 1, label: "Adresse" },
    { n: 2, label: "Livraison" },
    { n: 3, label: "Paiement" },
  ];

// Sync local cart with Medusa cart on checkout page load
    // Clear any stale cart to ensure fresh data
    useEffect(() => {
      sessionStorage.removeItem("medusa_cart_id");
      sessionStorage.removeItem("medusa_shipping_option_id");
      
      const syncCart = async () => {
            try {
              const localItems: { variantId: string; quantity: number }[] = [];
              for (const item of cart.items) {
                if (item.product.variant_id) {
                  localItems.push({ variantId: item.product.variant_id, quantity: item.quantity });
                }
              }
              if (localItems.length > 0) {
                await ensureMedusaCart(localItems);
              }
            } catch (err) {
              console.error("Failed to sync cart:", err);
            }
         };
     syncCart();
   }, []);

// Auto-fill address from logged-in customer's profile
   useEffect(() => {
     if (!authLoading && customer && address.fullName === "" && address.phone === "") {
       // Get default shipping address from customer's addresses
       const defaultAddress = customer.addresses?.find((a: any) => a.is_default_shipping) || customer.addresses?.[0];
       
       const firstName = customer.first_name || "";
       const lastName = customer.last_name || "";
       
       setAddress(prev => ({
         ...prev,
         fullName: prev.fullName || `${firstName} ${lastName}`.trim(),
         phone: prev.phone || customer.phone || "",
         email: prev.email || customer.email || "",
         address: prev.address || defaultAddress?.address_1 || "",
         city: prev.city || defaultAddress?.city || "",
         postalCode: prev.postalCode || defaultAddress?.postal_code || "",
       }));
     }
   }, [authLoading, customer, address]);

const handleAddressSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError(null);
     setIsLoading(true);
try {
        const localItems: { variantId: string; quantity: number }[] = [];
        for (const item of cart.items) {
          if (item.product.variant_id) {
            localItems.push({ variantId: item.product.variant_id, quantity: item.quantity });
          }
        }
        const cartId = await ensureMedusaCart(localItems);

const nameParts = address.fullName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || firstName;

        await medusaFetch(`/store/carts/${cartId}`, {
          method: "POST",
          body: JSON.stringify({
            email: address.email,
            shipping_address: {
             first_name: firstName,
             last_name: lastName,
             address_1: address.address,
             city: address.city,
             postal_code: address.postalCode || "0000",
             country_code: "tn",
             phone: address.phone,
           },
           billing_address: {
             first_name: firstName,
             last_name: lastName,
             address_1: address.address,
             city: address.city,
             postal_code: address.postalCode || "0000",
             country_code: "tn",
             phone: address.phone,
           },
         }),
       });

      const { shipping_options } = await medusaFetch<{
        shipping_options: { id: string; name: string; amount: number; shipping_profile_id?: string }[];
      }>(`/store/shipping-options?cart_id=${cartId}`);

      if (shipping_options?.length) {
        console.log("Available shipping options:", shipping_options.map(o => ({ id: o.id, name: o.name, profile_id: o.shipping_profile_id })));
        setShippingOptions(shipping_options);
        setShippingOptionId(shipping_options[0].id);
      } else {
        const cartDetails = await medusaFetch<{ cart: any }>(`/store/carts/${cartId}`);
        console.error("No shipping options available. Cart details:", cartDetails);
        throw new Error("Aucune option de livraison disponible. Vérifiez que les produits du panier ont un profil de livraison assigné dans l'administration Medusa.");
      }

      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde de l'adresse.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeliveryNext = async () => {
    if (!shippingOptionId) return;
    setError(null);
    setIsLoading(true);
    try {
      const cartId = sessionStorage.getItem("medusa_cart_id");
      if (!cartId) throw new Error("Panier introuvable.");

      if (shippingOptionId.startsWith("fallback_")) {
        setError("Veuillez sélectionner une option de livraison valide.");
        return;
      }

      const response = await medusaFetch<{ success: boolean }>(
        `/store/carts/${cartId}/shipping-methods`,
        {
          method: "POST",
          body: JSON.stringify({ option_id: shippingOptionId }),
        }
      ).catch((e) => { throw new Error(`Failed to add shipping method: ${e.message}`); });

      sessionStorage.setItem("medusa_shipping_option_id", shippingOptionId);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sélection de la livraison.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const cartId = sessionStorage.getItem("medusa_cart_id");
      if (!cartId) throw new Error("Panier introuvable.");

      const { cart: currentCart } = await medusaFetch<{
        cart: { shipping_methods: { id: string }[]; items: { variant_id?: string }[] }
      }>(`/store/carts/${cartId}`);

      const storedShippingOptionId = sessionStorage.getItem("medusa_shipping_option_id");
      if (!currentCart.shipping_methods?.length && storedShippingOptionId) {
        await medusaFetch(`/store/carts/${cartId}/shipping-methods`, {
          method: "POST",
          body: JSON.stringify({ option_id: storedShippingOptionId }),
        });
      }

      let collectionId: string;
      try {
        const { payment_collection } = await medusaFetch<{
          payment_collection: { id: string };
        }>("/store/payment-collections", {
          method: "POST",
          body: JSON.stringify({ cart_id: cartId }),
        });
        collectionId = payment_collection.id;
      } catch {
        // May already exist — fetch from cart
        const { cart: c } = await medusaFetch<{
          cart: { payment_collection?: { id: string } };
        }>(`/store/carts/${cartId}`);
        if (!c.payment_collection?.id) throw new Error("Impossible de créer la collection de paiement.");
        collectionId = c.payment_collection.id;
      }

      // Initiate payment session (pp_system_default = COD in Medusa)
      await medusaFetch(
        `/store/payment-collections/${collectionId}/payment-sessions`,
        {
          method: "POST",
          body: JSON.stringify({ provider_id: "pp_system_default" }),
        }
      ).catch(() => {});

// Complete the cart
      const cartBeforeComplete = await medusaFetch<{ cart: { items?: { variant_id?: string }[] } }>(`/store/carts/${cartId}`);
      console.log("Cart items before completion:", cartBeforeComplete.cart.items?.map((i: { variant_id?: string }) => i.variant_id));

const result = await medusaFetch<{
        type: string;
        order?: { id: string };
      }>(`/store/carts/${cartId}/complete`, { method: "POST" }).catch(async (e) => {
          const cartDetails = await medusaFetch<{ cart: any }>(`/store/carts/${cartId}?fields=id,*items,*items.product,*shipping_methods`);
          const productProfiles = cartDetails.cart.items?.map((i: any) => i.product?.shipping_profile_id || i.product?.shipping_profile?.id) || [];
          const shippingMethodProfiles = cartDetails.cart.shipping_methods?.map((sm: any) => sm.shipping_option?.shipping_profile_id || sm.shipping_option?.shipping_profile?.id) || [];

          console.error("Cart completion failed:", e, {
            cartId,
            itemVariantIds: cartDetails.cart.items?.map((i: any) => i.variant_id),
            productProfiles,
            shippingMethodProfiles,
            hasShippingMethod: !!(cartDetails.cart.shipping_methods?.length),
            profilesMatch: productProfiles.some((p: string) => shippingMethodProfiles.includes(p)),
            productData: cartDetails.cart.items?.map((i: any) => ({ variant_id: i.variant_id, product: i.product }))
          });

          if (e.message?.includes("shipping profiles")) {
            if (productProfiles.every((p: string) => !p)) {
              throw new Error("ERREUR: Les produits du panier n'ont pas de profil de livraison. Dans Medusa Admin: Produits → Ouvrir chaque produit → Onglet 'Shipping' → Sélectionner 'Default Shipping Profile'");
            }
            throw new Error(`ERREUR: Profil produit [${productProfiles.join(', ')}] ne correspond pas aux options [${shippingMethodProfiles.join(', ')}]. Vérifiez que les profils correspondent.`);
          }
          throw new Error(`Erreur lors de la finalisation: ${e.message}`);
        });

      if (result.type === "order" && result.order) {
        sessionStorage.removeItem("medusa_cart_id");
        setPlacedOrderId(result.order.id);
        setOrderPlaced(true);
        clearCart();
      } else {
        throw new Error("La commande n'a pas pu être finalisée. Vérifiez que le backend est bien démarré.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la confirmation de la commande.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Empty cart guard ──
  if (cart.items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-[#F0F3FA] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#717182] mb-4">Votre panier est vide.</p>
          <Link
            to="/products"
            className="bg-[#D4302A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b82a22] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Découvrir nos produits
          </Link>
        </div>
      </div>
    );
  }

  // ── Order confirmed screen ──
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
            Commande confirmée !
          </h2>
          {placedOrderId && (
            <p className="text-xs text-[#717182] mb-1">
              N° commande : <span className="font-mono">{placedOrderId}</span>
            </p>
          )}
          <p className="text-[#717182] text-sm mb-4">
            {paymentMethod === "cod"
              ? "Vous paierez en espèces à la livraison."
              : "Votre paiement par carte a été enregistré."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#D4302A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b82a22] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Retour à l'accueil
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
          <Link to="/" className="hover:text-[#D4302A]">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/cart" className="hover:text-[#D4302A]">Panier</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">Finaliser la commande</span>
        </nav>

        {/* Title */}
        <h1
          className="text-[#1E1E1E] mb-6"
          style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}
        >
          Finaliser la commande
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

            {/* Step 1: Adresse */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1E1E1E] mb-5" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                  Informations de livraison
                </h2>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Nom complet</label>
                    <input type="text" required value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="Prénom Nom"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Téléphone</label>
                    <input type="tel" required value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+216 XX XXX XXX"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Email</label>
                    <input type="email" required value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      placeholder="email@exemple.com"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Adresse</label>
                    <input type="text" required value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      placeholder="Numéro, rue, quartier"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Ville</label>
                      <div className="relative">
                        <select required value={address.city}
                          onChange={(e) => setAddress({ ...address, city: e.target.value })}
                          className="w-full appearance-none border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7] cursor-pointer">
                          <option value="">Sélectionner</option>
                          {TUNISIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182] pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Code postal</label>
                      <input type="text" value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="Code postal"
                        className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#717182] mb-1.5">Notes (optionnel)</label>
                    <textarea value={address.notes}
                      onChange={(e) => setAddress({ ...address, notes: e.target.value })}
                      placeholder="Informations supplémentaires..." rows={3}
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7] resize-none" />
                  </div>
                  <button type="submit" disabled={isLoading}
                    className="w-full bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
                      : <>Continuer vers la livraison <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Livraison */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1E1E1E] mb-1" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                  Méthode de livraison
                </h2>
                <p className="text-sm text-[#717182] mb-5">Choisissez votre mode de livraison</p>

                <div className="space-y-3 mb-6">
                  {shippingOptions.map((option) => {
                    const Icon = option.name.toLowerCase().includes("express") ? Zap : Truck;
                    return (
                      <label key={option.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          shippingOptionId === option.id
                            ? "border-[#D4302A] bg-red-50"
                            : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                        }`}>
                        <input type="radio" name="delivery" value={option.id}
                          checked={shippingOptionId === option.id}
                          onChange={() => setShippingOptionId(option.id)}
                          className="accent-[#D4302A]" />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          shippingOptionId === option.id ? "bg-[#D4302A] text-white" : "bg-[#F9F8F7] text-[#717182]"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {option.name}
                          </p>
                        </div>
                        <span className="font-bold text-[#1E1E1E] text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
                          {formatPrice(option.amount)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(1)} disabled={isLoading}
                    className="flex-1 border border-[#E5E5E5] text-[#1E1E1E] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F8F7] transition-colors disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    ← Retour
                  </button>
                  <button onClick={handleDeliveryNext} disabled={isLoading || !shippingOptionId}
                    className="flex-grow bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
                      : <>Continuer vers le paiement <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Paiement */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1E1E1E] mb-1" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}>
                  Paiement
                </h2>
                <p className="text-sm text-[#717182] mb-5">
                  Toutes les transactions sont sécurisées et chiffrées.
                </p>

                {/* Payment method options */}
                <div className="space-y-3 mb-6">
                  {/* COD — primary */}
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
                        Paiement à la livraison
                      </p>
                      <p className="text-xs text-[#717182]">Payez en espèces à la réception</p>
                    </div>
                  </label>

                  {/* Card / ClickToPay — future */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-[#D4302A] bg-red-50" : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                  }`}>
                    <input type="radio" name="payment" value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="accent-[#D4302A]" />
                    <CreditCard className="w-5 h-5 text-[#D4302A]" />
                    <div>
                      <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Carte bancaire (ClickToPay)
                      </p>
                      <p className="text-xs text-[#717182]">Visa, Mastercard, CIB</p>
                    </div>
                  </label>
                </div>

                {/* Card fields — only shown when card is selected */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 mb-6 p-4 bg-[#F9F8F7] rounded-xl border border-[#E5E5E5]">
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      ⚠️ L'intégration ClickToPay sera disponible prochainement. Veuillez utiliser le paiement à la livraison pour l'instant.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Titulaire de la carte</label>
                      <input type="text" placeholder="Prénom Nom"
                        value={cardInfo.name}
                        onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value })}
                        className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Numéro de carte</label>
                      <input type="text" placeholder="1234 5678 9012 3456"
                        value={cardInfo.number} maxLength={19}
                        onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })}
                        className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">Date d'expiration</label>
                        <input type="text" placeholder="MM/AA"
                          value={cardInfo.expiry} maxLength={5}
                          onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })}
                          className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">CVV</label>
                        <input type="text" placeholder="123"
                          value={cardInfo.cvv} maxLength={4}
                          onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                          className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-white" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-[#717182] mb-5">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Paiement sécurisé — vos données sont protégées</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(2)} disabled={isLoading}
                    className="flex-1 border border-[#E5E5E5] text-[#1E1E1E] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F8F7] transition-colors disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    ← Retour
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isLoading || paymentMethod === "card"}
                    className="flex-grow bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ fontFamily: "Poppins, sans-serif" }}>
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                      : paymentMethod === "card"
                      ? "ClickToPay — bientôt disponible"
                      : <>Confirmer la commande <Check className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Right: Order Summary ─── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sticky top-20">
              <h2 className="font-semibold text-[#1E1E1E] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                Résumé de la commande
              </h2>

              <div className="space-y-3 mb-4">
                {cart.items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F9F8F7] rounded-lg overflow-hidden border border-[#E5E5E5] flex-shrink-0">
                      <img src={(product as any).image} alt={product.title} className="w-full h-full object-cover" />
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
                  <span className="text-[#717182]">Sous-total</span>
                  <span className="font-medium text-[#1E1E1E]">{formatPrice(subtotal)}</span>
                </div>
                {selectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#717182]">{selectedShipping.name}</span>
                    <span className="font-medium text-[#1E1E1E]">{formatPrice(selectedShipping.amount)}</span>
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

              {currentStep >= 2 && address.fullName && (
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                  <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">Livraison à</p>
                  <p className="text-xs text-[#1E1E1E]">{address.fullName}</p>
                  <p className="text-xs text-[#717182]">{address.address}</p>
                  <p className="text-xs text-[#717182]">{address.city} {address.postalCode}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}