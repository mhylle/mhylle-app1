import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World 1 from Backend!';
  }

  getInfo() {
    return {
      application: 'App1 - User Management System',
      version: '1.0.0',
      description: 'Backend API for App1',
      message: 'Hello World 1 from Backend!',
      features: [
        'User Management',
        'Authentication',
        'Profile Management',
        'Role-based Access Control'
      ],
      endpoints: {
        health: '/health',
        api: '/api/app1',
      },
      timestamp: new Date().toISOString()
    };
  }
}
