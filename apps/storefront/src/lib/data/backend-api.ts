/**
 * Backend API client for storefront
 * Connects to the backendnext API endpoints
 */

const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_API_URL

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: any
  token?: string
  headers?: Record<string, string>
}

async function apiClient<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', data, token, headers = {} } = options

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error ${response.status}`)
  }

  return response.json()
}

export { apiClient }

/* ─── Product Types ─── */
export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  compare_price?: number
  category_id?: string
  image_url?: string
  is_active: boolean
  stock_quantity: number
  sku?: string
  created_at: string
  updated_at: string
  category?: Category
}

export async function fetchProducts(params?: {
  limit?: number
  offset?: number
  search?: string
  category_id?: string
  slug?: string
  is_active?: boolean
}): Promise<{ data: Product[]; count: number; totalPages: number }> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.search) qs.set('search', params.search)
  if (params?.category_id) qs.set('category_id', params.category_id)
  if (params?.slug) qs.set('slug', params.slug)
  if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active))

  return apiClient<{ data: Product[]; count: number; totalPages: number }>(`/public/products?${qs.toString()}`)
}

export async function fetchProduct(id: string, token?: string): Promise<Product> {
  return apiClient(`/products/${id}`, { token })
}

/* ─── Category Types ─── */
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  image_url?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export async function fetchCategories(params?: {
  limit?: number
  offset?: number
  search?: string
  parent_id?: string
}): Promise<{ data: Category[]; count: number; totalPages: number }> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.search) qs.set('search', params.search || '')
  if (params?.parent_id) qs.set('parent_id', params.parent_id)

  return apiClient<{ data: Category[]; count: number; totalPages: number }>(`/public/categories?${qs.toString()}`)
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const categories = await fetchCategories({ search: slug })
    return categories.data.find(c => c.slug === slug) || null
  } catch {
    return null
  }
}

/* ─── Promotion Types ─── */
export interface ActivePromotion {
  id: string
  targetType: 'product' | 'category'
  targetId: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  startDate: string
  endDate: string
}

export async function fetchActivePromotions(): Promise<ActivePromotion[]> {
  try {
    const qs = new URLSearchParams({ is_active: 'true', limit: '200' })
    const result = await apiClient<{ data: ActivePromotion[] }>(`/public/promotions?${qs}`)
    // The public API already filters to currently running promotions
    return result.data ?? []
  } catch {
    return []
  }
}

/* ─── Shipping Types ─── */
export interface ShippingProvider {
  id: string
  name: string
  phone?: string
  price: number
  service_type: 'standard' | 'express' | 'pickup'
}

export async function fetchShippingProviders(): Promise<ShippingProvider[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/public/shipping`)
    if (!response.ok) throw new Error('Failed to fetch')
    const result = await response.json()
    return result.providers || []
  } catch {
    return []
  }
}

/* ─── Order Types ─── */
export interface OrderItem {
  id: string
  order_id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  product_image?: string
}

export interface Order {
  id: string
  order_number: string
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  subtotal?: number
  shipping_amount?: number
  promo_code?: string
  discount_amount?: number
  shipping_address?: {
    fullName: string
    address: string
    city: string
    postalCode: string
    countryCode: string
    phone?: string
  }
  created_at: string
  items?: OrderItem[]
}

export async function fetchOrders(token: string, params?: {
  limit?: number
  offset?: number
  status?: string
}): Promise<{ data: Order[]; count: number; totalPages: number }> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.status) qs.set('status', params.status)

  return apiClient(`/orders?${qs.toString()}`, { token })
}

/* ─── Auth ─── */
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: 'admin' | 'manager' | 'staff' | 'customer'
}

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  return apiClient('/auth', {
    method: 'POST',
    data: { email, password },
  })
}

export async function verifyAuth(token: string): Promise<{ user: User | null }> {
  return apiClient('/auth', {
    method: 'GET',
    token,
  })
}

export async function logout(): Promise<void> {
  return apiClient('/auth', { method: 'DELETE' })
}

export async function register(userData: {
  email: string
  password: string
  first_name: string
  last_name: string
}): Promise<{ user: User; token: string }> {
  return apiClient('/auth/register', {
    method: 'POST',
    data: userData,
  })
}

export async function updateCustomer(userData: {
  first_name: string
  last_name: string
  email: string
}): Promise<User> {
  return apiClient('/auth', {
    method: 'PUT',
    data: userData,
  })
}

export interface PaginatedOrdersResponse {
  data: Order[]
  count: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

export async function fetchCustomerOrders(
  token: string,
  params?: {
    limit?: number
    offset?: number
    status?: string
  }
): Promise<PaginatedOrdersResponse> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  if (params?.status) qs.set('status', params.status)

  return apiClient<PaginatedOrdersResponse>(
    `/orders/customer?${qs.toString()}`,
    { token }
  )
}