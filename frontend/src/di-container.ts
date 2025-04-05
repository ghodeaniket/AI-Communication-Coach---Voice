/**
 * Dependency Injection Container for Voice Coach application
 * 
 * This container supports:
 * - Service registration with different lifetimes (singleton, transient, scoped)
 * - Automatic dependency resolution
 * - Factory-based service registration
 * - Instance registration
 */

import type {
  IAudioService,
  ITranscriptionService,
  IStateService,
  IAPIClient
} from './interfaces';

// Service Lifetime types
export enum ServiceLifetime {
  TRANSIENT = 'transient',  // New instance each time
  SINGLETON = 'singleton',  // Single instance for application lifecycle
  SCOPED = 'scoped'         // Single instance per scope (future use)
}

// Service factory type
type ServiceFactory<T> = (container: DIContainer) => T;

// Service descriptor metadata
interface ServiceDescriptor {
  id: string;
  lifetime: ServiceLifetime;
  implementation?: any;
  factory?: ServiceFactory<any>;
  dependencies?: string[];
}

// Decorator for marking injectable services
export function Injectable(lifetime: ServiceLifetime = ServiceLifetime.SINGLETON) {
  return function(target: any) {
    // Store metadata about the service
    Reflect.defineMetadata('lifetime', lifetime, target);
    
    // Extract constructor parameter types if available
    const paramTypes = Reflect.getMetadata('design:paramtypes', target) || [];
    const dependencies = paramTypes.map((type: any, index: number) => {
      // Try to get the dependency ID from the parameter
      return Reflect.getMetadata('di:paramname', target, `param:${index}`) || type.name;
    });
    
    Reflect.defineMetadata('dependencies', dependencies, target);
    
    return target;
  };
}

// Decorator for naming dependencies
export function Inject(serviceId: string) {
  return function(target: any, _: string | undefined, parameterIndex: number) {
    Reflect.defineMetadata('di:paramname', serviceId, target, `param:${parameterIndex}`);
  };
}

/**
 * Dependency Injection Container
 */
export class DIContainer {
  private services = new Map<string, ServiceDescriptor>();
  private instances = new Map<string, any>();
  
  /**
   * Register a service implementation
   */
  register<T>(id: string, implementation: new (...args: any[]) => T, lifetime = ServiceLifetime.SINGLETON): DIContainer {
    // Get dependencies if reflection metadata is available
    let dependencies: string[] = [];
    if (typeof Reflect !== 'undefined' && Reflect.getMetadata) {
      dependencies = Reflect.getMetadata('dependencies', implementation) || [];
    }
    
    this.services.set(id, { 
      id, 
      lifetime, 
      implementation,
      dependencies 
    });
    return this;
  }
  
  /**
   * Register a service with a factory function
   */
  registerFactory<T>(id: string, factory: ServiceFactory<T>, lifetime = ServiceLifetime.SINGLETON): DIContainer {
    this.services.set(id, { id, lifetime, factory });
    return this;
  }
  
  /**
   * Register an existing instance
   */
  registerInstance<T>(id: string, instance: T): DIContainer {
    this.instances.set(id, instance);
    return this;
  }
  
  /**
   * Resolve a service by ID
   */
  resolve<T>(id: string): T {
    // Return cached instance if available
    if (this.instances.has(id)) {
      return this.instances.get(id) as T;
    }
    
    // Look up service descriptor
    const descriptor = this.services.get(id);
    if (!descriptor) {
      throw new Error(`Service not registered: ${id}`);
    }
    
    let instance: T;
    
    // Create instance from factory or implementation
    if (descriptor.factory) {
      // Use factory function
      instance = descriptor.factory(this);
    } else if (descriptor.implementation) {
      // Resolve dependencies
      const dependencies = (descriptor.dependencies || [])
        .map(depId => this.resolve(depId));
      
      // Create instance with dependencies
      instance = new descriptor.implementation(...dependencies);
    } else {
      throw new Error(`Invalid service descriptor for: ${id}`);
    }
    
    // Cache instance if singleton
    if (descriptor.lifetime === ServiceLifetime.SINGLETON) {
      this.instances.set(id, instance);
    }
    
    return instance;
  }
  
  /**
   * Check if a service is registered
   */
  has(id: string): boolean {
    return this.services.has(id) || this.instances.has(id);
  }
  
  /**
   * Clear all cached instances (useful for testing)
   */
  clearInstances(): void {
    this.instances.clear();
  }
}

// Import service implementations
import { BrowserAudioService } from './services/BrowserAudioService';
import { ApplicationStateService } from './services/StateService';

// Create and configure the container
export function createContainer(): DIContainer {
  const container = new DIContainer();
  
  // Register core services
  container.register<IAudioService>('IAudioService', BrowserAudioService);
  container.register<IStateService>('IStateService', ApplicationStateService);
  
  // Register mock services for development
  // These will be replaced with real implementations later
  
  return container;
}

// Export singleton container instance
export const container = createContainer();
export default container;
