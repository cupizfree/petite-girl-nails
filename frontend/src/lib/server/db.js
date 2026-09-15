import pg from 'pg';
import { env } from '$env/dynamic/private';

const connectionString = env.DATABASE_URL || 'postgresql://postgres@localhost:5432/petite_girl_nails';

export const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

export const getPool = () => pool;

