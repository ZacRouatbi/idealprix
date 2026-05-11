import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ChevronRight,
  Check,
  Truck,
  Zap,
  Shield,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { useCart } from "../../../lib/context/CartContext";
import { formatPrice } from "../../../lib/data/products";

type Step = 1 | 2 | 3;

type AddressForm = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
};

const TUNISIAN_CITIES = [
  "Tunis",
  "Sfax",
  "Sousse",
  "Kairouan",
  "Bizerte",
  "Gabès",
  "Ariana",
  "La Marsa",
  "Ben Arous",
  "Monastir",
  "Nabeul",
  "Hammamet",
];

const DELIVERY_OPTIONS = [
  {
    id: "standard",
    label: "Livraison standard",
    desc: "3 à 5 jours ouvrables",
    price: 7000,
    icon: Truck,
  },
  {
    id: "express",
    label: "Livraison express",
    desc: "24h - 48h",
    price: 12000,
    icon: Zap,
  },
];

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [address, setAddress] = useState<AddressForm>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const selectedDelivery = DELIVERY_OPTIONS.find((o) => o.id === deliveryOption)!;
  const total = subtotal + selectedDelivery.price;

  const steps = [
    { n: 1, label: "Adresse" },
    { n: 2, label: "Livraison" },
    { n: 3, label: "Paiement" },
  ];

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  const handleDeliveryNext = () => {
    setCurrentStep(3);
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
    setTimeout(() => navigate("/"), 3000);
  };

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
          <p className="text-[#717182] text-sm mb-1">
            Merci pour votre commande. Vous recevrez un email de confirmation
            sous peu.
          </p>
          <p className="text-xs text-[#717182]">
            Redirection vers l'accueil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F9F8F7]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-5">
          <Link to="/" className="hover:text-[#D4302A]">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/cart" className="hover:text-[#D4302A]">Panier</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">Finaliser la commande</span>
        </nav>

        {/* Header & Steps */}
        <div className="mb-8">
          <h1
            className="text-[#1E1E1E] mb-6"
            style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}
          >
            Finaliser la commande
          </h1>

          {/* Step Indicator */}
          <div className="flex items-center">
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
                    {currentStep > step.n ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.n
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      currentStep === step.n
                        ? "text-[#D4302A]"
                        : currentStep > step.n
                        ? "text-green-500"
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
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Step Content */}
          <div className="flex-1">
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2
                  className="font-semibold text-[#1E1E1E] mb-5"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}
                >
                  Informations de livraison
                </h2>

                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) =>
                        setAddress({ ...address, fullName: e.target.value })
                      }
                      placeholder="Prénom Nom"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      required
                      value={address.phone}
                      onChange={(e) =>
                        setAddress({ ...address, phone: e.target.value })
                      }
                      placeholder="+216 XX XXX XXX"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                      Adresse
                    </label>
                    <input
                      type="text"
                      required
                      value={address.address}
                      onChange={(e) =>
                        setAddress({ ...address, address: e.target.value })
                      }
                      placeholder="Numéro, rue, quartier"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                        Ville
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={address.city}
                          onChange={(e) =>
                            setAddress({ ...address, city: e.target.value })
                          }
                          className="w-full appearance-none border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7] cursor-pointer"
                        >
                          <option value="">Sélectionner une ville</option>
                          {TUNISIAN_CITIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182] pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) =>
                          setAddress({ ...address, postalCode: e.target.value })
                        }
                        placeholder="Code postal"
                        className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#717182] mb-1.5">
                      Notes (optionnel)
                    </label>
                    <textarea
                      value={address.notes}
                      onChange={(e) =>
                        setAddress({ ...address, notes: e.target.value })
                      }
                      placeholder="Informations supplémentaires..."
                      rows={3}
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Continuer vers la livraison
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Delivery */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2
                  className="font-semibold text-[#1E1E1E] mb-1"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}
                >
                  Méthode de livraison
                </h2>
                <p className="text-sm text-[#717182] mb-5">
                  Choisissez votre mode de livraison
                </p>

                <div className="space-y-3 mb-6">
                  {DELIVERY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          deliveryOption === option.id
                            ? "border-[#D4302A] bg-red-50"
                            : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={deliveryOption === option.id}
                          onChange={() => setDeliveryOption(option.id)}
                          className="accent-[#D4302A]"
                        />
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            deliveryOption === option.id
                              ? "bg-[#D4302A] text-white"
                              : "bg-[#F9F8F7] text-[#717182]"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {option.label}
                          </p>
                          <p className="text-xs text-[#717182]">{option.desc}</p>
                        </div>
                        <span
                          className="font-bold text-[#1E1E1E] text-sm"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          {formatPrice(option.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border border-[#E5E5E5] text-[#1E1E1E] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F8F7] transition-colors"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleDeliveryNext}
                    className="flex-2 flex-grow bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Continuer vers le paiement
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
                <h2
                  className="font-semibold text-[#1E1E1E] mb-1"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "1rem" }}
                >
                  Paiement
                </h2>
                <p className="text-sm text-[#717182] mb-5">
                  Toutes les transactions sont sécurisées et chiffrées.
                </p>

                {/* Payment Method */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-4 p-4 border-2 border-[#D4302A] rounded-xl bg-red-50 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      defaultChecked
                      className="accent-[#D4302A]"
                    />
                    <CreditCard className="w-5 h-5 text-[#D4302A]" />
                    <div>
                      <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Carte bancaire
                      </p>
                      <p className="text-xs text-[#717182]">
                        Visa, Mastercard, CIB
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-[#E5E5E5] rounded-xl cursor-pointer hover:border-[#1E1E1E]">
                    <input
                      type="radio"
                      name="payment"
                      className="accent-[#D4302A]"
                    />
                    <span className="text-lg">💵</span>
                    <div>
                      <p className="font-semibold text-sm text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Paiement à la livraison
                      </p>
                      <p className="text-xs text-[#717182]">
                        Payez en espèces à la réception
                      </p>
                    </div>
                  </label>
                </div>

                {/* Card Details */}
                <div className="space-y-4 mb-6 p-4 bg-[#F9F8F7] rounded-xl border border-[#E5E5E5]">
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                      Numéro de carte
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                        Date d'expiration
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E1E] mb-1.5">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full border border-[#E5E5E5] rounded-lg px-3 py-2.5 text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#717182] mb-5">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Paiement sécurisé — vos données sont protégées</span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border border-[#E5E5E5] text-[#1E1E1E] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F8F7] transition-colors"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="flex-2 flex-grow bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Confirmer la commande
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sticky top-20">
              <h2
                className="font-semibold text-[#1E1E1E] mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Résumé de la commande
              </h2>

              <div className="space-y-3 mb-4">
                {cart.items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F9F8F7] rounded-lg overflow-hidden border border-[#E5E5E5] flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#1E1E1E] font-medium truncate">
                        {product.title}
                      </p>
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
                  <span className="font-medium text-[#1E1E1E]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#717182]">{selectedDelivery.label}</span>
                  <span className="font-medium text-[#1E1E1E]">
                    {formatPrice(selectedDelivery.price)}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E5E5E5] mt-3 pt-3">
                <div className="flex justify-between">
                  <span
                    className="font-semibold text-[#1E1E1E]"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Total
                  </span>
                  <span
                    className="font-bold text-[#1E1E1E]"
                    style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.1rem" }}
                  >
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Address Summary (steps 2+) */}
              {currentStep >= 2 && address.fullName && (
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                  <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">
                    Livraison à
                  </p>
                  <p className="text-xs text-[#1E1E1E]">{address.fullName}</p>
                  <p className="text-xs text-[#717182]">{address.address}</p>
                  <p className="text-xs text-[#717182]">
                    {address.city} {address.postalCode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}