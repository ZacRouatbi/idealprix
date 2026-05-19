const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Brandbox',
  database: process.env.DB_NAME || 'idealprix',
})

async function testConnection() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT NOW() as time')
    console.log('Database connected:', result.rows[0].time)
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '))
  } finally {
    client.release()
    await pool.end()
  }
}

testConnection().catch(err => {
  console.error('Connection failed:', err.message)
  process.exit(1)
})