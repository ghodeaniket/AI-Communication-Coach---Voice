/**
 * Dependency Injection Container for Voice Coach application
 * 
 * This container supports:
 * - Service registration with different lifetimes (singleton, transient, scoped)
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
    this.services.set(id, { 
      id, 
      lifetime, 
      implementation
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
      // Create instance with dependencies (no auto-injection for now)
      instance = new descriptor.implementation();
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

// Export the container class - we'll use the factory to create instances
export { DIContainer, ServiceLifetime };
