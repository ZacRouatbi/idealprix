import { useEffect, useState, useCallback } from "react";
import { fetchProducts, fetchProductByHandle, normaliseProduct } from "@lib/data/medusa";
import type { Product } from "@lib/data/products";

/* ─── List hook ─────────────────────────────── */
export function useProducts(params: {
  limit?: number;
  offset?: number;
  category_handle?: string | string[];
  category_id?: string | string[];
} = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts({ limit: 100, ...params });
      const debug = (import.meta as any).env?.VITE_MEDUSA_DEBUG === "true";
      if (debug) console.debug('[useProducts] params', params, 'fetched count', res.count, 'ids', res.products.map(p => p.id));
      setProducts(res.products.map(normaliseProduct));
      setTotal(res.count);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des produits.");
    } finally {
      setLoading(false);
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return { products, total, loading, error, reload: load };
}

/* ─── Single-product hook ───────────────────── */
export function useProduct(handle: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchProductByHandle(handle)
      .then((p) => setProduct(p ? normaliseProduct(p) : null))
      .catch((err: any) => setError(err.message || "Erreur de chargement."))
      .finally(() => setLoading(false));
  }, [handle]);

  return { product, loading, error };
}