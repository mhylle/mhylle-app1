-- Create databases if not exists
SELECT 'CREATE DATABASE app1_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'app1_db')\gexec

SELECT 'CREATE DATABASE auth_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

-- Connect to app1_db
\c app1_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE app1_db TO app1_user;
GRANT ALL ON SCHEMA public TO app1_user;

-- Connect to auth_db
\c auth_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO app1_user;
GRANT ALL ON SCHEMA public TO app1_user;