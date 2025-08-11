import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Message } from './message.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'app1_user',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mhylle_app1',
      entities: [Message],
      synchronize: true, // Only for development
    }),
    TypeOrmModule.forFeature([Message]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
