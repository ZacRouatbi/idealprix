import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { User, ShoppingCart, Search } from "lucide-react";
import { useCart } from "@lib/context/CartContext";

export default function Navbar() {
  const { cart, totalItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
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
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 lg:w-80 pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#D4302A] bg-gray-50"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>
          </form>

          {/* Right: Account, Cart */}
          <div className="flex items-center gap-x-3 h-full justify-end flex-1">
            {/* Account Icon */}
            <Link
              to="/account"
              className="p-2 hover:text-gray-900"
              aria-label="Account"
              data-testid="nav-account-link"
            >
              <User className="w-6 h-6" />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 hover:text-gray-900"
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
            to="/products?category=produits-de-nettoyage"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Nettoyage
          </NavLink>
          <NavLink
            to="/products?category=cosmetiques"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Cosmétiques
          </NavLink>
          <NavLink
            to="/products?category=vaisselle"
            className="text-gray-600 hover:text-[#D4302A] mr-6"
          >
            Vaisselle
          </NavLink>
          <NavLink
            to="/products?promo=true"
            className="text-[#D4302A] font-medium"
          >
            Promotions
          </NavLink>
        </div>
      </div>
    </div>
  );
}