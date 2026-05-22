const { Pool } = require('pg')

async function fixOrdersConstraint() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'idealprix',
  })

  const client = await pool.connect()
  try {
    console.log('Fixing orders status check constraint...')
    
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
      ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'));
    `)
    
    console.log('✅ Migration applied successfully!')
  } catch (err) {
    console.error('Migration failed:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

fixOrdersConstraint().catch(() => process.exit(1))