/**
 * Storefront product types, formatters, and static fallback data.
 * Live data comes from lib/data/medusa.ts — this file is intentionally lean.
 */

export type ProductVariant = {
  id: string;
  title: string;
  price: number;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  image: string;
  images?: string[];
  category: string;
  subcategory?: string;
  brand: string;
  inStock: boolean;
  isPromo?: boolean;
  description?: string;
  weight?: string;
  rating?: number;
  reviewCount?: number;
  /** Medusa variant ID — required to add to cart via Medusa API */
  variant_id?: string;
  /** All available variants */
  variants?: ProductVariant[];
  /** Product creation date for sorting by newest */
  createdAt?: string;
};

export type Category = {
  id: string;
  handle: string;
  title: string;
  image: string;
  productCount: number;
};

export const formatPrice = (price: number): string => {
  const dinars = Math.floor(price / 1000);
  const millimes = price % 1000;
  return `${dinars},${String(millimes).padStart(3, "0")} TND`;
};

/* ── Static image constants (still used in UI) ── */
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";

/* ── Static category list (populated from Medusa categories in the hook) ── */
export const categories: Category[] = [];

/* ── Brands / subcategories — kept for filter sidebar fallback ── */
export const brands: string[] = [];
export const subcategories: { label: string; count: number }[] = [];