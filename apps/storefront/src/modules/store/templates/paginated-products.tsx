import { products } from "@lib/data/products";

const PRODUCT_LIMIT = 12;

export default function PaginatedProducts({
  page = 1,
}: {
  page?: number;
}) {
  const startIndex = (page - 1) * PRODUCT_LIMIT;
  const paginatedProducts = products.slice(startIndex, startIndex + PRODUCT_LIMIT);
  const totalPages = Math.ceil(products.length / PRODUCT_LIMIT);

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {paginatedProducts.map((p) => {
          return (
            <li key={p.id}>
              <a href={`/products/${p.handle}`}>{p.title}</a>
            </li>
          );
        })}
      </ul>
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded ${page === p ? "bg-[#D4302A] text-white" : "bg-gray-200"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </>
  );
}