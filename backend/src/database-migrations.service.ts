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

    // Game states table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS game_states (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        game_data JSONB NOT NULL DEFAULT '{}',
        last_saved TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // User achievements table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
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
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_game_states_user_id ON game_states(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);`);

    // Record migration as completed
    await queryRunner.query(`
      INSERT INTO migrations (name) VALUES ('001_initial_tables')
      ON CONFLICT (name) DO NOTHING;
    `);

    this.logger.log('✅ Migration 001 completed successfully');
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