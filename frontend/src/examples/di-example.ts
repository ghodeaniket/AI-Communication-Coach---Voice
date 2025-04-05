/**
 * Example demonstrating Dependency Injection usage in the Voice Coach application
 */

import 'reflect-metadata';
import container, { Injectable, ServiceLifetime } from '../di-container';
import { initializeContainer } from '../services/ServiceRegistry';

// Example services with dependencies
interface ILogger {
  log(message: string): void;
}

interface IMailService {
  sendMail(to: string, subject: string, body: string): Promise<boolean>;
}

interface IUserService {
  getUserEmail(userId: string): Promise<string>;
  notifyUser(userId: string, message: string): Promise<boolean>;
}

// Implementation of Logger service
@Injectable(ServiceLifetime.SINGLETON)
class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// Implementation of Mail service with Logger dependency
@Injectable(ServiceLifetime.SINGLETON)
class MockMailService implements IMailService {
  constructor(private logger: ILogger) {
    this.logger.log('MockMailService created');
  }
  
  async sendMail(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(`Sending mail to ${to} with subject "${subject}"`);
    return true;
  }
}

// Implementation of User service with multiple dependencies
@Injectable(ServiceLifetime.SINGLETON)
class UserService implements IUserService {
  constructor(
    private logger: ILogger,
    private mailService: IMailService
  ) {
    this.logger.log('UserService created with dependencies');
  }
  
  async getUserEmail(userId: string): Promise<string> {
    this.logger.log(`Getting email for user: ${userId}`);
    // Mock implementation
    return `user-${userId}@example.com`;
  }
  
  async notifyUser(userId: string, message: string): Promise<boolean> {
    this.logger.log(`Notifying user: ${userId}`);
    
    // Get user email
    const email = await this.getUserEmail(userId);
    
    // Send notification email
    return this.mailService.sendMail(
      email,
      'New Notification',
      message
    );
  }
}

// Run the example
export async function runDIExample() {
  // Register services
  container.register('ILogger', ConsoleLogger);
  container.register('IMailService', MockMailService);
  container.register('IUserService', UserService);
  
  // Resolve services
  const userService = container.resolve<IUserService>('IUserService');
  
  // Use the service
  const success = await userService.notifyUser('123', 'Hello from DI example!');
  console.log('Notification sent:', success);
  
  // This example demonstrates:
  // 1. Services with dependencies are automatically created
  // 2. Dependencies are injected recursively
  // 3. Singleton services are created only once
  
  return success;
}

// Export example
export default {
  runDIExample
};
