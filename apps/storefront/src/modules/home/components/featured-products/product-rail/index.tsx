import { useProducts } from "@lib/hooks/use-products"

export default function ProductRail({
  collection,
}: {
  collection: { title: string; handle: string; id: string }
}) {
  const { products } = useProducts({ limit: 4 })

  if (!products.length) {
    return null
  }

  return (
    <div className="content-container py-12 small:py-24">
      <div className="flex justify-between mb-8">
        <h2 className="text-xl font-semibold text-gray-900">{collection.title}</h2>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-24 small:gap-y-36">
        {products.map((product) => (
          <li key={product.id}>
            <a
              href={`/products/${product.handle}`}
              className="text-gray-700 hover:text-[#D4302A]"
            >
              {product.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}