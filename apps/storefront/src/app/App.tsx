import { RouterProvider } from "react-router";
import { CartProvider } from "../lib/context/CartContext";
import { router } from "./routes";

export default function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
}