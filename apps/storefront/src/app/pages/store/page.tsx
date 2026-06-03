import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router";
import { ChevronRight, SlidersHorizontal, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { useCategories } from "../../../lib/hooks/use-categories";
import { fetchProducts, fetchCategories, normaliseProduct } from "../../../lib/data/backend-adapter";
import ProductCard from "../../../modules/store/components/ProductCard";
import FilterSidebar from "../../../modules/store/components/FilterSidebar";
import type { Product } from "../../../lib/data/products";

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

const PRODUCTS_PER_ROW = 4;
const MAX_ROWS = 5;
const PRODUCTS_PER_PAGE = PRODUCTS_PER_ROW * MAX_ROWS; // 20 products per page (5 rows)

export default function StorePage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    subcategories: [],
    brands: [],
    minPrice: 0,
    maxPrice: 200000,
    promoOnly: false,
  });

  const [priceLimit, setPriceLimit] = useState<number>(200000);

  useEffect(() => {
    let mounted = true;
    async function deriveLimitFromBackend() {
      try {
        const all = await fetchProducts({ limit: 200 });
        if (!mounted) return;
        const max = (all.products || []).reduce((acc, p) => {
          const prices = (p.variants || []).flatMap((v) => (v.prices || []).map((pr) => pr.amount ?? 0));
          const localMax = prices.length > 0 ? Math.max(...prices) : 0;
          return Math.max(acc, localMax);
        }, 200000);
        setPriceLimit(max);
        setFilters((prev) => ({ ...prev, maxPrice: prev.maxPrice === 200000 ? max : prev.maxPrice }));
      } catch (e) {
        console.debug("[store-page] deriveLimitFromBackend failed", e);
      }
    }
    deriveLimitFromBackend();
    return () => { mounted = false; };
  }, []);
  const [sortBy, setSortBy] = useState("default");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categoryParam = searchParams.get("category");
  const searchQuery = searchParams.get("q");
  const promoParam = searchParams.get("promo");

  useEffect(() => {
    setFilters((prev) => ({ ...prev, promoOnly: searchParams.get("promo") === "true" }));
  }, [searchParams]);

  const { subcategories: backendSubcategories } = useCategories(6, categoryParam || undefined);

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

  const [allCategoryIds, setAllCategoryIds] = useState<string[]>([]);
  
  useEffect(() => {
    if (!categoryParam) {
      setAllCategoryIds([]);
      return;
    }
    (async () => {
      try {
        const allCats = await fetchCategories();
        const cat = allCats.find(c => c.handle === categoryParam);
        if (cat) {
          const childIds = subcategoryIds[cat.id] || [];
          setAllCategoryIds([cat.id, ...childIds]);
        } else {
          setAllCategoryIds([]);
        }
      } catch {
        setAllCategoryIds([]);
      }
    })();
  }, [categoryParam, subcategoryIds]);

  const [currentPage, setCurrentPage] = useState(1);
  const [prefetchedProducts, setPrefetchedProducts] = useState<Record<number, Product[]>>({});
  const [prefetchedTotal, setPrefetchedTotal] = useState<Record<number, number>>({});
  const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [loadingPage, setLoadingPage] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProductsForPage = useCallback(async (page: number, categoryIds: string[] = []) => {
    const offset = (page - 1) * PRODUCTS_PER_PAGE;
    
    try {
      const params: Record<string, any> = { limit: PRODUCTS_PER_PAGE, offset };
      if (categoryIds.length > 0) {
        params.category_id = categoryIds;
      }
      
      const response = await fetchProducts(params);
      const normalised = response.products.map(normaliseProduct);
      
      if (page === 1) {
        setLoadedProducts(normalised);
        setTotalProductCount(response.count);
      }
      
      setPrefetchedProducts(prev => ({ ...prev, [page]: normalised }));
      setPrefetchedTotal(prev => ({ ...prev, [page]: response.count }));
      return { products: normalised, total: response.count };
    } catch (err: any) {
      console.debug("[store-page] load failed", err);
      setErrorMsg(err.message || "Erreur lors du chargement des produits");
      return null;
    }
  }, []);

  // Flag to track if initial load has completed
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load products when component mounts or category changes
  useEffect(() => {
    // Clear prefetch cache when category changes
    setPrefetchedProducts({});
    setLoadedProducts([]);
    setTotalProductCount(0);
    setCurrentPage(1);
    setInitialLoadDone(false);
    loadProductsForPage(1, allCategoryIds).then(() => {
      setInitialLoadDone(true);
    });
  }, [allCategoryIds]);

  // Prefetch page 2 after initial load completes
  useEffect(() => {
    if (initialLoadDone && totalProductCount > PRODUCTS_PER_PAGE && !prefetchedProducts[2]) {
      // Fire and forget prefetch
      loadProductsForPage(2, allCategoryIds);
    }
  }, [initialLoadDone, totalProductCount, allCategoryIds, loadProductsForPage]);

  // Get products for current page
  const products = useMemo(() => {
    if (currentPage === 1) return loadedProducts;
    return prefetchedProducts[currentPage] || [];
  }, [currentPage, loadedProducts, prefetchedProducts]);

  const isLoadingInitial = !initialLoadDone;

  const pageTitle = useMemo(() => {
    if (promoParam === "true") return "Promotions";
    if (searchQuery) return `Résultats pour "${searchQuery}"`;
    if (categoryParam) return categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1).replace(/-/g, " ");
    return "Tous les produits";
  }, [categoryParam, searchQuery, promoParam]);

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
      result = result.filter((p) => {
        if (p.subcategory && filters.subcategories.includes(p.subcategory)) return true;
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
      case "created_at":
      default:
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [products, filters, sortBy, searchQuery]);

  const availableBrands = useMemo(
    () => [...new Set(filteredProducts.map((p) => p.brand).filter(Boolean))].sort(),
    [filteredProducts]
  );
  const availableSubcats = useMemo(
    () => [...new Set(filteredProducts.map((p) => p.subcategory).filter(Boolean) as string[])].sort(),
    [filteredProducts]
  );
  
  const [categoryHierarchy, setCategoryHierarchy] = useState<Record<string, { id: string; name: string; handle: string; children: { id: string; name: string; handle: string }[] }>>({});

  const availableSubcategories = backendSubcategories.length > 0 
    ? [...new Set(backendSubcategories.map(c => c.name))].sort()
    : availableSubcats;

  const totalPages = Math.ceil(totalProductCount / PRODUCTS_PER_PAGE);
  const displayedProducts = filteredProducts;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePageChange = (page: number) => {
    if (prefetchedProducts[page]) {
      setCurrentPage(page);
    } else {
      setLoadingPage(page);
      loadProductsForPage(page, allCategoryIds).then((result) => {
        setLoadingPage(null);
        if (result) {
          setCurrentPage(page);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F3FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-5">
          <Link to="/" className="hover:text-[#D4302A] transition-colors">Accueil</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#1E1E1E] font-medium">{pageTitle}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[#1E1E1E]" style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.5rem", fontWeight: 700 }}>
              {pageTitle}
            </h1>
            {!isLoadingInitial && (
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

        <div className="flex gap-6">
          <aside className="hidden sm:block w-64 flex-shrink-0">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              availableBrands={availableBrands}
              availableSubcategories={availableSubcategories}
              maxPriceLimit={priceLimit}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {errorMsg && (
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-6">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {isLoadingInitial ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#D4302A] animate-spin" />
              </div>
            ) : loadingPage === currentPage ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#D4302A] animate-spin" />
              </div>
            ) : displayedProducts.length === 0 ? (
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
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                   {displayedProducts.map((product) => (
                     <ProductCard key={product.id} product={product} />
                   ))}
                 </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium text-[#717182] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          disabled={loadingPage === page}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? "bg-[#D4302A] text-white"
                              : "border border-[#E5E5E5] text-[#717182] hover:bg-gray-50"
                          }`}
                        >
                          {loadingPage === page ? "..." : page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-2 border border-[#E5E5E5] rounded-lg text-sm font-medium text-[#717182] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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