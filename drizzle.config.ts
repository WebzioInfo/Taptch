import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL_DIRECT ||
      process.env.DATABASE_URL ||
      'postgres://tapzio_migrator:tapzio_migrator_pass@localhost:5432/tapzio_db?sslmode=disable',
  },
  verbose: true,
  strict: true,
});

