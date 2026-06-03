import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product-service'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'

async function checkAuth(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!['admin', 'manager', 'staff'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    }

    const products = await productService.listProducts(filters)
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const formData = await request.formData()
    const data: any = {}

    for (const [key, value] of formData.entries()) {
      if (key !== 'image') {
        const val = value as string
        if (val === '' || val === null) continue
        if (['price', 'compare_price', 'stock_quantity', 'low_stock_threshold'].includes(key)) {
          data[key] = parseFloat(val)
        } else if (['is_active', 'is_featured'].includes(key)) {
          data[key] = val === 'true'
        } else {
          data[key] = val
        }
      }
    }

    if (formData.get('image')) {
      const image = formData.get('image') as File
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
      await mkdir(uploadDir, { recursive: true })
      
      const filename = `${Date.now()}-${image.name}`
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      data.image_url = `/uploads/products/${filename}`
    }

    const product = await productService.createProduct(data)
    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 })
  }
}