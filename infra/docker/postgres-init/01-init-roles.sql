-- ====================================================================
-- TAPZIO DATABASE ROLES & PERMISSIONS INITIALIZATION
-- ====================================================================

-- 1. Create Migrator Role (Table Owner for Migrations & Seeds)
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tapzio_migrator') THEN
      CREATE ROLE tapzio_migrator WITH LOGIN PASSWORD 'tapzio_migrator_pass' CREATEDB;
   END IF;
END
$do$;

-- 2. Create Application Runtime Role (NO BYPASSRLS, NOT OWNER)
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tapzio_app') THEN
      CREATE ROLE tapzio_app WITH LOGIN PASSWORD 'tapzio_app_pass' NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
   END IF;
END
$do$;

-- 3. Configure Database Ownership & Schema Privileges
ALTER DATABASE tapzio_db OWNER TO tapzio_migrator;

\connect tapzio_db

GRANT ALL ON SCHEMA public TO tapzio_migrator;
GRANT USAGE ON SCHEMA public TO tapzio_app;

-- Grant future table privileges to tapzio_app when created by tapzio_migrator
ALTER DEFAULT PRIVILEGES FOR ROLE tapzio_migrator IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tapzio_app;

ALTER DEFAULT PRIVILEGES FOR ROLE tapzio_migrator IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO tapzio_app;

