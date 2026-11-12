const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL || 'postgresql://postgres:TaptchTAPH12@db.nvrcgauxafpxsaufjtha.supabase.co:5432/postgres?sslmode=require';
const sql = postgres(connectionString, { ssl: 'require' });

async function migrate() {
  console.log('[MIGRATION] Applying safe incremental schema updates...');
  
  await sql`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_user_id text;
  `;
  await sql`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS subject varchar(255);
  `;
  await sql`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS message text;
  `;
  await sql`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'NEW';
  `;
  await sql`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id varchar(64) PRIMARY KEY,
      category varchar(64) NOT NULL,
      title varchar(255) NOT NULL,
      amount integer NOT NULL,
      currency varchar(8) NOT NULL DEFAULT 'INR',
      incurred_at timestamp NOT NULL DEFAULT now(),
      recorded_by text NOT NULL,
      receipt_url text,
      notes text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id varchar(64) PRIMARY KEY,
      order_id varchar(64),
      user_id text,
      type varchar(32) NOT NULL,
      amount integer NOT NULL,
      currency varchar(8) NOT NULL DEFAULT 'INR',
      status varchar(32) NOT NULL DEFAULT 'settled',
      payment_method varchar(32) NOT NULL DEFAULT 'manual_offline',
      reference_number varchar(128),
      settled_at timestamp,
      notes text,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `;

  console.log('[MIGRATION] Tables & columns verified successfully!');
  await sql.end();
}

migrate().catch(console.error);
