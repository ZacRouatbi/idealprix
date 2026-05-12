import { createBrowserRouter } from "react-router";
import Root from "./Root";
import HomePage from "./pages/home/page";
import StorePage from "./pages/store/page";
import ProductPage from "./pages/product/page";
import CartPage from "./pages/cart/page";
import CheckoutPage from "./pages/checkout/page";
import AccountDashboardPage from "./pages/account/page";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9F8F7] flex items-center justify-center">
      <div className="text-center">
        <h1
          className="text-6xl font-bold text-[#1E1E1E] mb-4"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          404
        </h1>
        <p className="text-[#717182] mb-6">Page non trouvée</p>
        <a
          href="/"
          className="bg-[#D4302A] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#b82a22] transition-colors"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "products", Component: StorePage },
      { path: "products/:handle", Component: ProductPage },
      { path: "cart", Component: CartPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "account", Component: AccountDashboardPage },
      { path: "*", Component: NotFound },
    ],
  },
]);