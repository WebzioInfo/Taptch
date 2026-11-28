CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "ticket_number" varchar(32) NOT NULL UNIQUE,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "subject" varchar(255) NOT NULL,
  "category" varchar(64) DEFAULT 'general' NOT NULL,
  "priority" varchar(32) DEFAULT 'medium' NOT NULL,
  "status" varchar(32) DEFAULT 'open' NOT NULL,
  "assigned_to" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_support_tickets_status" ON "support_tickets" ("status");
CREATE INDEX IF NOT EXISTS "idx_support_tickets_user" ON "support_tickets" ("user_id");

CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
  "id" varchar(64) PRIMARY KEY NOT NULL,
  "ticket_id" varchar(64) NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
  "sender_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "sender_role" varchar(32) DEFAULT 'user' NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_support_ticket_messages_ticket" ON "support_ticket_messages" ("ticket_id");
