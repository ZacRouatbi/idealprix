import { useState, useEffect, useRef } from "react";
import { fetchProducts, normaliseProduct } from "@lib/data/backend-adapter";

export function useLiveSearch(initial = "") {
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

useEffect(() => {
    const q = query.trim().toLowerCase();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!q) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();
      setIsLoading(true);
      try {
        // Server-side search with small limit for instant results
        const data = await fetchProducts({ search: q, limit: 10 });
        const filtered = data.products.map(normaliseProduct).slice(0, 10);
        setResults(filtered);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  const clear = () => {
    controllerRef.current?.abort();
    setQuery("");
    setResults([]);
    setIsLoading(false);
  };

  return { query, setQuery, results, isLoading, clear };
}
