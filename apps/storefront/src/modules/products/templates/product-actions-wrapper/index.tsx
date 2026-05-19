import { fetchProductByHandle, normaliseProduct } from "@lib/data/backend-adapter"
import ProductActions from "@modules/products/components/product-actions"
import { useEffect, useState } from "react"

type Product = {
  id: string
  handle: string
  title: string
  price: number
  description?: string
}

export default function ProductActionsWrapper({ handle }: { handle: string }) {
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchProductByHandle(handle).then((p) => {
      if (p) setProduct(normaliseProduct(p))
    })
  }, [handle])

  if (!product) {
    return null
  }

  return <ProductActions product={product} />
}