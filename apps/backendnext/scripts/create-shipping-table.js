const { Pool } = require('pg')

async function createShippingTable() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'idealprix',
  })

  const client = await pool.connect()
  try {
    console.log('Creating shipping_providers table...')
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipping_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        phone TEXT,
        price INTEGER NOT NULL,
        service_type TEXT NOT NULL CHECK (service_type IN ('standard', 'express', 'pickup')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    
    console.log('✅ Table created!')
  } catch (err) {
    console.error('Migration failed:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

createShippingTable().catch(() => process.exit(1))