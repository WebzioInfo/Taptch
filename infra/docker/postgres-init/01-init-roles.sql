-- ====================================================================
-- TAPTCH DATABASE ROLES & PERMISSIONS INITIALIZATION
-- ====================================================================

-- 1. Create Migrator Roles (Table Owner for Migrations & Seeds)
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'taptch_migrator') THEN
      CREATE ROLE taptch_migrator WITH LOGIN PASSWORD 'taptch_migrator_pass' CREATEDB;
   END IF;
END
$do$;

-- 2. Create Application Runtime Roles (NO BYPASSRLS, NOT OWNER)
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'taptch_app') THEN
      CREATE ROLE taptch_app WITH LOGIN PASSWORD 'taptch_app_pass' NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
   END IF;
END
$do$;

-- 3. Configure Database Ownership & Schema Privileges
DO
$do$
BEGIN
   IF EXISTS (SELECT FROM pg_database WHERE datname = 'taptch_db') THEN
      ALTER DATABASE taptch_db OWNER TO taptch_migrator;
   END IF;
END
$do$;

GRANT ALL ON SCHEMA public TO taptch_migrator;
GRANT USAGE ON SCHEMA public TO taptch_app;

-- Grant future table privileges to taptch_app when created by taptch_migrator
ALTER DEFAULT PRIVILEGES FOR ROLE taptch_migrator IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO taptch_app;

ALTER DEFAULT PRIVILEGES FOR ROLE taptch_migrator IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO taptch_app;
