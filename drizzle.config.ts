import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './backend/src/database/schema/index.ts',
  out: './backend/src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL_DIRECT ||
      process.env.DATABASE_URL ||
      'postgres://taptch_migrator:taptch_migrator_pass@localhost:5432/taptch_db?sslmode=disable',
  },
  verbose: true,
  strict: true,
});

