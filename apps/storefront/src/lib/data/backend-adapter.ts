/**
 * Backendnext adapter - mirrors medusa.ts interface for easy migration
 * This file replaces the Medusa API dependency with the Next.js backend API
 */

import { fetchProducts as apiFetchProducts, fetchCategories as apiFetchCategories, Product, Category } from './backend-api'
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
} = {}): Promise<MedusaListResponse> {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  if (params.handle) {
    const handles = Array.isArray(params.handle) ? params.handle : [params.handle]
    for (const h of handles) qs.append('handle[]', h)
  }

  const response = await apiFetchProducts({
    limit: params.limit,
    offset: params.offset,
    category_id: typeof params.category_id === 'string' ? params.category_id : params.category_id?.[0] || undefined,
    search: params.handle ? undefined : undefined,
  })

  // Transform backend products to Medusa-like format
  const medusaProducts = response.data.map(p => ({
     id: p.id,
     title: p.name,
     handle: p.slug,
     description: p.description,
     status: p.is_active ? 'published' : 'draft',
     thumbnail: toAbsoluteUrl(p.image_url),
     images: p.image_url ? [{ url: toAbsoluteUrl(p.image_url) }] : [{ url: placeholderImage }],
     variants: p.price ? [{
       id: p.id,
       title: 'Default',
       prices: [{ amount: p.price, currency_code: 'TND' }],
       inventory_quantity: p.stock_quantity,
     }] : [],
     categories: p.category ? [{
       id: p.category.id,
       name: p.category.name,
       handle: p.category.slug,
     }] : [],
     collection: undefined,
     tags: [],
     metadata: {},
     created_at: p.created_at,
     price: p.price,
     compare_price: p.compare_price,
   }))

  return {
    products: medusaProducts,
    count: response.count,
    offset: params.offset || 0,
    limit: params.limit || 50,
  }
}

export async function fetchProductByHandle(handle: string): Promise<MedusaProduct | null> {
  try {
    const response = await apiFetchProducts({ slug: handle })
    const product = response.data[0]
    if (!product) return null

  return {
    id: product.id,
    title: product.name,
    handle: product.slug,
    description: product.description,
    status: product.is_active ? 'published' : 'draft',
    thumbnail: toAbsoluteUrl(product.image_url),
    images: product.image_url ? [{ url: toAbsoluteUrl(product.image_url) }] : [{ url: placeholderImage }],
    variants: product.price ? [{
      id: product.id,
      title: 'Default',
      prices: [{ amount: product.price, currency_code: 'TND' }],
      inventory_quantity: product.stock_quantity,
    }] : [],
    categories: product.category ? [{
      id: product.category.id,
      name: product.category.name,
      handle: product.category.slug,
    }] : [],
    collection: undefined,
    tags: [],
    metadata: {},
    created_at: product.created_at,
    price: product.price,
    compare_price: product.compare_price,
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
  const thumbnail = p.thumbnail || p.images?.[0]?.url || ""
  const allImages = p.images?.map((i) => i.url).filter(Boolean) ?? (thumbnail ? [thumbnail] : [])
  
  // Determine main category and subcategory
  const cats = p.categories || []
  const category = cats[0]?.name ?? p.collection?.title ?? "Général"

  const inStock =
    firstVariant?.inventory_quantity === undefined ||
    (firstVariant?.inventory_quantity ?? 1) > 0

  const metaIsPromo = Boolean(p.metadata?.is_promo)
  const tagIsPromo = Boolean(p.tags?.some((t) => t.value === "promo"))
  const isPromo = metaIsPromo || tagIsPromo || calculatedPrice < firstPrice
  const discountPercent = calculatedPrice < firstPrice && firstPrice > 0
    ? Math.round(((firstPrice - calculatedPrice) / firstPrice) * 100)
    : undefined

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    price: calculatedPrice,
    originalPrice: calculatedPrice < firstPrice ? firstPrice : undefined,
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
      price: v.prices?.[0]?.amount ?? firstPrice,
    })) ?? [],
    createdAt: p.created_at,
  }
}