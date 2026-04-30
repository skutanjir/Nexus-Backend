import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import pool from '../config/database';

async function ensureDatabaseExists(): Promise<void> {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nexus_db';
  const dbName = connectionString.split('/').pop()?.split('?')[0] || 'nexus_db';
  
  // Connect to the default 'postgres' database to create the target DB
  const postgresUrl = connectionString.replace(`/${dbName}`, '/postgres');
  const client = new Client({ connectionString: postgresUrl });

  try {
    await client.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Error ensuring database exists:', err);
    throw err;
  } finally {
    await client.end();
  }
}

async function init(): Promise<void> {
  await ensureDatabaseExists();

  console.log('Initializing database schema...');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database initialized successfully!');
  await pool.end();
}

init().catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
