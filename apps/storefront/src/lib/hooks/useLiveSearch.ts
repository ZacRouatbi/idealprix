import { useState, useEffect, useRef } from "react";

export function useLiveSearch(initial = "") {
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const q = query.trim();
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
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controllerRef.current.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResults(data.results ?? data);
      } catch (err) {
        if ((err as any).name !== "AbortError") console.error(err);
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
