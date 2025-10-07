import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// The Pool will use connection information from your .env file
const pool = new Pool();

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};