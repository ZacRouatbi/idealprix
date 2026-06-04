/**
 * Backendnext adapter - mirrors medusa.ts interface for easy migration
 * This file replaces the Medusa API dependency with the Next.js backend API
 */

import { fetchProducts as apiFetchProducts, fetchCategories as apiFetchCategories, fetchActivePromotions, Product, Category, ActivePromotion } from './backend-api'
import type { Product as StorefrontProduct } from './products'

/* ─── Types matching Medusa interface for compatibility ─── */
export interface MedusaProductVariant {
  id: string
  title: string
  sku?: string
  prices: { amount: number; currency_code: string }[]
  inventory_quantity?: number
  calculated_price?: { calculated_amount: number }
}

export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description?: string
  status: string
  thumbnail?: string
  images?: { url: string }[]
  variants: MedusaProductVariant[]
  categories?: MedusaCategory[]
  category_id?: string
  collection?: { id: string; title: string; handle: string }
  tags?: { id: string; value: string }[]
  metadata?: Record<string, unknown>
  created_at?: string
  price?: number
  compare_price?: number
}

export interface MedusaListResponse {
  products: MedusaProduct[]
  count: number
  offset: number
  limit: number
}

export interface MedusaCategory {
  id: string
  name: string
  handle: string
  description?: string
  image?: { url: string } | null
  parent_category_id?: string
  parent_id?: string
  parent?: MedusaCategory
  category_children?: MedusaCategory[]
}

export interface MedusaCategoriesResponse {
  product_categories: MedusaCategory[]
}

/* ─── Backend URL for constructing absolute image URLs ─── */
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_API_URL?.replace('/api', '') || 'http://localhost:3000'

/* ─── Placeholder image ─── */
const placeholderImage = 'https://via.placeholder.com/400x400?text=Produit'

