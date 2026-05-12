import { RouterProvider } from "react-router";
import { CartProvider } from "../lib/context/CartContext";
import { AuthProvider } from "../lib/context/AuthContext";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
}