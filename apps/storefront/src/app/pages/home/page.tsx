import { Link } from "react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { products, categories, formatPrice, HERO_IMAGE } from "../../../lib/data/products";
import ProductCard from "../../../modules/store/components/ProductCard";

export default function HomePage() {
  const popularProducts = products.filter((p) => p.inStock).slice(0, 4);
  const promoProducts = products.filter((p) => p.isPromo);

return (
    <main style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Hero Banner */}
       <section className="relative overflow-hidden bg-[#D4302A]">
         <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16 flex flex-col lg:flex-row items-center gap-8">
           {/* Text */}
           <div className="flex-1 text-center lg:text-left">
             <h1
               className="text-white mb-4 leading-tight"
               style={{
                 fontFamily: "Poppins, sans-serif",
                 fontSize: "clamp(2rem, 5vw, 2.75rem)",
                 fontWeight: 700,
                 lineHeight: 1.15,
               }}
             >
               Des produits pour un quotidien plus propre
             </h1>
             <p
               className="text-white mb-6 max-w-md mx-auto lg:mx-0"
               style={{ fontSize: "1rem", lineHeight: 1.6 }}
             >
               Produits de nettoyage, cosmétiques et vaisselle avec un prix idéal.
             </p>
             <Link
               to="/products"
               className="inline-flex items-center gap-2 bg-white text-[#D4302A] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
               style={{ fontFamily: "Poppins, sans-serif" }}
             >
               Découvrir maintenant
               <ArrowRight className="w-4 h-4" />
             </Link>
           </div>

           {/* Hero Image */}
           <div className="flex-1 flex justify-center">
             <div className="relative w-full max-w-sm lg:max-w-md">
               <img
                 src={HERO_IMAGE}
                 alt="Produits de nettoyage"
                 className="w-full h-72 lg:h-80 object-cover rounded-2xl shadow-lg"
               />
             </div>
           </div>
         </div>
       </section>

       {/* Categories */}
       <section className="bg-[#F0F3FA] w-full">
         <div className="max-w-7xl mx-auto px-4 py-10">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             {categories.map((cat) => (
               <Link
                 key={cat.id}
                 to={`/products?category=${cat.handle}`}
                 className="group relative overflow-hidden rounded-xl bg-white border border-[#E5E5E5] hover:shadow-md transition-shadow"
               >
                 <div className="h-44 overflow-hidden">
                   <img
                     src={cat.image}
                     alt={cat.title}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                   />
                 </div>
                 <div className="p-4 flex items-center justify-between">
                   <div>
                     <h3
                       className="font-semibold text-[#1E1E1E]"
                       style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.95rem" }}
                     >
                       {cat.title}
                     </h3>
                     <p className="text-xs text-[#717182] mt-0.5">
                       {cat.productCount} produits
                     </p>
                   </div>
                   <div className="flex items-center gap-1 text-[#D4302A] text-sm font-medium">
                     <span style={{ fontFamily: "Poppins, sans-serif" }}>
                       Voir tout
                     </span>
                     <ChevronRight className="w-4 h-4" />
                   </div>
                 </div>
               </Link>
             ))}
           </div>
         </div>
       </section>

       {/* Popular Products */}
       <section className="bg-[#F0F3FA] w-full">
         <div className="max-w-7xl mx-auto px-4 pb-10">
           <div className="flex items-center justify-between mb-5">
             <h2
               className="text-[#1E1E1E]"
               style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.25rem", fontWeight: 600 }}
             >
               Nos produits populaires
             </h2>
             <Link
               to="/products"
               className="text-sm text-[#D4302A] font-medium hover:underline flex items-center gap-1"
               style={{ fontFamily: "Poppins, sans-serif" }}
             >
               Voir tout <ArrowRight className="w-4 h-4" />
             </Link>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
             {popularProducts.map((product) => (
               <ProductCard key={product.id} product={product} />
             ))}
           </div>
         </div>
       </section>

{/* Promos Banner */}
        {promoProducts.length > 0 && (
          <section className="bg-[#F0F3FA] w-full py-10">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-[#1E1E1E]"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.25rem", fontWeight: 600 }}
                >
                  🔥 Nos promotions du moment
                </h2>
                <Link
                  to="/products?promo=true"
                  className="text-sm text-[#1E1E1E] font-medium hover:underline flex items-center gap-1"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Voir tout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {promoProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
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
