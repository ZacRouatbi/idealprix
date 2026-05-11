import { products } from "@lib/data/products";

type RelatedProductsProps = {
  product: { id: string };
};

export default function RelatedProducts({ product }: RelatedProductsProps) {
  const relatedProducts = products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  if (!relatedProducts.length) {
    return null;
  }

  return (
    <div className="content-container py-12">
      <div className="flex flex-col items-center text-center mb-8">
        <span className="text-base-regular text-gray-600 mb-4">
          Related products
        </span>
        <p className="text-2xl-regular text-gray-800 max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {relatedProducts.map((p) => (
          <li key={p.id}>
            <a href={`/products/${p.handle}`}>{p.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}