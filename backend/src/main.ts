import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { webcrypto } from 'crypto';

// Make crypto available globally for TypeORM in Node.js 18+
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development and production
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://mhylle.com', 'https://www.mhylle.com', 'http://51.159.168.239:3001']
      : true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
  });

  // Health check endpoint (required for Docker health checks)
  app.use('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      application: 'App1 Backend',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 App1 Backend is running on port ${port}`);
  console.log(`🏥 Health Check: http://localhost:${port}/health`);
  console.log(`🐳 Container started successfully with Node.js ${process.version}`);
}
bootstrap();
