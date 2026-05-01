import 'dotenv/config';
import pool from '../config/database';

async function migrate() {
  try {
    console.log('Migrating chat_messages table...');
    // Terlebih dahulu, mari kita periksa kolom yang ada
    await pool.query(`
      ALTER TABLE chat_messages DROP COLUMN IF EXISTS order_id CASCADE;
      ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
      ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
      
      DROP INDEX IF EXISTS idx_chat_messages_order_id;
      DROP INDEX IF EXISTS idx_chat_messages_created;
      
      CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_seller_id ON chat_messages(seller_id);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(user_id, seller_id, created_at ASC);
    `);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}
migrate();