/* ─── Helper to convert relative image URL to absolute ─── */
function toAbsoluteUrl(path: string): string {
  if (!path) return placeholderImage
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BACKEND_URL}${path}`
}

/* ─── Fetch helpers ─── */
export async function fetchProducts(params: {
  limit?: number
  offset?: number
  category_handle?: string | string[]
  category_id?: string | string[]
  handle?: string | string[]
  search?: string
} = {}): Promise<MedusaListResponse> {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  if (params.handle) {
    const handles = Array.isArray(params.handle) ? params.handle : [params.handle]
    for (const h of handles) qs.append('handle[]', h)
  }

  const [response, promotions] = await Promise.all([
    apiFetchProducts({
      limit: params.limit,
      offset: params.offset,
      category_id: typeof params.category_id === 'string' ? params.category_id : params.category_id?.join(','),
      search: params.search,
    }),
    fetchActivePromotions(),
  ])

  // Build a lookup: productId → best promotion, categoryId → best promotion
  const promoByProduct = new Map<string, ActivePromotion>()
  const promoByCategory = new Map<string, ActivePromotion>()
  for (const promo of promotions) {
    if (promo.targetType === 'product') {
      const existing = promoByProduct.get(promo.targetId)
      if (!existing || promo.discountValue > existing.discountValue) {
        promoByProduct.set(promo.targetId, promo)
      }
    } else if (promo.targetType === 'category') {
      const existing = promoByCategory.get(promo.targetId)
      if (!existing || promo.discountValue > existing.discountValue) {
        promoByCategory.set(promo.targetId, promo)
      }
    }
  }

// Transform backend products to Medusa-like format
   const medusaProducts = response.data.map(p => {
     // Determine best applicable promotion (product-level wins over category-level)
     // Use p.category_id or fall back to p.category?.id for category-level promo matching
     const effectiveCategoryId = p.category_id ?? p.category?.id
     const promo = promoByProduct.get(p.id) ?? (effectiveCategoryId ? promoByCategory.get(effectiveCategoryId) : undefined)
     const basePrice = p.price ?? 0
     let salePrice: number | undefined
     if (promo && basePrice > 0) {
       salePrice = promo.discountType === 'percentage'
         ? Math.round(basePrice * (1 - promo.discountValue / 100))
         : Math.max(0, basePrice - promo.discountValue)
     }
     const comparePrice = salePrice !== undefined ? basePrice : (p.compare_price ?? basePrice)
     if (process.env.NODE_ENV === 'development') {
       if (promo) {
         console.debug('[backend-adapter] Product', p.id, 'has promo:', { promo, basePrice, salePrice, comparePrice })
       }
     }
     return {
        id: p.id,
        title: p.name,
        handle: p.slug,
        description: p.description,
        status: p.is_active ? 'published' : 'draft',
        thumbnail: toAbsoluteUrl(p.image_url),
        images: p.image_url ? [{ url: toAbsoluteUrl(p.image_url) }] : [{ url: placeholderImage }],
        variants: basePrice ? [{
          id: p.id,
          title: 'Default',
          prices: [{ amount: basePrice, currency_code: 'TND' }],
          calculated_price: salePrice !== undefined ? { calculated_amount: salePrice } : undefined,
          inventory_quantity: p.stock_quantity,
        }] : [],
        categories: p.category ? [{
          id: p.category.id,
          name: p.category.name,
          handle: p.category.slug,
        }] : [],
        category_id: effectiveCategoryId,
        collection: undefined,
        tags: [],
        metadata: {},
        created_at: p.created_at,
        price: salePrice ?? basePrice,
        compare_price: comparePrice,
       }
    })

  return {
    products: medusaProducts,
    count: response.count,
    offset: params.offset || 0,
    limit: params.limit || 50,
  }
}

export async function fetchProductByHandle(handle: string): Promise<MedusaProduct | null> {
  try {
    const [response, promotions] = await Promise.all([
      apiFetchProducts({ slug: handle }),
      fetchActivePromotions(),
    ])
    const product = response.data[0]
    if (!product) return null

    // Build promotion lookup for consistency with fetchProducts
    const promoByProduct = new Map<string, ActivePromotion>()
    const promoByCategory = new Map<string, ActivePromotion>()
    for (const promo of promotions) {
      if (promo.targetType === 'product') {
        promoByProduct.set(promo.targetId, promo)
      } else if (promo.targetType === 'category') {
        const existing = promoByCategory.get(promo.targetId)
        if (!existing || promo.discountValue > existing.discountValue) {
          promoByCategory.set(promo.targetId, promo)
        }
      }
    }
    
    // Determine best applicable promotion (product-level wins over category-level)
    const effectiveCategoryId = product.category_id ?? product.category?.id
    const promo = promoByProduct.get(product.id) ?? (effectiveCategoryId ? promoByCategory.get(effectiveCategoryId) : undefined)
    const basePrice = product.price ?? 0
    let salePrice: number | undefined
    if (promo && basePrice > 0) {
      salePrice = promo.discountType === 'percentage'
        ? Math.round(basePrice * (1 - promo.discountValue / 100))
        : Math.max(0, basePrice - promo.discountValue)
    }

  return {
    id: product.id,
    title: product.name,
    handle: product.slug,
    description: product.description,
    status: product.is_active ? 'published' : 'draft',
    thumbnail: toAbsoluteUrl(product.image_url),
    images: product.image_url ? [{ url: toAbsoluteUrl(product.image_url) }] : [{ url: placeholderImage }],
    variants: basePrice ? [{
      id: product.id,
      title: 'Default',
      prices: [{ amount: basePrice, currency_code: 'TND' }],
      calculated_price: salePrice !== undefined ? { calculated_amount: salePrice } : undefined,
      inventory_quantity: product.stock_quantity,
    }] : [],
    categories: product.category ? [{
      id: product.category.id,
      name: product.category.name,
      handle: product.category.slug,
    }] : [],
    category_id: effectiveCategoryId,
    collection: undefined,
    tags: [],
    metadata: {},
    created_at: product.created_at,
    price: salePrice ?? basePrice,
    compare_price: salePrice !== undefined ? basePrice : (product.compare_price ?? basePrice),
  }
  } catch {
    return null
  }
}


export async function fetchCategories(): Promise<MedusaCategory[]> {
  try {
    const response = await apiFetchCategories({ limit: 100 })
    
    const allCategories = response.data
    
    // Transform backend categories to Medusa format and build hierarchy
    const categoryMap = new Map<string, MedusaCategory & { category_children?: MedusaCategory[] }>()
    allCategories.forEach(c => {
      categoryMap.set(c.id, {
        id: c.id,
        name: c.name,
        handle: c.slug,
        description: c.description,
        parent_category_id: c.parent_id,
        parent_id: c.parent_id,
        image: c.image_url ? { url: toAbsoluteUrl(c.image_url) } : null,
        category_children: []
      })
    })

    const rootCategories: MedusaCategory[] = []
    categoryMap.forEach(cat => {
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        const parent = categoryMap.get(cat.parent_id)!
        parent.category_children!.push(cat)
      } else {
        rootCategories.push(cat)
      }
    })

    return rootCategories
  } catch {
    return []
  }
}

export async function fetchSubcategories(categoryHandle: string): Promise<MedusaCategory[]> {
  const allCategories = await fetchCategories()
  const parentCat = allCategories.find(c => c.handle === categoryHandle)
  if (!parentCat) return []
  
  // Get all categories and filter by parent_id
  const { data: flatCategories } = await apiFetchCategories({ limit: 100 })
  // Transform to Medusa format
  return flatCategories
    .filter(c => c.parent_id === parentCat.id)
    .map(c => ({
      id: c.id,
      name: c.name,
      handle: c.slug,
      description: c.description,
      parent_category_id: c.parent_id,
      parent_id: c.parent_id,
      image: c.image_url ? { url: toAbsoluteUrl(c.image_url) } : null,
    }))
}

/* ─── Normaliser: backend Product → storefront Product ── */
export function normaliseProduct(p: MedusaProduct): StorefrontProduct {
  const firstVariant = p.variants?.[0]
  const firstPrice = firstVariant?.prices?.[0]?.amount ?? p.price ?? 0
  const calculatedPrice = firstVariant?.calculated_price?.calculated_amount ?? firstPrice
  const comparePrice = p.compare_price ?? firstPrice
  const thumbnail = p.thumbnail || p.images?.[0]?.url || ""
  const allImages = p.images?.map((i) => i.url).filter(Boolean) ?? (thumbnail ? [thumbnail] : [])
  
  // Determine main category and subcategory
  const cats = p.categories || []
  const category = cats[0]?.name ?? p.collection?.title ?? "Général"

  const inStock =
    firstVariant?.inventory_quantity === undefined ||
    (firstVariant?.inventory_quantity ?? 1) > 0

  const isPromo = calculatedPrice < comparePrice
  const discountPercent = calculatedPrice < comparePrice && comparePrice > 0
    ? Math.round(((comparePrice - calculatedPrice) / comparePrice) * 100)
    : undefined

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    price: calculatedPrice,
    originalPrice: calculatedPrice < comparePrice ? comparePrice : undefined,
    discountPercent,
    image: thumbnail,
    images: allImages.length > 0 ? allImages : [thumbnail],
    category,
    subcategory: undefined,
    brand: (p.metadata?.brand as string) ?? p.collection?.title ?? "",
    inStock,
    description: p.description ?? "",
    isPromo,
    variant_id: firstVariant?.id,
variants: p.variants?.map((v) => ({
        id: v.id,
        title: v.title,
        price: v.calculated_price?.calculated_amount ?? v.prices?.[0]?.amount ?? comparePrice,
        inventory_quantity: v.inventory_quantity,
      })) ?? [],
    createdAt: p.created_at,
  } 
}
/* ─── Fetch only promoted products ─── */
export async function fetchPromoProducts(limit: number = 4): Promise<MedusaProduct[]> {
  try {
    // Get active promotions and all products in parallel
    const [promotions, allProductsResponse] = await Promise.all([
      fetchActivePromotions(),
      apiFetchProducts({ limit: 5000, is_active: true }) // Fetch all active products
    ])

    if (!promotions.length || !allProductsResponse.data.length) {
      return []
    }

    // Build maps for quick lookup
    const promoByProduct = new Map<string, ActivePromotion>()
    const promoByCategory = new Map<string, ActivePromotion>()

    for (const promo of promotions) {
      if (promo.targetType === 'product') {
        promoByProduct.set(promo.targetId, promo)
      } else if (promo.targetType === 'category') {
        const existing = promoByCategory.get(promo.targetId)
        if (!existing || promo.discountValue > existing.discountValue) {
          promoByCategory.set(promo.targetId, promo)
        }
      }
    }

    // Filter and transform promoted products
    const promoProducts = allProductsResponse.data
      .filter(p => {
        const effectiveCategoryId = p.category_id ?? p.category?.id
        return promoByProduct.has(p.id) || (effectiveCategoryId ? promoByCategory.has(effectiveCategoryId) : false)
      })
      .slice(0, limit)
      .map(p => {
        const effectiveCategoryId = p.category_id ?? p.category?.id
        const promo = promoByProduct.get(p.id) ?? (effectiveCategoryId ? promoByCategory.get(effectiveCategoryId) : undefined)
        const basePrice = p.price ?? 0
        let salePrice: number | undefined
        if (promo && basePrice > 0) {
          salePrice = promo.discountType === 'percentage'
            ? Math.round(basePrice * (1 - promo.discountValue / 100))
            : Math.max(0, basePrice - promo.discountValue)
        }
        const comparePrice = salePrice !== undefined ? basePrice : (p.compare_price ?? basePrice)

        return {
          id: p.id,
          title: p.name,
          handle: p.slug,
          description: p.description,
          status: p.is_active ? 'published' : 'draft',
          thumbnail: toAbsoluteUrl(p.image_url),
          images: p.image_url ? [{ url: toAbsoluteUrl(p.image_url) }] : [{ url: placeholderImage }],
          variants: basePrice ? [{
            id: p.id,
            title: 'Default',
            prices: [{ amount: basePrice, currency_code: 'TND' }],
            calculated_price: salePrice !== undefined ? { calculated_amount: salePrice } : undefined,
            inventory_quantity: p.stock_quantity,
          }] : [],
          categories: p.category ? [{
            id: p.category.id,
            name: p.category.name,
            handle: p.category.slug,
          }] : [],
          category_id: effectiveCategoryId,
          collection: undefined,
          tags: [],
          metadata: {},
          created_at: p.created_at,
          price: salePrice ?? basePrice,
          compare_price: comparePrice,
        }
      })

    return promoProducts
  } catch (error) {
    console.error('Error fetching promo products:', error)
    return []
  }
}