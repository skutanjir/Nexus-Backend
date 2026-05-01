require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexus_db'
});

async function run() {
  try {
    console.log('Running schema update...');
    await pool.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
      ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS seller_reply TEXT;
    `);
    console.log('Schema updated successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
run();
