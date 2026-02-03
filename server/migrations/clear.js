import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'landgame',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function clearData() {
  try {
    console.log('🗑️  Clearing all game data...');

    const sql = fs.readFileSync(path.join(__dirname, 'clear_data.sql'), 'utf8');
    await pool.query(sql);

    console.log('✅ All game data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Clear failed:', error.message);
    process.exit(1);
  }
}

clearData();
