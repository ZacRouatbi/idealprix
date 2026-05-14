import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { useProducts } from "@lib/hooks/use-products"
import { formatPrice } from "@lib/data/products"
import { Link } from "react-router"

const PRODUCT_LIMIT = 12

export default function PaginatedProducts({
  page = 1,
  sortBy,
  countryCode,
}: {
  page?: number
  sortBy?: SortOptions
  countryCode?: string
}) {
  const { products, loading } = useProducts({ limit: 100 })
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return a.price - b.price
      case "price_desc":
        return b.price - a.price
      case "created_at":
      default:
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
    }
  })
  const startIndex = (page - 1) * PRODUCT_LIMIT
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + PRODUCT_LIMIT)
  const totalPages = Math.ceil(sortedProducts.length / PRODUCT_LIMIT)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4302A]"></div>
      </div>
    )
  }

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {paginatedProducts.map((p) => (
          <li key={p.id}>
            <Link to={`/products/${p.handle}`} className="group block">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <h3 className="font-medium text-gray-900 line-clamp-2">{p.title}</h3>
              <p className="text-sm text-[#D4302A] font-semibold mt-1">
                {formatPrice(p.price)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded ${
                page === p ? "bg-[#D4302A] text-white" : "bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </>
  )
}