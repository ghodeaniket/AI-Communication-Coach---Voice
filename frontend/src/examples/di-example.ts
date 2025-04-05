/**
 * Example demonstrating Dependency Injection usage in the Voice Coach application
 */

import container from '../di-container';
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
class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// Implementation of Mail service with Logger dependency
class MockMailService implements IMailService {
  private logger: ILogger;
  
  constructor(logger: ILogger) {
    this.logger = logger;
    this.logger.log('MockMailService created');
  }
  
  async sendMail(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(`Sending mail to ${to} with subject "${subject}"`);
    return true;
  }
}

// Implementation of User service with multiple dependencies
class UserService implements IUserService {
  private logger: ILogger;
  private mailService: IMailService;
  
  constructor(logger: ILogger, mailService: IMailService) {
    this.logger = logger;
    this.mailService = mailService;
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
  
  // Register mail service with a factory to inject the logger
  container.registerFactory('IMailService', (container) => {
    const logger = container.resolve<ILogger>('ILogger');
    return new MockMailService(logger);
  });
  
  // Register user service with a factory to inject dependencies
  container.registerFactory('IUserService', (container) => {
    const logger = container.resolve<ILogger>('ILogger');
    const mailService = container.resolve<IMailService>('IMailService');
    return new UserService(logger, mailService);
  });
  
  // Resolve services
  const userService = container.resolve<IUserService>('IUserService');
  
  // Use the service
  const success = await userService.notifyUser('123', 'Hello from DI example!');
  console.log('Notification sent:', success);
  
  // This example demonstrates:
  // 1. Services with dependencies are created with factories
  // 2. Dependencies are resolved from the container
  // 3. Singleton services are created only once
  
  return success;
}

// Export example
export default {
  runDIExample
};
