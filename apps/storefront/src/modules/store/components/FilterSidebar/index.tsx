import { X } from "lucide-react";
import { subcategories, brands } from "@lib/data/products";

interface FilterSidebarProps {
  filters: {
    subcategories: string[];
    brands: string[];
    minPrice: number;
    maxPrice: number;
    promoOnly: boolean;
  };
  onFilterChange: (filters: FilterSidebarProps["filters"]) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function FilterSidebar({
  filters,
  onFilterChange,
  onClose,
  isMobile = false,
}: FilterSidebarProps) {
  const handleSubcategoryToggle = (sub: string) => {
    const newSubcategories = filters.subcategories.includes(sub)
      ? filters.subcategories.filter((s) => s !== sub)
      : [...filters.subcategories, sub];
    onFilterChange({ ...filters, subcategories: newSubcategories });
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onFilterChange({ ...filters, brands: newBrands });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-semibold text-[#1E1E1E]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Filtres
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[#717182] hover:text-[#1E1E1E]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Subcategories */}
      <div className="mb-6">
        <h3
          className="font-semibold text-[#1E1E1E] mb-3 text-sm"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Sous-catégories
        </h3>
        <div className="space-y-2">
          {subcategories.map((sub) => (
            <label
              key={sub.label}
              className="flex items-center gap-2 text-sm text-[#1E1E1E] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.subcategories.includes(sub.label)}
                onChange={() => handleSubcategoryToggle(sub.label)}
                className="w-4 h-4 accent-[#D4302A]"
              />
              <span>{sub.label}</span>
              <span className="text-[#717182]">({sub.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="mb-6">
        <h3
          className="font-semibold text-[#1E1E1E] mb-3 text-sm"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Marques
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 text-sm text-[#1E1E1E] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                className="w-4 h-4 accent-[#D4302A]"
              />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Promo Filter */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm text-[#1E1E1E] cursor-pointer">
          <input
            type="checkbox"
            checked={filters.promoOnly}
            onChange={(e) =>
              onFilterChange({ ...filters, promoOnly: e.target.checked })
            }
            className="w-4 h-4 accent-[#D4302A]"
          />
          <span>Promotions uniquement</span>
        </label>
      </div>

      {/* Apply Button (Mobile) */}
      {isMobile && (
        <button
          onClick={onClose}
          className="w-full bg-[#D4302A] text-white py-3 rounded-lg font-medium text-sm"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Appliquer les filtres
        </button>
      )}
    </div>
  );
}