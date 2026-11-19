const postgres = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL not found in backend/.env');
}
const sql = postgres(connectionString, { ssl: 'require', max: 1 });

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

  // 0015 NFC Ordering, Payments & Status History
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number varchar(32);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method varchar(32) DEFAULT 'razorpay' NOT NULL;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference varchar(128);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS profile_assistance_status varchar(32) DEFAULT 'NOT_REQUIRED' NOT NULL;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS profile_assistance_notes text;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal real DEFAULT 0 NOT NULL;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost real DEFAULT 0 NOT NULL;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount real DEFAULT 0 NOT NULL;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount real DEFAULT 0 NOT NULL;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency varchar(8) DEFAULT 'INR' NOT NULL;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name varchar(64);`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS internal_notes text;`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key varchar(128);`;

  await sql`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id varchar(64) PRIMARY KEY,
      order_id varchar(64) NOT NULL REFERENCES orders(id) ON DELETE cascade,
      status varchar(32) NOT NULL,
      title varchar(128) NOT NULL,
      description text,
      updated_by text DEFAULT 'system',
      created_at timestamp DEFAULT now() NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id varchar(64) PRIMARY KEY,
      order_id varchar(64) NOT NULL REFERENCES orders(id) ON DELETE cascade,
      user_id text NOT NULL REFERENCES users(id) ON DELETE cascade,
      payment_method varchar(32) NOT NULL,
      amount real NOT NULL,
      currency varchar(8) DEFAULT 'INR' NOT NULL,
      status varchar(32) DEFAULT 'PENDING' NOT NULL,
      gateway_order_id varchar(128),
      gateway_payment_id varchar(128),
      gateway_signature text,
      error_message text,
      metadata jsonb,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
  `;

  // 0019 Card Preview URLs
  await sql`ALTER TABLE card_designs ADD COLUMN IF NOT EXISTS preview_front_url text;`;
  await sql`ALTER TABLE card_designs ADD COLUMN IF NOT EXISTS preview_back_url text;`;
  await sql`UPDATE card_designs SET preview_front_url = preview_url WHERE preview_front_url IS NULL AND preview_url IS NOT NULL;`;
  await sql`UPDATE card_designs SET preview_back_url = back_preview_url WHERE preview_back_url IS NULL AND back_preview_url IS NOT NULL;`;

  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preview_front_url text;`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preview_back_url text;`;
  await sql`UPDATE order_items SET preview_front_url = design_preview_url WHERE preview_front_url IS NULL AND design_preview_url IS NOT NULL;`;
  await sql`UPDATE order_items SET preview_back_url = back_preview_url WHERE preview_back_url IS NULL AND back_preview_url IS NOT NULL;`;

  console.log('[MIGRATION] Tables & columns verified successfully!');
  await sql.end();
}

migrate().catch(console.error);

