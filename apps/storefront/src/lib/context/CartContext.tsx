import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { Product } from "../data/products";

export type CartItem = {
  product: Product;
  quantity: number;
};

export type PromoCode = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
};

type CartState = {
  items: CartItem[];
  promoCode: PromoCode | null;
};

type CartAction =
  | { type: "LOAD"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_PROMO"; payload: PromoCode | null };

const STORAGE_KEY = "sevra_cart";
const PROMO_KEY = "sevra_cart_promo";

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function loadPromoFromStorage(): PromoCode | null {
  try {
    const raw = localStorage.getItem(PROMO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePromoToStorage(promo: PromoCode | null) {
  try {
    if (promo) {
      localStorage.setItem(PROMO_KEY, JSON.stringify(promo));
    } else {
      localStorage.removeItem(PROMO_KEY);
    }
  } catch {}
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "LOAD":
      return { items: action.payload, promoCode: state.promoCode };

    case "ADD_ITEM": {
      const existing = state.items.find(
        (item) => item.product.id === action.payload.id
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload),
      };

    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (item) => item.product.id !== action.payload.id
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case "CLEAR_CART":
      return { items: [], promoCode: null };

    case "SET_PROMO":
      return { ...state, promoCode: action.payload };

    default:
      return state;
  }
};

type CartContextType = {
  cart: CartState;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (promo: PromoCode) => void;
  removePromo: () => void;
  totalItems: number;
  subtotal: number;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], promoCode: null });

  useEffect(() => {
    const saved = loadFromStorage();
    const savedPromo = loadPromoFromStorage();
    if (saved.length > 0) {
      dispatch({ type: "LOAD", payload: saved });
    }
    if (savedPromo) {
      dispatch({ type: "SET_PROMO", payload: savedPromo });
    }
  }, []);

  useEffect(() => {
    saveToStorage(cart.items);
  }, [cart.items]);

  useEffect(() => {
    savePromoToStorage(cart.promoCode);
  }, [cart.promoCode]);

  const addItem = (product: Product) =>
    dispatch({ type: "ADD_ITEM", payload: product });
  const removeItem = (id: string) =>
    dispatch({ type: "REMOVE_ITEM", payload: id });
  const updateQuantity = (id: string, quantity: number) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const applyPromo = (promo: PromoCode) =>
    dispatch({ type: "SET_PROMO", payload: promo });
  const removePromo = () => dispatch({ type: "SET_PROMO", payload: null });

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const discount = cart.promoCode
    ? cart.promoCode.discountType === "percentage"
      ? Math.floor(subtotal * cart.promoCode.discountValue / 100)
      : cart.promoCode.discountValue
    : 0;

  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, updateQuantity, clearCart, applyPromo, removePromo, totalItems, subtotal, total }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};