import { products } from "@lib/data/products";
import ProductActions from "@modules/products/components/product-actions";

/**
 * Displays product actions for a product by handle.
 */
export default function ProductActionsWrapper({ handle }: { handle: string }) {
  const product = products.find((p) => p.handle === handle);

  if (!product) {
    return null;
  }

  return <ProductActions product={product} />;
}