import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product-service'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const product = await productService.getProduct(id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

    const existing = await productService.getProduct(id)
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
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

      if (existing.image_url) {
        try {
          await unlink(path.join(process.cwd(), 'public', existing.image_url))
        } catch (e) {}
      }
    }

    const product = await productService.updateProduct(id, data)
    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await productService.deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}