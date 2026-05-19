import { useEffect, useState } from "react";
import { fetchCategories, fetchSubcategories, type MedusaCategory } from "@lib/data/backend-adapter";

export function useCategories(limit: number = 3, categoryHandle?: string) {
  const [categories, setCategories] = useState<MedusaCategory[]>([]);
  const [subcategories, setSubcategories] = useState<MedusaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetchCategories()
      .then((cats) => {
        // Only show parent categories in navbar (no parent_category_id)
        const parentCats = cats.filter((c) => !(c as any).parent_category_id && !(c as any).parent_id);
        setCategories(parentCats.slice(0, limit));
      })
      .catch((err: any) => setError(err.message || "Failed to load categories"))
      .finally(() => setLoading(false));
      
    if (categoryHandle) {
      fetchSubcategories(categoryHandle)
        .then(setSubcategories)
        .catch(() => setSubcategories([]));
    }
  }, [limit, categoryHandle]);

  return { categories, subcategories, loading, error };
}