/**
 * Medusa v2 Store API — client-side fetching helpers
 * All prices from Medusa are in the smallest currency unit (millimes for TND).
 */

const BACKEND_URL =
  (import.meta as any).env?.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUB_KEY =
  (import.meta as any).env?.VITE_MEDUSA_PUBLISHABLE_KEY || "";

const BASE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  ...(PUB_KEY ? { "x-publishable-api-key": PUB_KEY } : {}),
};

export async function medusaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...BASE_HEADERS,
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.message || `Medusa API error ${res.status}: ${path}`);
  }
  return res.json();
}

/* ─── Types ─────────────────────────────────── */

export interface MedusaProductVariant {
  id: string;
  title: string;
  sku?: string;
  prices: { amount: number; currency_code: string }[];
  inventory_quantity?: number;
  calculated_price?: { calculated_amount: number };
}

export interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  description?: string;
  status: string;
  thumbnail?: string;
  images?: { url: string }[];
  variants: MedusaProductVariant[];
  categories?: { id: string; name: string; handle: string }[];
  collection?: { id: string; title: string; handle: string };
  tags?: { id: string; value: string }[];
  metadata?: Record<string, unknown>;
}

export interface MedusaListResponse {
  products: MedusaProduct[];
  count: number;
  offset: number;
  limit: number;
}

/* ─── Fetch helpers ──────────────────────────── */

export async function fetchProducts(params: {
  limit?: number;
  offset?: number;
  category_handle?: string[];
  handle?: string;
  region_id?: string;
} = {}): Promise<MedusaListResponse> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.handle) qs.set("handle[]", params.handle);
  if (params.category_handle?.length) {
    params.category_handle.forEach((h) => qs.append("category_handle[]", h));
  }
  if (params.region_id) qs.set("region_id", params.region_id);

  // Always expand what we need
  qs.set("fields", "id,title,handle,description,thumbnail,status,*images,*variants,*variants.prices,*categories,*collection,*tags");

  const query = qs.toString();
  return medusaFetch<MedusaListResponse>(
    `/store/products${query ? `?${query}` : ""}`
  );
}

export async function fetchProductByHandle(handle: string): Promise<MedusaProduct | null> {
  try {
    const res = await fetchProducts({ handle });
    return res.products[0] ?? null;
  } catch {
    return null;
  }
}

export interface MedusaCategory {
  id: string;
  name: string;
  handle: string;
  description?: string;
  image?: { url: string } | null;
}

export interface MedusaCategoriesResponse {
  product_categories: MedusaCategory[];
}

export async function fetchCategories(): Promise<MedusaCategory[]> {
  try {
    const res = await medusaFetch<MedusaCategoriesResponse>("/store/product-categories");
    return res.product_categories || [];
  } catch {
    return [];
  }
}

export async function fetchRegionId(): Promise<string | null> {
  try {
    const { regions } = await medusaFetch<{ regions: { id: string }[] }>("/store/regions");
    return regions?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

/* ─── Normaliser: MedusaProduct → storefront Product ── */
import type { Product } from "./products";

/**
 * Convert a Medusa product to the storefront Product shape.
 * Price is taken from the first variant's first price (in millimes).
 */
export function normaliseProduct(p: MedusaProduct): Product {
  const firstVariant = p.variants?.[0];
  const firstPrice = firstVariant?.prices?.[0]?.amount ?? 0;
  const thumbnail = p.thumbnail || p.images?.[0]?.url || "";
  const allImages = p.images?.map((i) => i.url).filter(Boolean) ?? (thumbnail ? [thumbnail] : []);
  const category = p.categories?.[0]?.name ?? p.collection?.title ?? "Général";
  const inStock =
    firstVariant?.inventory_quantity === undefined ||
    (firstVariant?.inventory_quantity ?? 1) > 0;

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    price: firstPrice,
    image: thumbnail,
    images: allImages.length > 0 ? allImages : [thumbnail],
    category,
    brand: (p.metadata?.brand as string) ?? p.collection?.title ?? "",
    inStock,
    description: p.description ?? "",
    variant_id: firstVariant?.id ?? "",
    variants: p.variants.map((v) => ({
      id: v.id,
      title: v.title,
      price: v.prices?.[0]?.amount ?? firstPrice,
    })),
  };
}