import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.ts';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
    console.error("DATABASE_URL is not set");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
