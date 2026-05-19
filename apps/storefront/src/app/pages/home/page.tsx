import { Link } from "react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { formatPrice, HERO_IMAGE } from "../../../lib/data/products";
import { useProducts } from "../../../lib/hooks/use-products";
import { useCategories } from "../../../lib/hooks/use-categories";
import { fetchCategories } from "../../../lib/data/backend-adapter";
import { useEffect, useState } from "react";
import ProductCard from "../../../modules/store/components/ProductCard";

export default function HomePage() {
  const { products, loading } = useProducts({ limit: 8 });
  const { categories, loading: categoriesLoading } = useCategories(3);

  const popularProducts = products
    .filter((p) => p.inStock)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);
  const promoProducts = products.filter((p) => p.isPromo).slice(0, 4);

  // Fetch product counts per category (including subcategories)
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [allCategoryIds, setAllCategoryIds] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchCategories().then((cats) => {
      const idMap: Record<string, string[]> = {};
      for (const cat of cats) {
        const parent = cat.parent_category_id || cat.parent_id;
        if (parent) {
          if (!idMap[parent]) idMap[parent] = [];
          idMap[parent].push(cat.id);
        }
      }
      setAllCategoryIds(idMap);
    });
  }, []);

  useEffect(() => {
    async function fetchCounts() {
      const countMap: Record<string, number> = {};
      for (const cat of categories) {
        try {
          // Get all category IDs for this parent (including subcategories)
          const childIds = allCategoryIds[cat.id] || [];
          const allIds = [cat.id, ...childIds];
          
          // Query products for this category or its subcategories
          const res = await fetchProducts({ category_id: allIds, limit: 1 });
          countMap[cat.handle] = res.count || 0;
        } catch {
          countMap[cat.handle] = 0;
        }
      }
      setCounts(countMap);
      setCountsLoading(false);
    }
    if (categories.length > 0) fetchCounts();
  }, [categories, allCategoryIds]);

  const enrichedCategories = categories.map((cat) => ({
    id: cat.id,
    title: cat.name,
    handle: cat.handle,
    image: cat.image?.url || HERO_IMAGE,
    count: counts[cat.handle] || 0,
  }));
 
  return (
    <main style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#D4302A]">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-white mb-4 leading-tight"
              style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 700, lineHeight: 1.15 }}>
              Des produits pour un quotidien plus propre
            </h1>
            <p className="text-white mb-6 max-w-md mx-auto lg:mx-0" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
              Produits de qualité au meilleur prix, livrés chez vous en Tunisie.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-[#D4302A] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Découvrir maintenant <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm lg:max-w-md">
              <img src={HERO_IMAGE} alt="Produits" className="w-full h-72 lg:h-80 object-cover rounded-2xl shadow-lg" />
            </div>
          </div>
        </div>
      </section>
 
{/* Categories */}
      {!categoriesLoading && !countsLoading && enrichedCategories.length > 0 && (
        <section className="bg-[#F0F3FA] w-full">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {enrichedCategories.map((cat) => (
                <Link
                  key={cat.handle}
                  to={`/products?category=${cat.handle}`}
                  className="group block relative overflow-hidden rounded-2xl border border-[#E5E5E5] hover:shadow-md transition-shadow"
                >
                  {/* Category image as header/background */}
                  <div className="relative h-32 w-full">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h3 className="absolute bottom-3 left-4 font-semibold text-white text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {cat.title}
                    </h3>
                  </div>
                  {/* Product count at bottom */}
                  <div className="bg-white px-4 py-2.5">
                    <p className="text-xs text-[#717182]">
                      {cat.count} produit{cat.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
 
      {/* Popular products */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.25rem", fontWeight: 700 }}>
              Produits populaires
            </h2>
            <Link to="/products" className="text-sm text-[#D4302A] hover:underline font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
 
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 text-[#D4302A] animate-spin" />
            </div>
          ) : popularProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="text-center text-[#717182] py-8">Aucun produit disponible pour l'instant.</p>
          )}
        </div>
      </section>
 
      {/* Promo products */}
      {promoProducts.length > 0 && (
        <section className="bg-[#F0F3FA]">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.25rem", fontWeight: 700 }}>
                ✨ Promotions
              </h2>
              <Link to="/products?promo=true" className="text-sm text-[#D4302A] hover:underline font-medium flex items-center gap-1">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {promoProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

        {/* Trust Badges */}
        <section className="border-t border-[#E5E5E5] bg-[#F0F3FA] w-full py-10">
          <div className="max-w-7xl mx-auto px-4">
            <h2
              className="text-[#1E1E1E] text-center mb-6"
              style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.25rem", fontWeight: 600 }}
            >
              Nos services et garanties
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🚚", title: "Livraison rapide", desc: "3 à 5 jours ouvrables" },
                { icon: "🔒", title: "Paiement sécurisé", desc: "Vos données sont protégées" },
                { icon: "↩️", title: "Retour facile", desc: "Sous 14 jours" },
                { icon: "🏆", title: "Qualité garantie", desc: "Produits authentiques" },
              ].map((badge) => (
                <div
                  key={badge.title}
                  className="flex items-start gap-3 bg-white rounded-xl border border-[#E5E5E5] p-4 transition-all duration-300 hover:shadow-lg hover:translate-y-1 hover:border-[#D4302A] group"
                >
                  <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{badge.icon}</span>
                  <div>
                    <p
                      className="font-semibold text-[#1E1E1E] text-sm"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {badge.title}
                    </p>
                    <p className="text-xs text-[#717182]">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
}
