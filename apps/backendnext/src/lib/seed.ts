import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'idealprix',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

async function seed() {
  console.log('Seeding database...')

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const hashedPassword = await bcrypt.hash('Idealprix2024!', 10)

    await client.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [uuidv4(), 'admin@idealprix.tn', hashedPassword, 'Admin', 'Idealprix', 'admin', true]
    )

    const categories = [
      { id: uuidv4(), name: 'Electronics', slug: 'electronics' },
      { id: uuidv4(), name: 'Clothing', slug: 'clothing' },
      { id: uuidv4(), name: 'Home & Garden', slug: 'home-garden' },
      { id: uuidv4(), name: 'Sports', slug: 'sports' },
    ]

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, name, slug, is_active)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO NOTHING`,
        [cat.id, cat.name, cat.slug, true]
      )
    }

    const electronicsId = categories[0].id

    const products = [
      { id: uuidv4(), name: 'Smartphone X', price: 899.99, category_id: electronicsId, stock: 50 },
      { id: uuidv4(), name: 'Laptop Pro', price: 1299.99, category_id: electronicsId, stock: 30 },
      { id: uuidv4(), name: 'Wireless Headphones', price: 199.99, category_id: electronicsId, stock: 100 },
    ]

    for (const product of products) {
      await client.query(
        `INSERT INTO products (id, name, slug, description, price, category_id, stock_quantity, sku, low_stock_threshold)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          product.id,
          product.name,
          product.name.toLowerCase().replace(/\s+/g, '-'),
          `High-quality ${product.name.toLowerCase()}`,
          product.price,
          product.category_id,
          product.stock,
          `SKU-${product.id.slice(0, 8)}`,
          10,
        ]
      )

      await client.query(
        `INSERT INTO inventory (id, product_id, quantity) VALUES ($1, $2, $3)`,
        [uuidv4(), product.id, product.stock]
      )
    }

    // Insert sample promotions
    const promos = [
      { targetType: 'product', targetId: products[0].id, targetName: 'Smartphone X', discountType: 'percentage', discountValue: 15, startDate: '2026-06-01', endDate: '2026-06-30', isActive: true },
      { targetType: 'category', targetId: electronicsId, targetName: 'Electronics', discountType: 'fixed', discountValue: 5000, startDate: '2026-05-15', endDate: '2026-05-31', isActive: true },
      { targetType: 'product', targetId: products[1].id, targetName: 'Laptop Pro', discountType: 'percentage', discountValue: 10, startDate: '2026-06-10', endDate: '2026-07-10', isActive: false },
    ]

    for (const promo of promos) {
      await client.query(
        `INSERT INTO promotions (id, target_type, target_id, target_name, discount_type, discount_value, start_date, end_date, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [uuidv4(), promo.targetType, promo.targetId, promo.targetName, promo.discountType, promo.discountValue, promo.startDate, promo.endDate, promo.isActive]
      )
    }

    // Insert sample promo codes
    const promoCodes = [
      { code: 'SUMMER2026', discountType: 'percentage', discountValue: 15, startDate: '2026-06-01', endDate: '2026-06-30', minOrderValue: 10000, usageLimit: 100, usedCount: 23, isActive: true },
      { code: 'WELCOME5000', discountType: 'fixed', discountValue: 5000, startDate: '2026-05-01', endDate: '2026-05-31', minOrderValue: 0, usageLimit: 50, usedCount: 50, isActive: false },
    ]

    for (const pc of promoCodes) {
      await client.query(
        `INSERT INTO promo_codes (id, code, discount_type, discount_value, start_date, end_date, min_order_value, usage_limit, used_count, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [uuidv4(), pc.code, pc.discountType, pc.discountValue, pc.startDate, pc.endDate, pc.minOrderValue, pc.usageLimit, pc.usedCount, pc.isActive]
      )
    }

    await client.query('COMMIT')
    console.log('Database seeded successfully!')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Seeding failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

// seed()
