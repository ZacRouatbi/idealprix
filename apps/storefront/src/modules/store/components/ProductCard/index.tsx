import { Link } from "react-router";
import { Product, formatPrice } from "@lib/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isOnSale = product.isPromo && product.originalPrice && product.originalPrice > product.price

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group block bg-white rounded-xl border border-[#E5E5E5] hover:shadow-md transition-shadow duration-200"
    >
      <div className="aspect-square bg-[#F9F8F7] rounded-t-xl overflow-hidden relative">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isOnSale && (
          <div className="absolute top-2 left-2 bg-[#D4302A] text-white text-xs font-bold px-2 py-0.5 rounded">
            -{product.discountPercent}%
          </div>
        )}
      </div>

      <div className="p-3">
        <h3
          className="text-sm font-medium text-[#1E1E1E] line-clamp-2 mb-2"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {product.title}
        </h3>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={`text-base font-bold ${isOnSale ? "text-[#D4302A]" : "text-[#1E1E1E]"}`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {formatPrice(product.price)}
          </span>
          {isOnSale && (
            <span className="text-xs text-[#717182] line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>

        {!product.inStock && (
          <span className="text-xs text-[#D4302A] font-medium mt-1 block">
            Rupture de stock
          </span>
        )}
      </div>
    </Link>
  );
}