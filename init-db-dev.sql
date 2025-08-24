-- Development Database Initialization
-- Matches production database setup patterns

-- Create users for app1 (matches production patterns)
CREATE USER app_app1 WITH ENCRYPTED PASSWORD 'dev_app1_password';

-- Create app1 database 
CREATE DATABASE app1_db OWNER app_app1;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE app1_db TO app_app1;

-- Switch to app1_db to set up extensions
\c app1_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO app_app1;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_app1;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_app1;