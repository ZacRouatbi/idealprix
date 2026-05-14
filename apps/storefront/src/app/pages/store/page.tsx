import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { ChevronRight, SlidersHorizontal, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { formatPrice } from "../../../lib/data/products";
import { useProducts } from "../../../lib/hooks/use-products";
import { useCategories } from "../../../lib/hooks/use-categories";
import { fetchProducts, fetchCategories, medusaFetch } from "../../../lib/data/medusa";
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
  { value: "default", label: "Par défaut" },
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
    maxPrice: 200000,
    promoOnly: false,
  });
  const [sortBy, setSortBy] = useState("default");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("q");
  const promoParam = searchParams.get("promo");

  // Keep filters.promoOnly in sync with URL param
  useEffect(() => {
    setFilters((prev) => ({ ...prev, promoOnly: searchParams.get("promo") === "true" }));
  }, [searchParams]);

  const { subcategories: backendSubcategories } = useCategories(6, categoryParam || undefined);

  // Build subcategory ID map for filtering
  const [subcategoryIds, setSubcategoryIds] = useState<Record<string, string[]>>({});
  
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
      setSubcategoryIds(idMap);
    });
  }, []);

  // Get all category IDs (parent + subcategories) when categoryParam is a parent
  const [allCategoryIds, setAllCategoryIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (!categoryParam) {
      setAllCategoryIds([]);
      return;
    }
    // Get category ID from handle
    medusaFetch<{ product_categories: { id: string; handle: string }[] }>(
      `/store/product-categories?handle[]=${categoryParam}&fields=id,handle`
    ).then((res) => {
      const cat = res.product_categories?.[0];
      if (cat) {
        const childIds = subcategoryIds[cat.id] || [];
        setAllCategoryIds([cat.id, ...childIds]);
      } else {
        setAllCategoryIds([]);
      }
    }).catch(() => setAllCategoryIds([]));
  }, [categoryParam, subcategoryIds]);

  const { products, loading, error } = useProducts({
    limit: 100,
    ...(allCategoryIds.length > 0 ? { category_id: allCategoryIds } : categoryParam ? { category_handle: [categoryParam] } : {}),
  });

  const pageTitle = useMemo(() => {
    if (promoParam === "true") return "Promotions";
    if (searchQuery) return `Résultats pour "${searchQuery}"`;
    if (categoryParam) return categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1).replace(/-/g, " ");
    return "Tous les produits";
  }, [categoryParam, searchQuery, promoParam]);

  // Derive filter options from live products
  const availableBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    [products]
  );
  const availableSubcats = useMemo(
    () => [...new Set(products.map((p) => p.subcategory).filter(Boolean) as string[])].sort(),
    [products]
  );
  
  // Use backend subcategories when available (from category hierarchy), fallback to product-derived
  const availableSubcategories = backendSubcategories.length > 0 
    ? [...new Set(backendSubcategories.map(c => c.name))].sort()
    : availableSubcats;

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (filters.subcategories.length > 0) {
      // Check if product has ANY of the selected subcategories in its categories
      result = result.filter((p) => {
        // Check subcategory field AND if the product's main category matches a subcategory
        if (p.subcategory && filters.subcategories.includes(p.subcategory)) return true;
        // Also check if the category itself matches (for direct subcategory pages)
        if (p.category && filters.subcategories.includes(p.category)) return true;
        return false;
      });
    }

    if (filters.brands.length > 0) {
      result = result.filter((p) => filters.brands.includes(p.brand));
    }

    result = result.filter(
      (p) => p.price >= filters.minPrice && p.price <= filters.maxPrice
    );

    if (filters.promoOnly) {
      result = result.filter((p) => p.isPromo);
    }

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
    }

    return result;
  }, [products, filters, sortBy, searchQuery]);

  const displayed = showMore ? filteredProducts : filteredProducts.slice(0, 9);

  return (
    <div className="min-h-screen bg-[#F0F3FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-5">
          <Link to="/" className="hover:text-[#D4302A] transition-colors">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">{pageTitle}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>
              {pageTitle}
            </h1>
            {!loading && (
              <p className="text-sm text-[#717182] mt-0.5">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? "s" : ""} trouvé{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              className="sm:hidden flex items-center gap-2 border border-[#E5E5E5] bg-white px-3 py-2 rounded-lg text-sm text-[#1E1E1E] font-medium"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrer
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#717182] hidden sm:block">Trier par</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none border border-[#E5E5E5] bg-white pl-3 pr-8 py-2 rounded-lg text-sm text-[#1E1E1E] focus:outline-none focus:border-[#D4302A] cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Impossible de charger les produits depuis le serveur. Vérifiez que le backend Medusa est démarré.</span>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden sm:block w-64 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              availableBrands={availableBrands}
              availableSubcategories={availableSubcategories}
            />
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#D4302A] animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#717182] text-lg">Aucun produit trouvé.</p>
                <button
                  className="mt-4 text-[#D4302A] text-sm hover:underline"
                  onClick={() => setFilters({ subcategories: [], brands: [], minPrice: 0, maxPrice: 200000, promoOnly: false })}
                >
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayed.map((product) => (
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
                      Afficher plus <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-4">
<FilterSidebar
               filters={filters}
               onFilterChange={setFilters}
               onClose={() => setMobileFilterOpen(false)}
               isMobile
               availableBrands={availableBrands}
               availableSubcategories={availableSubcategories}
             />
          </div>
        </div>
      )}
    </div>
  );
}