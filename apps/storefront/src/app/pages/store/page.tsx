import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronRight, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { products, formatPrice } from "../../../lib/data/products";
import ProductCard from "../../../modules/store/components/ProductCard";
import FilterSidebar from "../../../modules/store/components/FilterSidebar";

type FilterState = {
  subcategories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
  promoOnly: boolean;
};

const SORT_OPTIONS = [
  { value: "popularity", label: "Popularité" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "name", label: "Nom A-Z" },
];

export default function StorePage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    subcategories: [],
    brands: [],
    minPrice: 0,
    maxPrice: 30000,
    promoOnly: searchParams.get("promo") === "true",
  });
  const [sortBy, setSortBy] = useState("popularity");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("q");
  const promoParam = searchParams.get("promo");

  const pageTitle = useMemo(() => {
    if (promoParam === "true") return "Promotions";
    if (categoryParam === "cosmetiques") return "Cosmétiques";
    if (categoryParam === "vaisselle") return "Vaisselle";
    if (searchQuery) return `Résultats pour "${searchQuery}"`;
    return "Produits de nettoyage";
  }, [categoryParam, searchQuery, promoParam]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (promoParam === "true") {
      result = result.filter((p) => p.isPromo);
    } else if (categoryParam === "cosmetiques") {
      result = result.filter((p) => p.category === "Cosmétiques");
    } else if (categoryParam === "vaisselle") {
      result = result.filter((p) => p.category === "Vaisselle");
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Subcategory filter
    if (filters.subcategories.length > 0) {
      result = result.filter(
        (p) => p.subcategory && filters.subcategories.includes(p.subcategory)
      );
    }

    // Brand filter
    if (filters.brands.length > 0) {
      result = result.filter((p) => filters.brands.includes(p.brand));
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    // Promo filter
    if (filters.promoOnly) {
      result = result.filter((p) => p.isPromo);
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }

    return result;
  }, [filters, sortBy, categoryParam, searchQuery, promoParam]);

  const displayedProducts = showMore
    ? filteredProducts
    : filteredProducts.slice(0, 9);

  return (
    <div
      className="min-h-screen bg-[#F0F3FA]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-5">
          <Link to="/" className="hover:text-[#D4302A] transition-colors">
            Accueil
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">{pageTitle}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1
              className="text-[#1E1E1E]"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "1.5rem",
                fontWeight: 700,
              }}
            >
              {pageTitle}
            </h1>
            <p className="text-sm text-[#717182] mt-0.5">
              {filteredProducts.length} produit
              {filteredProducts.length !== 1 ? "s" : ""} trouvé
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              className="sm:hidden flex items-center gap-2 border border-[#E5E5E5] bg-white px-3 py-2 rounded-lg text-sm text-[#1E1E1E] font-medium"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrer
            </button>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#717182] hidden sm:block">
                Trier par
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none border border-[#E5E5E5] bg-white pl-3 pr-8 py-2 rounded-lg text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop */}
          <aside className="hidden sm:block w-64 flex-shrink-0">
            <FilterSidebar filters={filters} onFilterChange={setFilters} />
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#717182] text-lg">Aucun produit trouvé.</p>
                <button
                  className="mt-4 text-[#D4302A] text-sm hover:underline"
                  onClick={() =>
                    setFilters({
                      subcategories: [],
                      brands: [],
                      minPrice: 0,
                      maxPrice: 30000,
                      promoOnly: false,
                    })
                  }
                >
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {filteredProducts.length > 9 && !showMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowMore(true)}
                      className="inline-flex items-center gap-2 border border-[#1E1E1E] text-[#1E1E1E] px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1E1E1E] hover:text-white transition-colors"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Afficher plus
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-4">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              onClose={() => setMobileFilterOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}
    </div>
  );
}