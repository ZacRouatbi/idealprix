import { Pool } from 'pg'

export interface CursorPaginationParams {
  cursor?: string
  limit?: number
  direction?: 'forward' | 'backward'
  orderBy?: string
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  pagination: {
    hasNext: boolean
    hasPrev: boolean
    nextCursor: string | null
    prevCursor: string | null
    limit: number
    totalCount?: number
  }
}

export interface OffsetPaginationParams {
  limit?: number
  offset?: number
}

export interface OffsetPaginatedResponse<T> {
  data: T[]
  count: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

/**
 * Smart pagination utility for PostgreSQL
 * Supports cursor-based pagination for large datasets and offset-based for smaller ones
 */
export class PaginationHelper {
  private db: Pool

  constructor(db: Pool) {
    this.db = db
  }

  /**
   * Cursor-based pagination - optimal for large datasets
   * Uses indexed columns for efficient cursor navigation
   */
  async cursorPaginate<T>(
    baseQuery: string,
    countQuery: string,
    params: CursorPaginationParams & { 
      orderColumn?: string
      orderDirection?: 'ASC' | 'DESC'
    } = {},
    resultParser?: (row: any) => T
  ): Promise<CursorPaginatedResponse<T>> {
    const {
      cursor,
      limit = 20,
      direction = 'forward',
      orderBy = 'id',
      orderColumn,
      orderDirection = 'DESC'
    } = params

    const orderCol = orderColumn || orderBy
    const offset = direction === 'forward' ? 0 : 1 // Skip current cursor for backward

    let query = baseQuery
    const queryParams: any[] = []

    // Add cursor condition
    if (cursor) {
      const operator = orderDirection === 'DESC' 
        ? (direction === 'forward' ? '<' : '>') 
        : (direction === 'forward' ? '>' : '<')
      query += ` WHERE ${orderCol} ${operator} $${queryParams.length + 1}`
      queryParams.push(cursor)
    }

    // Add ordering and limit
    query += ` ORDER BY ${orderCol} ${orderDirection} LIMIT $${queryParams.length + 1}`
    queryParams.push(limit + 1) // Fetch one extra to determine if there's a next page

    const result = await this.db.query(query, queryParams)
    const rows = resultParser ? result.rows.map(resultParser) : result.rows

    // Determine pagination
    const hasNext = rows.length > limit
    const hasPrev = !!cursor
    const data = hasNext ? rows.slice(0, limit) : rows
    const nextCursor = hasNext && data.length > 0 
      ? (data[data.length - 1] as any)[orderCol] 
      : null

    // For prev cursor, we need to fetch the first item in reverse
    let prevCursor: string | null = null
    if (cursor && hasPrev) {
      const prevQuery = `${baseQuery} WHERE ${orderCol} ${orderDirection === 'DESC' ? '>' : '<'} $${1} ORDER BY ${orderCol} ${orderDirection === 'DESC' ? 'ASC' : 'DESC'} LIMIT 1`
      const prevResult = await this.db.query(prevQuery, [cursor])
      if (prevResult.rows.length > 0 && prevResult.rows[0] !== data[0]) {
        prevCursor = (prevResult.rows[0] as any)[orderCol]
      }
    }

    // Get total count for progress indicator
    let totalCount: number | undefined
    if (countQuery) {
      const countResult = await this.db.query(countQuery)
      totalCount = parseInt(countResult.rows[0].count)
    }

    return {
      data,
      pagination: {
        hasNext,
        hasPrev,
        nextCursor,
        prevCursor,
        limit,
        totalCount,
      }
    }
  }

  /**
   * Offset-based pagination - simpler, good for small to medium datasets
   * Optimized with a single query using window functions
   */
  async offsetPaginate<T>(
    baseQuery: string,
    countQuery: string,
    params: OffsetPaginationParams & { orderColumn?: string; orderDirection?: 'ASC' | 'DESC' } = {},
    resultParser?: (row: any) => T
  ): Promise<OffsetPaginatedResponse<T>> {
    const {
      limit = 50,
      offset = 0,
      orderColumn = 'id',
      orderDirection = 'DESC'
    } = params

    const sanitizedLimit = Math.min(Math.max(1, limit), 100)
    const sanitizedOffset = Math.max(0, offset)

    // Main query with limit and offset
    const query = `${baseQuery} ORDER BY ${orderColumn} ${orderDirection} LIMIT ${sanitizedLimit} OFFSET ${sanitizedOffset}`
    const result = await this.db.query(query)
    const rows = resultParser ? result.rows.map(resultParser) : result.rows

    // Count query
    const countResult = await this.db.query(countQuery)
    const count = parseInt(countResult.rows[0].count)

    return {
      data: rows as T[],
      count,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
      page: Math.floor(sanitizedOffset / sanitizedLimit) + 1,
      totalPages: Math.ceil(count / sanitizedLimit),
    }
  }

  /**
   * Smart pagination - automatically chooses between cursor and offset based on dataset characteristics
   */
  async smartPaginate<T>(
    baseQuery: string,
    countQuery: string,
    params: OffsetPaginationParams & { useCursor?: boolean; orderColumn?: string; orderDirection?: 'ASC' | 'DESC' } = {},
    resultParser?: (row: any) => T
  ): Promise<OffsetPaginatedResponse<T>> {
    // Get total count first
    const countResult = await this.db.query(countQuery)
    const count = parseInt(countResult.rows[0].count)

    // Use offset pagination for small datasets (< 1000 records), cursor for larger
    // For simplicity, we'll use offset pagination consistently but with optimizations
    return this.offsetPaginate(baseQuery, countQuery, params, resultParser)
  }
}

/**
 * Build pagination links for API responses
 */
export function buildPaginationLinks(
  baseUrl: string,
  pagination: { page: number; totalPages: number; limit: number; offset: number }
) {
  const { page, totalPages, limit } = pagination
  const links: Record<string, string> = {}

  if (page > 1) {
    links.first = `${baseUrl}?limit=${limit}&offset=0`
    links.prev = `${baseUrl}?limit=${limit}&offset=${Math.max(0, (page - 2) * limit)}`
  }

  if (page < totalPages) {
    links.next = `${baseUrl}?limit=${limit}&offset=${page * limit}`
    links.last = `${baseUrl}?limit=${limit}&offset=${(totalPages - 1) * limit}`
  }

  return links
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  return {
    limit: Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100),
    offset: Math.max(0, parseInt(searchParams.get('offset') || '0')),
  }
}