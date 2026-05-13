import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Heart, ShoppingCart, Star, Minus, Plus, Check,
  Truck, RotateCcw, Shield, Loader2, AlertCircle,
} from "lucide-react";
import { formatPrice } from "../../../lib/data/products";
import { useProduct, useProducts } from "../../../lib/hooks/use-products";
import { useCart } from "../../../lib/context/CartContext";
import ProductCard from "../../../modules/store/components/ProductCard";

export default function ProductPage() {
  const { handle } = useParams<{ handle: string }>();
  const { addItem } = useCart();

  const { product, loading, error } = useProduct(handle);
  const { products: allProducts } = useProducts({ limit: 100 });

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("description");
  const [wishlisted, setWishlisted] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F3FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4302A] animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F0F3FA] flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Vérifiez que le backend Medusa est démarré.</span>
            </div>
          )}
          <p className="text-[#717182] text-xl mb-4">Produit non trouvé</p>
          <Link
            to="/products"
            className="bg-[#D4302A] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#b82a22] transition-colors"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Voir tous les produits
          </Link>
        </div>
      </div>
    );
  }

  const images = (product.images?.filter(Boolean) ?? []).length > 0
    ? product.images!.filter(Boolean)
    : [product.image];

  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Resolve the active variant
  const activeVariantId = selectedVariantId || product.variant_id || "";
  const activeVariant = product.variants?.find((v) => v.id === activeVariantId);
  const activePrice = activeVariant?.price ?? product.price;

  const handleAddToCart = () => {
    // Pass the product with the currently selected variant_id so checkout can use it
    const productWithVariant = { ...product, variant_id: activeVariantId, price: activePrice };
    for (let i = 0; i < quantity; i++) {
      addItem(productWithVariant);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const AccordionSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-[#E5E5E5]">
      <button
        className="w-full flex items-center justify-between py-4 text-left"
        onClick={() => setOpenSection(openSection === id ? null : id)}
      >
        <span className="font-semibold text-[#1E1E1E] text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
          {title}
        </span>
        {openSection === id ? (
          <ChevronUp className="w-4 h-4 text-[#717182]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#717182]" />
        )}
      </button>
      {openSection === id && (
        <div className="pb-4 text-sm text-[#717182] leading-relaxed">{children}</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F3FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-6 flex-wrap">
          <Link to="/" className="hover:text-[#D4302A] transition-colors">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/products" className="hover:text-[#D4302A] transition-colors">Produits</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">{product.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:max-w-5xl mx-auto">
          {/* Images */}
          <div className="flex-1 max-w-xl">
            <div className="relative bg-white rounded-2xl overflow-hidden border border-[#E5E5E5] mb-3">
              {product.isPromo && (
                <span className="absolute top-3 left-3 bg-[#D4302A] text-white text-xs font-bold px-2.5 py-1 rounded z-10">
                  Promo
                </span>
              )}
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-80 lg:h-96 object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      selectedImage === i ? "border-[#D4302A]" : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                    }`}
                  >
                    <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 max-w-xl">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5]">
              <div className="flex items-center gap-2 mb-2">
                {product.brand && (
                  <span className="text-xs font-semibold text-[#D4302A] uppercase tracking-wider">
                    {product.brand}
                  </span>
                )}
                {product.category && (
                  <span className="text-xs text-[#717182] bg-[#F0F3FA] px-2 py-0.5 rounded">
                    {product.category}
                  </span>
                )}
              </div>

              <h1 className="text-[#1E1E1E] mb-3 leading-snug"
                style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>
                {product.title}
              </h1>

              {product.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${
                        i < Math.floor(product.rating!) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
                      }`} />
                    ))}
                  </div>
                  <span className="text-xs text-[#717182]">
                    {product.rating} ({product.reviewCount} avis)
                  </span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-[#1E1E1E]"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.75rem", fontWeight: 700 }}>
                  {formatPrice(activePrice)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-[#717182] line-through text-base">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="bg-[#D4302A] text-white text-xs font-bold px-2 py-0.5 rounded">
                      -{product.discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mb-5">
                {product.inStock ? (
                  <><span className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-sm text-green-600 font-medium">En stock</span></>
                ) : (
                  <><span className="w-2 h-2 bg-red-500 rounded-full" /><span className="text-sm text-red-500 font-medium">Rupture de stock</span></>
                )}
              </div>

              {/* Variant selector */}
              {product.variants && product.variants.length > 1 && (
                <div className="mb-5">
                  <p className="text-sm text-[#717182] mb-2 font-medium">Variante</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          activeVariantId === v.id
                            ? "border-[#D4302A] bg-red-50 text-[#D4302A]"
                            : "border-[#E5E5E5] text-[#1E1E1E] hover:border-[#1E1E1E]"
                        }`}
                      >
                        {v.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-5">
                <p className="text-sm text-[#717182] mb-2 font-medium">Quantité</p>
                <div className="flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden w-fit">
                  <button
                    className="w-9 h-9 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    className="w-9 h-9 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    added ? "bg-green-500 text-white"
                    : product.inStock ? "bg-[#D4302A] text-white hover:bg-[#b82a22]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {added ? <><Check className="w-4 h-4" /> Ajouté au panier</>
                    : <><ShoppingCart className="w-4 h-4" /> Ajouter au panier</>}
                </button>
                <button
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition-colors ${
                    wishlisted ? "border-[#D4302A] text-[#D4302A] bg-red-50"
                    : "border-[#E5E5E5] text-[#717182] hover:border-[#D4302A] hover:text-[#D4302A]"
                  }`}
                  onClick={() => setWishlisted(!wishlisted)}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? "fill-[#D4302A]" : ""}`} />
                  Ajouter à la liste de souhaits
                </button>
              </div>

              <div className="mt-5 pt-5 border-t border-[#E5E5E5] flex flex-col gap-2">
                {[
                  { icon: Truck, text: "Livraison en 3–5 jours ouvrables" },
                  { icon: RotateCcw, text: "Retour gratuit sous 14 jours" },
                  { icon: Shield, text: "Paiement 100% sécurisé" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-[#717182]">
                    <Icon className="w-4 h-4 text-[#D4302A]" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Accordions */}
        <div className="mt-8 bg-white rounded-2xl border border-[#E5E5E5] p-6 max-w-2xl mx-auto">
          <AccordionSection id="description" title="Description">
            <p>{product.description || "Découvrez ce produit de qualité supérieure."}</p>
            {product.weight && <p className="mt-2"><strong>Volume / Poids :</strong> {product.weight}</p>}
          </AccordionSection>
          <AccordionSection id="livraison" title="Livraison & Retours">
            <ul className="space-y-1 list-disc list-inside">
              <li>Livraison standard : 7,000 TND — 3 à 5 jours ouvrables</li>
              <li>Livraison express : 12,000 TND — 24h à 48h</li>
              <li>Retours acceptés sous 14 jours, dans l'emballage d'origine</li>
            </ul>
          </AccordionSection>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 max-w-5xl mx-auto">
            <h2 className="text-[#1E1E1E] mb-5" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.25rem", fontWeight: 600 }}>
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}