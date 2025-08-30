import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GameState } from './game-state.entity';

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
      
      // Migration 003: Multi-planet game state migration
      await this.runMigration003(queryRunner);
      
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
        author VARCHAR(100),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes
    // Note: user_id already has UNIQUE constraint above, so no additional index needed
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages("createdAt" DESC);`);

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

  private async runMigration003(queryRunner: any): Promise<void> {
    this.logger.log('Running migration 003: Multi-planet game state migration');
    
    // Check if migration has already been run
    const migrationExists = await this.checkMigrationExists(queryRunner, '003_multi_planet_game_state_migration');
    if (migrationExists) {
      this.logger.log('Migration 003 already applied, skipping...');
      return;
    }

    try {
      // Get all existing game states that need migration
      const gameStates = await queryRunner.query(`
        SELECT id, user_id, game_data 
        FROM game_states 
        WHERE (game_data->>'isMultiPlanet')::boolean IS NOT TRUE
          OR game_data->>'isMultiPlanet' IS NULL
      `);

      this.logger.log(`Found ${gameStates.length} game states to migrate`);

      let migrated = 0;
      let errors = 0;

      // Migrate each game state
      for (const gameState of gameStates) {
        try {
          const migratedData = this.migrateSingleToMultiPlanet(gameState.game_data);
          
          await queryRunner.query(`
            UPDATE game_states 
            SET game_data = $1, updated_at = NOW() 
            WHERE id = $2
          `, [JSON.stringify(migratedData), gameState.id]);
          
          migrated++;
          this.logger.log(`✓ Migrated game state for user: ${gameState.user_id}`);
        } catch (error) {
          errors++;
          this.logger.error(`✗ Failed to migrate user ${gameState.user_id}:`, error.message);
        }
      }

      // Record migration as completed
      await queryRunner.query(`
        INSERT INTO migrations (name) VALUES ('003_multi_planet_game_state_migration')
        ON CONFLICT (name) DO NOTHING;
      `);

      this.logger.log(`✅ Migration 003 completed: ${migrated} migrated, ${errors} errors`);
    } catch (error) {
      this.logger.error('❌ Migration 003 failed:', error);
      throw error;
    }
  }

  /**
   * Converts a single-planet game state to enhanced multi-planet structure
   */
  private migrateSingleToMultiPlanet(singlePlanetData: any): any {
    // Create the sweet planet from existing data
    const sweetPlanet = {
      id: 'sweet',
      type: 'sweet',
      name: 'Sweet Planet',
      unlocked: true,
      active: true,
      
      // Core game data
      candy: singlePlanetData.candy || 0,
      totalCandyEarned: singlePlanetData.totalCandyEarned || 0,
      clickPower: singlePlanetData.clickPower || 1,
      productionPerSecond: singlePlanetData.productionPerSecond || 0,
      
      // Upgrades
      upgrades: singlePlanetData.upgrades || {},
      unlockedUpgrades: singlePlanetData.unlockedUpgrades || [],
      
      // Sweet planet specific mechanics
      mechanics: {
        sweetnessLevel: 1,
        sugarRushActive: false,
        sugarRushEndTime: 0,
        sweetenessMultiplier: 1.0,
        candyMeltingRate: 0.1,
        flavorIntensity: 1.0,
        sweetenessAccumulation: 0
      },
      
      // UI state
      selectedBuilding: null,
      automationEnabled: true,
      
      // Statistics
      statistics: {
        totalClicks: singlePlanetData.totalClicks || 0,
        totalCandyProduced: singlePlanetData.totalCandyEarned || 0,
        totalUpgradesPurchased: Object.keys(singlePlanetData.upgrades || {}).length,
        averageClickPower: singlePlanetData.clickPower || 1,
        peakProductionRate: singlePlanetData.productionPerSecond || 0,
        timeSpent: singlePlanetData.totalPlayTime || 0
      }
    };

    // Create enhanced game state structure
    const enhancedGameState = {
      // Keep all original fields for backward compatibility
      ...singlePlanetData,
      
      // Multi-planet system fields
      planets: {
        sweet: sweetPlanet
      },
      currentPlanet: 'sweet',
      solarSystemLevel: 1,
      
      // Cross-planet systems (empty initially)
      crossPlanetRecipes: [],
      tradeRoutes: [],
      networkSynergy: 1.0,
      
      // Planet unlock progress (only Sweet unlocked)
      planetUnlockProgress: {
        sour: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            sweetCandyThreshold: { completed: false, progress: 0, target: 10000 },
            upgradesThreshold: { completed: false, progress: 0, target: 5 },
            achievementThreshold: { completed: false, progress: 0, target: 3 }
          }
        },
        cold: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            sourCandyThreshold: { completed: false, progress: 0, target: 50000 },
            crossPlanetRecipes: { completed: false, progress: 0, target: 2 },
            solarSystemLevel: { completed: false, progress: 0, target: 3 }
          }
        },
        spicy: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            coldCandyThreshold: { completed: false, progress: 0, target: 100000 },
            networkSynergy: { completed: false, progress: 0, target: 1.5 },
            tradeRoutes: { completed: false, progress: 0, target: 3 }
          }
        },
        bitter: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            spicyCandyThreshold: { completed: false, progress: 0, target: 250000 },
            crossPlanetAchievements: { completed: false, progress: 0, target: 5 },
            complexityPoints: { completed: false, progress: 0, target: 100 }
          }
        },
        fizzy: {
          unlockedRequirements: 0,
          totalRequirements: 3,
          requirements: {
            bitterCandyThreshold: { completed: false, progress: 0, target: 500000 },
            ultimateRecipes: { completed: false, progress: 0, target: 1 },
            cosmicHarmony: { completed: false, progress: 0, target: 1 }
          }
        }
      },
      
      // Migration metadata
      gameVersion: '2.0.0-multi-planet',
      isMultiPlanet: true,
      migrationDate: new Date().toISOString(),
      originalGameVersion: '1.0.0-single-planet'
    };

    return enhancedGameState;
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