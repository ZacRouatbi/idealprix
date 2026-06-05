import { Link, useNavigate } from "react-router";
import {
  ChevronRight,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Tag,
} from "lucide-react";
import { useCart } from "../../../lib/context/CartContext";
import { useAuth } from "../../../lib/context/AuthContext";
import { formatPrice } from "../../../lib/data/products";
import { apiClient } from "../../../lib/data/backend-api";
import React, { useState } from "react";

export default function CartPage() {
  const { cart, removeItem, updateQuantity, subtotal, total, applyPromo, removePromo } = useCart();
  const { customer } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  if (cart.items.length === 0) {
    return (
      <div
        className="min-h-screen bg-[#F0F3FA] flex items-center justify-center px-3 sm:px-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="text-center max-w-xs sm:max-w-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E5E5E5] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <ShoppingBag className="w-7 h-7 sm:w-9 sm:h-9 text-[#717182]" />
          </div>
          <h2
            className="text-[#1E1E1E] mb-2 text-lg sm:text-xl"
            style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600 }}
          >
            Votre panier est vide
          </h2>
          <p className="text-[#717182] text-xs sm:text-sm mb-4 sm:mb-6 px-2">
            Ajoutez des produits à votre panier pour continuer vos achats.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#D4302A] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm hover:bg-[#b82a22] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Découvrir nos produits
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F0F3FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-[#717182] mb-3 sm:mb-5">
          <Link to="/" className="hover:text-[#D4302A] transition-colors">
            Accueil
          </Link>
          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[#1E1E1E] font-medium">Votre panier</span>
        </nav>

        <h1
          className="text-[#1E1E1E] mb-4 sm:mb-6 text-lg sm:text-2xl"
          style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700 }}
        >
          Votre panier
          <span className="ml-1.5 sm:ml-2 text-xs sm:text-base font-normal text-[#717182]">
            ({cart.items.length} article{cart.items.length > 1 ? "s" : ""})
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
            {cart.items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-[#E5E5E5] p-2.5 sm:p-3 lg:p-4 flex items-start gap-2.5 sm:gap-3 lg:gap-4"
              >
                <Link to={`/products/${product.handle}`} className="flex-shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-[#F9F8F7] rounded-lg overflow-hidden border border-[#E5E5E5]">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product.handle}`}>
                    <p className="text-[10px] sm:text-xs text-[#717182] mb-0.5">{product.brand}</p>
                    <h3 className="text-xs sm:text-sm font-medium text-[#1E1E1E] leading-tight line-clamp-2">
                      {product.title}
                    </h3>
                  </Link>
                  {product.weight && (
                    <p className="text-[10px] sm:text-xs text-[#717182] mt-0.5">{product.weight}</p>
                  )}

                  <div className="flex items-center justify-between mt-2 sm:mt-3">
                    <div className="flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden">
                      <button
                        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                      <span className="w-6 sm:w-7 lg:w-8 text-center text-xs sm:text-sm font-semibold text-[#1E1E1E]">
                        {quantity}
                      </span>
                      <button
                        className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                      <span
                        className="font-semibold text-[#1E1E1E] text-xs sm:text-sm"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {formatPrice(product.price * quantity)}
                      </span>

                      <button
                        className="text-[#717182] hover:text-[#D4302A] transition-colors p-0.5 sm:p-1"
                        onClick={() => removeItem(product.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#717182] hover:text-[#D4302A] transition-colors mt-1.5 sm:mt-2"
            >
              ← Continuer les achats
            </Link>
          </div>

          <div className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-3.5 sm:p-4 lg:p-5 sticky top-4 lg:top-20">
              <h2
                className="font-semibold text-[#1E1E1E] mb-3 sm:mb-4 text-sm sm:text-base"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Résumé de la commande
              </h2>

              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                {cart.items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#717182] truncate pr-1.5 sm:pr-2 max-w-[70%]">
                      {product.title.length > 15
                        ? product.title.slice(0, 15) + "…"
                        : product.title}{" "}
                      × {quantity}
                    </span>
                    <span className="font-medium text-[#1E1E1E] whitespace-nowrap">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E5E5E5] pt-2 sm:pt-3 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#717182]">Sous-total</span>
                  <span className="font-medium text-[#1E1E1E]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {cart.promoCode && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-[#717182]">
                      Remise ({cart.promoCode.code})
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatPrice(subtotal - total)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-[#E5E5E5] mt-2 sm:mt-3 pt-2 sm:pt-3">
                <div className="flex justify-between">
                  <span
                    className="font-semibold text-[#1E1E1E] text-xs sm:text-sm"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    Total
                  </span>
                  <span
                    className="font-bold text-[#1E1E1E] text-sm sm:text-base lg:text-lg"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#717182]" />
                  <input
                    type="text"
                    placeholder="Code promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={isApplying}
                    className="w-full pl-7 sm:pl-8 pr-2.5 sm:pr-3 py-1.5 sm:py-2.5 border border-[#E5E5E5] rounded-lg text-xs sm:text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]"
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!promoCode.trim()) return;
                    if (cart.promoCode?.code === promoCode.trim()) {
                      setPromoMessage("Promo code already applied");
                      return;
                    }
                    setIsApplying(true);
                    setPromoMessage("");

                    try {
                      const validation = await apiClient<{ valid: boolean; promoCode?: { code: string; discountType: "percentage" | "fixed"; discountValue: number; minOrderValue?: number }; error?: string }>(
                        `/public/promo-codes/${encodeURIComponent(promoCode.trim())}${customer?.id ? `?userId=${customer.id}` : ''}`
                      );

                      if (validation.valid && validation.promoCode) {
                        if (validation.promoCode.minOrderValue && subtotal < validation.promoCode.minOrderValue) {
                          setPromoMessage(`Minimum order value required: ${formatPrice(validation.promoCode.minOrderValue)}`);
                          return;
                        }
                        applyPromo(validation.promoCode);
                        setPromoMessage("Promo code applied!");
                      } else {
                        setPromoMessage(validation.error || "Invalid promo code");
                      }
                    } catch (e) {
                      setPromoMessage(e instanceof Error ? e.message : "Failed to validate promo code");
                    } finally {
                      setIsApplying(false);
                    }
                  }}
                  disabled={isApplying || !promoCode.trim()}
                  className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 sm:py-2.5 border border-[#E5E5E5] rounded-lg text-[10px] sm:text-xs font-medium text-[#1E1E1E] hover:bg-[#F9F8F7] transition-colors disabled:opacity-50"
                >
                  Appliquer
                </button>
              </div>
              {promoMessage && (
                <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 ${promoMessage.includes("Invalid") || promoMessage.includes("Failed") || promoMessage.includes("already") || promoMessage.includes("Minimum") ? "text-red-500" : "text-green-600"}`}>
                  {promoMessage}
                </p>
              )}
              {cart.promoCode && (
                <div className="mt-1 sm:mt-1.5 flex items-center justify-between">
                  <p className="text-[10px] sm:text-xs text-green-600 truncate">Applied: {cart.promoCode.code}</p>
                  <button
                    onClick={() => {
                      removePromo();
                      setPromoCode("");
                      setPromoMessage("");
                    }}
                    className="text-[10px] sm:text-xs text-[#717182] hover:text-[#D4302A] ml-1.5 sm:ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate("/checkout")}
                className="w-full mt-3 sm:mt-4 bg-[#D4302A] text-white py-2 sm:py-2.5 lg:py-3.5 rounded-xl font-semibold text-xs sm:text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Passer la commande
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <p className="text-center text-[10px] sm:text-xs text-[#717182] mt-2 sm:mt-3 flex items-center justify-center gap-1">
                🔒 Paiement sécurisé
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}