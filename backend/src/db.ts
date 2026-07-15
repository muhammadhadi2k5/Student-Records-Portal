import 'dotenv/config';
import { Pool, types } from 'pg';

// Postgres DATE columns have no time/timezone component. Without this, `pg`
// parses them into JS Date objects (midnight UTC), which is an easy source of
// off-by-one-day bugs once anything formats them in a local timezone. Keep
// them as the plain 'YYYY-MM-DD' string Postgres already sends.
types.setTypeParser(types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
