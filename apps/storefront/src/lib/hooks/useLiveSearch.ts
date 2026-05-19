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
        // Fetch products and filter client-side by title/description/handle
        const data = await fetchProducts({ limit: 100 });
        const filtered = data.products
          .filter(p => 
            p.title.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            p.handle.toLowerCase().includes(q) ||
            (p.metadata?.brand && (p.metadata.brand as string).toLowerCase().includes(q))
          )
          .map(normaliseProduct)
          .slice(0, 10); // Limit to 10 results
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
