import { X } from "lucide-react";

interface FilterState {
  subcategories: string[];
  brands: string[];
  minPrice: number;
  maxPrice: number;
  promoOnly: boolean;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClose?: () => void;
  isMobile?: boolean;
  availableBrands?: string[];
  availableSubcategories?: string[];
}

export default function FilterSidebar({
  filters,
  onFilterChange,
  onClose,
  isMobile,
  availableBrands = [],
  availableSubcategories = [],
}: FilterSidebarProps) {
  const toggle = (key: "subcategories" | "brands", value: string) => {
    const current = filters[key];
    onFilterChange({
      ...filters,
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const clearAll = () =>
    onFilterChange({
      subcategories: [],
      brands: [],
      minPrice: 0,
      maxPrice: 200000,
      promoOnly: false,
    });

  const hasActive =
    filters.subcategories.length > 0 ||
    filters.brands.length > 0 ||
    filters.promoOnly;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1E1E1E] text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>
          Filtres
        </h3>
        <div className="flex items-center gap-2">
          {hasActive && (
            <button onClick={clearAll} className="text-xs text-[#D4302A] hover:underline">
              Tout effacer
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} className="p-1 hover:bg-[#F0F3FA] rounded-lg">
              <X className="w-4 h-4 text-[#717182]" />
            </button>
          )}
        </div>
      </div>

      {/* Promo toggle */}
      <div className="mb-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.promoOnly}
            onChange={(e) => onFilterChange({ ...filters, promoOnly: e.target.checked })}
            className="accent-[#D4302A] w-4 h-4"
          />
          <span className="text-sm text-[#1E1E1E] font-medium">Promotions uniquement</span>
        </label>
      </div>

      {/* Subcategories */}
      {availableSubcategories.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">
            Sous-catégorie
          </p>
          <div className="space-y-1.5">
            {availableSubcategories.map((sub) => (
              <label key={sub} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.subcategories.includes(sub)}
                  onChange={() => toggle("subcategories", sub)}
                  className="accent-[#D4302A] w-4 h-4"
                />
                <span className="text-sm text-[#1E1E1E]">{sub}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">
            Marque
          </p>
          <div className="space-y-1.5">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggle("brands", brand)}
                  className="accent-[#D4302A] w-4 h-4"
                />
                <span className="text-sm text-[#1E1E1E]">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#717182] uppercase tracking-wider mb-2">
          Prix max
        </p>
        <input
          type="range"
          min={0}
          max={200000}
          step={1000}
          value={filters.maxPrice}
          onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-[#D4302A]"
        />
        <div className="flex justify-between text-xs text-[#717182] mt-1">
          <span>0 TND</span>
          <span className="text-[#D4302A] font-medium">
            {Math.floor(filters.maxPrice / 1000)},{String(filters.maxPrice % 1000).padStart(3, "0")} TND
          </span>
        </div>
      </div>

      {isMobile && (
        <button
          onClick={onClose}
          className="w-full bg-[#D4302A] text-white py-3 rounded-xl font-semibold text-sm"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Voir les résultats
        </button>
      )}
    </div>
  );
}