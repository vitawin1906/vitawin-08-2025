// infra/db.ts
import 'dotenv/config';             // грузим .env сразу, без лишних импортов
import './pg-types.js';             // твои кастомные pg-типы (оставляем)
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// Если DATABASE_URL не задан — используем fallback (НО лучше держать в .env)
const FALLBACK_URL =
    'postgresql://neondb_owner:npg_iOdB2j1aJWeG@ep-damp-field-ab1az6n6-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

// ВАЖНО: тут именно ??, а не |
const connectionString = process.env.DATABASE_URL ?? FALLBACK_URL;

const needSsl =
    !connectionString.includes('localhost') &&
    !connectionString.includes('127.0.0.1');

const pool = new Pool({
    connectionString,
    ssl: needSsl ? { rejectUnauthorized: false } : undefined,
});

// ЕДИНСТВЕННАЯ инициализация drizzle
export const db = drizzle(pool);

