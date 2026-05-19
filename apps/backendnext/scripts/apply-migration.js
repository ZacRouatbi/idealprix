const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'idealprix',
})

  const client = await pool.connect()
  try {
    console.log('Applying security migration...')
    
    // Add failed_login_attempts and locked_until columns to users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;
    `)
    console.log('✓ Added security columns to users table')
    
    // Create sessions table for secure session management
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP NULL
      );
    `)
    console.log('✓ Created sessions table')
    
    // Create indexes for sessions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    `)
    console.log('✓ Created sessions indexes')
    
    // Create audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        table_name TEXT,
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ Created audit_logs table')
    
    // Create indexes for audit_logs
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `)
    console.log('✓ Created audit_logs indexes')
    
    // Add created_by and updated_by to products
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
    `)
    console.log('✓ Added audit columns to products table')
    
    // Add created_by and updated_by to categories
    await client.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
    `)
    console.log('✓ Added audit columns to categories table')
    
    await client.query('COMMIT')
    console.log('\n✅ Migration applied successfully!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

applyMigration().catch(() => process.exit(1))