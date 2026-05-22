const { Pool } = require('pg')

async function seedShippingProviders() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'idealprix',
  })

  const client = await pool.connect()
  try {
    console.log('Seeding shipping providers...')
    
    await client.query(`
      INSERT INTO shipping_providers (id, name, phone, price, service_type) 
      VALUES 
        (gen_random_uuid(), 'Aramex', '+216 71 123 456', 7000, 'standard'),
        (gen_random_uuid(), 'Express Delivery', '+216 71 987 654', 15000, 'express'),
        (gen_random_uuid(), 'Store Pickup', NULL, 0, 'pickup')
      ON CONFLICT DO NOTHING
    `)
    
    console.log('✅ Shipping providers seeded!')
  } catch (err) {
    console.error('Seed failed:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seedShippingProviders().catch(() => process.exit(1))