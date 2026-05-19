export * from "next"
export * from "next/navigation"
export * from "next/image"

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

export interface FilterParams {
  search?: string
  limit?: number
  offset?: number
  order?: "ASC" | "DESC"
  expand?: string[]
  fields?: string[]
}

export type OrderStatus = "pending" | "processing" | "paid" | "shipped" | "delivered" | "cancelled"
export type UserRole = "admin" | "manager" | "staff" | "customer"
export type ProductStatus = "draft" | "published" | "archived"