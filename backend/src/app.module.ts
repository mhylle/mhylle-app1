import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Message } from './message.entity';
import { GameState } from './game-state.entity';
import { UserAchievement } from './user-achievement.entity';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    TypeOrmModule.forFeature([Message, GameState, UserAchievement]),
    AuthModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseConfig],
})
export class AppModule {}
