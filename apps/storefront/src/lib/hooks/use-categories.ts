import { useEffect, useState } from "react";
import { fetchCategories, MedusaCategory } from "@lib/data/medusa";

export function useCategories(limit: number = 3) {
  const [categories, setCategories] = useState<MedusaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchCategories()
      .then((cats) => setCategories(cats.slice(0, limit)))
      .catch((err: any) => setError(err.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  }, [limit]);

  return { categories, loading, error };
}