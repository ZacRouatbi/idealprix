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
        className="min-h-screen bg-[#F0F3FA] flex items-center justify-center px-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-[#E5E5E5] rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-9 h-9 text-[#717182]" />
          </div>
          <h2
            className="text-[#1E1E1E] mb-2"
            style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.25rem", fontWeight: 600 }}
          >
            Votre panier est vide
          </h2>
          <p className="text-[#717182] text-sm mb-6">
            Ajoutez des produits à votre panier pour continuer vos achats.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-[#D4302A] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Découvrir nos produits
            <ArrowRight className="w-4 h-4" />
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
      <div className="max-w-5xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-5">
          <Link to="/" className="hover:text-[#D4302A] transition-colors">
            Accueil
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">Votre panier</span>
        </nav>

        <h1
          className="text-[#1E1E1E] mb-6"
          style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}
        >
          Votre panier
          <span className="ml-2 text-base font-normal text-[#717182]">
            ({cart.items.length} article{cart.items.length > 1 ? "s" : ""})
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-3">
            {cart.items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-[#E5E5E5] p-4 flex items-start gap-4"
              >
                <Link to={`/products/${product.handle}`} className="flex-shrink-0">
                  <div className="w-20 h-20 bg-[#F9F8F7] rounded-lg overflow-hidden border border-[#E5E5E5]">
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
                    <p className="text-xs text-[#717182] mb-0.5">{product.brand}</p>
                    <h3 className="text-sm font-medium text-[#1E1E1E] leading-snug line-clamp-2">
                      {product.title}
                    </h3>
                  </Link>
                  {product.weight && (
                    <p className="text-xs text-[#717182] mt-0.5">{product.weight}</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden">
                      <button
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-[#1E1E1E]">
                        {quantity}
                      </span>
                      <button
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className="font-semibold text-[#1E1E1E] text-sm"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {formatPrice(product.price * quantity)}
                      </span>

                      <button
                        className="text-[#717182] hover:text-[#D4302A] transition-colors p-1"
                        onClick={() => removeItem(product.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm text-[#717182] hover:text-[#D4302A] transition-colors mt-2"
            >
              ← Continuer les achats
            </Link>
          </div>

          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 sticky top-20">
              <h2
                className="font-semibold text-[#1E1E1E] mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Résumé de la commande
              </h2>

              <div className="space-y-3 mb-4">
                {cart.items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-[#717182] truncate pr-2">
                      {product.title.length > 22
                        ? product.title.slice(0, 22) + "…"
                        : product.title}{" "}
                      × {quantity}
                    </span>
                    <span className="font-medium text-[#1E1E1E] whitespace-nowrap">
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
                {cart.promoCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#717182]">
                      Remise ({cart.promoCode.code})
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatPrice(subtotal - total)}
                    </span>
                  </div>
                )}
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

              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#717182]" />
                  <input
                    type="text"
                    placeholder="Code promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={isApplying}
                    className="w-full pl-8 pr-3 py-2.5 border border-[#E5E5E5] rounded-lg text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] bg-[#F9F8F7]"
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
                  className="px-3 py-2.5 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#1E1E1E] hover:bg-[#F9F8F7] transition-colors disabled:opacity-50"
                >
                  Appliquer
                </button>
              </div>
              {promoMessage && (
                <p className={`text-xs mt-2 ${promoMessage.includes("Invalid") || promoMessage.includes("Failed") || promoMessage.includes("already") || promoMessage.includes("Minimum") ? "text-red-500" : "text-green-600"}`}>
                  {promoMessage}
                </p>
              )}
              {cart.promoCode && (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-green-600">Applied: {cart.promoCode.code}</p>
                  <button
                    onClick={() => {
                      removePromo();
                      setPromoCode("");
                      setPromoMessage("");
                    }}
                    className="text-xs text-[#717182] hover:text-[#D4302A]"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate("/checkout")}
                className="w-full mt-4 bg-[#D4302A] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#b82a22] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Passer la commande
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-[#717182] mt-3 flex items-center justify-center gap-1">
                🔒 Paiement sécurisé
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}