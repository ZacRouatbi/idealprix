import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Check,
  Truck,
  RotateCcw,
  Shield,
} from "lucide-react";
import { products, formatPrice } from "../../../lib/data/products";
import { useCart } from "../../../lib/context/CartContext";
import ProductCard from "../../../modules/store/components/ProductCard";

export default function ProductPage() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const product = products.find((p) => p.handle === handle);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("description");
  const [wishlisted, setWishlisted] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F0F3FA] flex items-center justify-center">
        <div className="text-center">
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

  const images = product.images || [product.image];
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const AccordionSection = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-[#E5E5E5]">
      <button
        className="w-full flex items-center justify-between py-4 text-left"
        onClick={() => setOpenSection(openSection === id ? null : id)}
      >
        <span
          className="font-semibold text-[#1E1E1E] text-sm"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {title}
        </span>
        {openSection === id ? (
          <ChevronUp className="w-4 h-4 text-[#717182]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#717182]" />
        )}
      </button>
      {openSection === id && (
        <div className="pb-4 text-sm text-[#717182] leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#F0F3FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-6 flex-wrap">
          <Link to="/" className="hover:text-[#D4302A] transition-colors">
            Accueil
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/products" className="hover:text-[#D4302A] transition-colors">
            Produits de nettoyage
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {product.subcategory && (
            <>
              <Link
                to={`/products?sub=${product.subcategory}`}
                className="hover:text-[#D4302A] transition-colors"
              >
                {product.subcategory}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-[#1E1E1E] font-medium">{product.title}</span>
        </nav>

        {/* Product Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Images */}
          <div className="flex-1 lg:max-w-lg">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl overflow-hidden border border-[#E5E5E5] mb-3">
              {product.isPromo && (
                <span className="absolute top-3 left-3 bg-[#D4302A] text-white text-xs font-bold px-2.5 py-1 rounded z-10">
                  Promo
                </span>
              )}
              {product.discountPercent && (
                <span className="absolute top-3 right-3 bg-[#1E1E1E] text-white text-xs font-bold px-2.5 py-1 rounded z-10">
                  -{product.discountPercent}%
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
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                      )
                    }
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
                    onClick={() =>
                      setSelectedImage((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      selectedImage === i
                        ? "border-[#D4302A]"
                        : "border-[#E5E5E5] hover:border-[#1E1E1E]"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 max-w-lg">
            <div className="bg-white rounded-2xl p-6 border border-[#E5E5E5]">
              {/* Brand & Category */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#D4302A] uppercase tracking-wider">
                  {product.brand}
                </span>
                {product.isPromo && (
                  <span className="bg-red-50 text-[#D4302A] text-xs font-bold px-2 py-0.5 rounded border border-red-100">
                    PROMO
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="text-[#1E1E1E] mb-3 leading-snug"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                {product.title}
              </h1>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating!)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#717182]">
                    {product.rating} ({product.reviewCount} avis)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span
                  className="text-[#1E1E1E]"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "1.75rem",
                    fontWeight: 700,
                  }}
                >
                  {formatPrice(product.price)}
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

              {/* Stock */}
              <div className="flex items-center gap-2 mb-5">
                {product.inStock ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-600 font-medium">
                      En stock
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm text-red-500 font-medium">
                      Rupture de stock
                    </span>
                  </>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-5">
                <p className="text-sm text-[#717182] mb-2 font-medium">Quantité</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden">
                    <button
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors text-[#1E1E1E]"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-[#1E1E1E]">
                      {quantity}
                    </span>
                    <button
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#F9F8F7] transition-colors text-[#1E1E1E]"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                    added
                      ? "bg-green-500 text-white"
                      : product.inStock
                      ? "bg-[#D4302A] text-white hover:bg-[#b82a22]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      Ajouté au panier
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Ajouter au panier
                    </>
                  )}
                </button>

                <button
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition-colors ${
                    wishlisted
                      ? "border-[#D4302A] text-[#D4302A] bg-red-50"
                      : "border-[#E5E5E5] text-[#717182] hover:border-[#D4302A] hover:text-[#D4302A]"
                  }`}
                  onClick={() => setWishlisted(!wishlisted)}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <Heart
                    className={`w-4 h-4 ${wishlisted ? "fill-[#D4302A]" : ""}`}
                  />
                  Ajouter à la liste de souhaits
                </button>
              </div>

              {/* Perks */}
              <div className="mt-5 pt-5 border-t border-[#E5E5E5] flex flex-col gap-2">
                {[
                  { icon: Truck, text: "Livraison en 3-5 jours ouvrables" },
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
        <div className="mt-8 bg-white rounded-2xl border border-[#E5E5E5] p-6 max-w-2xl">
          <AccordionSection id="description" title="Description">
            <p>
              {product.description ||
                "Découvrez ce produit de qualité supérieure pour votre quotidien."}
            </p>
            {product.weight && (
              <p className="mt-2">
                <strong>Volume / Poids :</strong> {product.weight}
              </p>
            )}
          </AccordionSection>

          <AccordionSection id="ingredients" title="Ingrédients">
            <p>
              Surfactants anioniques (&lt;5%), agents de parfum, conservateurs,
              colorants alimentaires, eau purifiée. Testé dermatologiquement.
            </p>
          </AccordionSection>

          <AccordionSection id="livraison" title="Livraison & Retours">
            <ul className="space-y-1 list-disc list-inside">
              <li>Livraison standard : 7,000 TND — 3 à 5 jours ouvrables</li>
              <li>Livraison express : 12,000 TND — 24h à 48h</li>
              <li>Retours acceptés sous 14 jours, dans l'emballage d'origine</li>
              <li>Remboursement traité sous 5 à 7 jours ouvrables</li>
            </ul>
          </AccordionSection>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <h2
              className="text-[#1E1E1E] mb-5"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 600,
              }}
            >
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}