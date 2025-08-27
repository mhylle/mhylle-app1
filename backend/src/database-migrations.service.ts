import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseMigrationsService {
  private readonly logger = new Logger(DatabaseMigrationsService.name);

  constructor(private readonly dataSource: DataSource) {}

  async runMigrations(): Promise<void> {
    this.logger.log('🗄️ Running database migrations...');
    
    try {
      // Get the database connection
      const queryRunner = this.dataSource.createQueryRunner();
      
      // Migration 001: Initial tables
      await this.runMigration001(queryRunner);
      
      // Migration 002: Fix game_states unique constraint
      await this.runMigration002(queryRunner);
      
      await queryRunner.release();
      
      this.logger.log('✅ All database migrations completed successfully');
    } catch (error) {
      this.logger.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  private async runMigration001(queryRunner: any): Promise<void> {
    this.logger.log('Running migration 001: Initial tables');
    
    // Check if migration has already been run
    const migrationExists = await this.checkMigrationExists(queryRunner, '001_initial_tables');
    if (migrationExists) {
      this.logger.log('Migration 001 already applied, skipping...');
      return;
    }

    // Create migrations table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Game states table - matches existing UUID schema
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS game_states (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        game_data JSONB NOT NULL DEFAULT '{}',
        last_saved TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // User achievements table - matches expected UUID schema  
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        achievement_id VARCHAR(255) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );
    `);

    // Messages table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        content VARCHAR(500) NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes
    // Note: user_id already has UNIQUE constraint above, so no additional index needed
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);`);

    // Record migration as completed
    await queryRunner.query(`
      INSERT INTO migrations (name) VALUES ('001_initial_tables')
      ON CONFLICT (name) DO NOTHING;
    `);

    this.logger.log('✅ Migration 001 completed successfully');
  }

  private async runMigration002(queryRunner: any): Promise<void> {
    this.logger.log('Running migration 002: Fix game_states unique constraint');
    
    // Check if migration has already been run
    const migrationExists = await this.checkMigrationExists(queryRunner, '002_fix_game_states_unique_constraint');
    if (migrationExists) {
      this.logger.log('Migration 002 already applied, skipping...');
      return;
    }

    try {
      // Check if the old index exists and drop it
      const indexExists = await queryRunner.query(`
        SELECT COUNT(*) as count FROM pg_indexes 
        WHERE tablename = 'game_states' AND indexname = 'idx_game_states_user_id'
      `);
      
      if (parseInt(indexExists[0].count) > 0) {
        this.logger.log('Dropping old idx_game_states_user_id index...');
        await queryRunner.query(`DROP INDEX IF EXISTS idx_game_states_user_id;`);
      }

      // Check if unique constraint already exists
      const constraintExists = await queryRunner.query(`
        SELECT COUNT(*) as count FROM information_schema.table_constraints 
        WHERE constraint_type = 'UNIQUE' 
        AND table_name = 'game_states' 
        AND constraint_name = 'uk_game_states_user_id'
      `);

      if (parseInt(constraintExists[0].count) === 0) {
        this.logger.log('Adding unique constraint on user_id...');
        await queryRunner.query(`ALTER TABLE game_states ADD CONSTRAINT uk_game_states_user_id UNIQUE (user_id);`);
      } else {
        this.logger.log('Unique constraint already exists, skipping...');
      }

      // Record migration as completed
      await queryRunner.query(`
        INSERT INTO migrations (name) VALUES ('002_fix_game_states_unique_constraint')
        ON CONFLICT (name) DO NOTHING;
      `);

      this.logger.log('✅ Migration 002 completed successfully');
    } catch (error) {
      this.logger.error('❌ Migration 002 failed:', error);
      throw error;
    }
  }

  private async checkMigrationExists(queryRunner: any, migrationName: string): Promise<boolean> {
    try {
      const result = await queryRunner.query(
        'SELECT COUNT(*) as count FROM migrations WHERE name = $1',
        [migrationName]
      );
      return parseInt(result[0].count) > 0;
    } catch (error) {
      // If migrations table doesn't exist, migration hasn't been run
      return false;
    }
  }
}