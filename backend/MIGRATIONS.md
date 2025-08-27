# Database Migrations

This application uses a custom migration system that runs automatically on startup.

## How It Works

- Migrations run automatically when the backend starts
- Each migration is tracked in the `migrations` table
- Migrations are idempotent - safe to run multiple times
- New migrations are added to `database-migrations.service.ts`

## Adding New Migrations

1. **Add a new method** to `DatabaseMigrationsService`:
   ```typescript
   private async runMigration002(queryRunner: any): Promise<void> {
     this.logger.log('Running migration 002: Add new table');
     
     const migrationExists = await this.checkMigrationExists(queryRunner, '002_add_new_table');
     if (migrationExists) {
       this.logger.log('Migration 002 already applied, skipping...');
       return;
     }

     // Your SQL changes here
     await queryRunner.query(`
       CREATE TABLE IF NOT EXISTS new_table (
         id SERIAL PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         created_at TIMESTAMP NOT NULL DEFAULT NOW()
       );
     `);

     // Record migration as completed
     await queryRunner.query(`
       INSERT INTO migrations (name) VALUES ('002_add_new_table')
       ON CONFLICT (name) DO NOTHING;
     `);

     this.logger.log('✅ Migration 002 completed successfully');
   }
   ```

2. **Call the migration** in the `runMigrations()` method:
   ```typescript
   // Migration 001: Initial tables
   await this.runMigration001(queryRunner);
   
   // Migration 002: Add new table
   await this.runMigration002(queryRunner);
   ```

## Migration Guidelines

- **Always use `IF NOT EXISTS`** for CREATE TABLE statements
- **Always use `IF NOT EXISTS`** for CREATE INDEX statements  
- **Use `ON CONFLICT DO NOTHING`** for INSERT statements
- **Check migration exists first** using `checkMigrationExists()`
- **Record completed migration** in the migrations table
- **Use descriptive migration names** like `001_initial_tables`

## Current Migrations

- `001_initial_tables` - Creates game_states, user_achievements, messages tables with indexes