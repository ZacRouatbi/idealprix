import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { User, ShoppingCart, Search, LogOut, X } from "lucide-react";
import { useCart } from "@lib/context/CartContext";
import { useAuth } from "@lib/context/AuthContext";
import AuthModal from "../AuthModal";
import { formatPrice, Product } from "@lib/data/products";
import { useLiveSearch } from "@lib/hooks/useLiveSearch";

export default function Navbar() {
  const { cart, totalItems } = useCart();
  const { token, customer, checkAuth, logout } = useAuth();
  const navigate = useNavigate();
  // Live search hook (debounced, fetches /api/search by default)
  const { query: searchQuery, setQuery, results: filteredProducts, isLoading, clear } =
    useLiveSearch();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!token;

  /* filteredProducts now comes from useLiveSearch hook */

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAuthSuccess = useCallback(() => checkAuth(), [checkAuth]);

  const handleAccountClick = useCallback(() => {
    if (isLoggedIn) {
      navigate("/account");
    } else {
      setShowAuthModal(true);
    }
  }, [isLoggedIn, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  const handleProductClick = useCallback(() => {
    setShowSearchResults(false);
    setSearchQuery("");
  }, []);

  const clearSearch = () => {
    clear();
    setShowSearchResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  return (
    <>
      <div className="sticky top-0 inset-x-0 z-50 group">
        {/* Top Navbar */}
        <header className="relative h-16 mx-auto border-b duration-200 bg-white border-gray-200">
          <nav className="content-container txt-xsmall-plus text-gray-600 flex items-center w-full h-full text-small-regular">
            {/* Left: Mobile menu button + Logo */}
            <div className="flex items-center h-full flex-1">
              <div className="h-full md:hidden mr-2">
                <button className="p-2 hover:text-gray-900" aria-label="Menu">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
              <Link
                to="/"
                className="h-full flex items-center"
                data-testid="nav-store-link"
              >
                <img
                  src="/Idealprixlogo.png"
                  alt="IdealPrix"
                  className="h-10 w-auto"
                />
              </Link>
            </div>

            {/* Center: Search Bar - hidden on mobile */}
            <div className="hidden md:block relative" ref={searchRef}>
              <div className="relative">
<input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={handleInputChange}
                          onFocus={() => searchQuery && setShowSearchResults(true)}
                          className="w-64 lg:w-80 pl-9 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#D4302A] bg-gray-50"
                        />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 mt-2 w-80 lg:w-96 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                  {filteredProducts.length > 0 ? (
                    <>
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">
                          {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} trouvé{filteredProducts.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      {filteredProducts.map((product: Product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.handle}`}
                          onClick={handleProductClick}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {product.title}
                            </h4>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                            <p className="text-sm font-bold text-[#D4302A]">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          {product.isPromo && (
                            <span className="bg-[#D4302A] text-white text-xs px-1.5 py-0.5 rounded">
                              -{product.discountPercent}%
                            </span>
                          )}
                        </Link>
                      ))}
                      <Link
                        to={`/products?q=${encodeURIComponent(searchQuery)}`}
                        onClick={handleProductClick}
                        className="block p-3 text-center text-sm text-[#D4302A] font-medium hover:bg-gray-50 border-t border-gray-100"
                      >
                        Voir tous les résultats
                      </Link>
                    </>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">Aucun produit trouvé</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Account, Cart */}
            <div className="flex items-center gap-x-3 h-full justify-end flex-1">
              {/* Account Icon */}
              <button
                onClick={handleAccountClick}
                className="p-2 text-gray-600 hover:text-[#D4302A] hover:bg-gray-100 rounded-full transition-all duration-200"
                aria-label="Account"
              >
                <User className="w-6 h-6" />
              </button>

              {/* Logout Icon - only shown when logged in */}
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-[#D4302A] hover:bg-gray-100 rounded-full transition-all duration-200"
                  aria-label="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              )}

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-[#D4302A] hover:bg-gray-100 rounded-full transition-all duration-200"
                data-testid="nav-cart-link"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4302A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        </header>

        {/* Store Menu Bar */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="content-container flex items-center h-10 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "text-[#D4302A] font-medium mr-6" : "text-gray-600 hover:text-[#D4302A] mr-6"
              }
            >
              Accueil
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive ? "text-[#D4302A] font-medium mr-6" : "text-gray-600 hover:text-[#D4302A] mr-6"
              }
            >
              Tous les produits
            </NavLink>
            <NavLink
              to="/products?category=nettoyage"
              className={({ isActive }) =>
                isActive ? "text-[#D4302A] font-medium mr-6" : "text-gray-600 hover:text-[#D4302A] mr-6"
              }
            >
              Nettoyage
            </NavLink>
            <NavLink
              to="/products?category=cosmetiques"
              className={({ isActive }) =>
                isActive ? "text-[#D4302A] font-medium mr-6" : "text-gray-600 hover:text-[#D4302A] mr-6"
              }
            >
              Cosmétiques
            </NavLink>
            <NavLink
              to="/products?category=vaisselle"
              className={({ isActive }) =>
                isActive ? "text-[#D4302A] font-medium mr-6" : "text-gray-600 hover:text-[#D4302A] mr-6"
              }
            >
              Vaisselle
            </NavLink>
            <NavLink
              to="/products?promo=true"
              className={({ isActive }) =>
                isActive ? "text-[#D4302A] font-medium" : "text-gray-600 hover:text-[#D4302A]"
              }
            >
              Promotions
            </NavLink>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={handleAuthSuccess} />
    </>
  );
}