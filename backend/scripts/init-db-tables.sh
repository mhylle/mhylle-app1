#!/bin/bash

# Script to initialize database tables for app1
# This should be run once on the server to create the tables

echo "Initializing app1 database tables..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the SQL script using the postgres container
docker exec -i mhylle-postgres psql -U app_app1 -d app1_db < "$SCRIPT_DIR/../database/create-tables.sql"

if [ $? -eq 0 ]; then
    echo "Database tables created successfully!"
else
    echo "Failed to create database tables"
    exit 1
fi