import type {
  IAudioService,
  ITranscriptionService,
  IStateService,
  IAPIClient
} from './interfaces';

enum ServiceLifetime {
  TRANSIENT = 'transient',
  SINGLETON = 'singleton',
  SCOPED = 'scoped'
}

type ServiceFactory<T> = (container: DIContainer) => T;

interface ServiceDescriptor {
  id: string;
  lifetime: ServiceLifetime;
  implementation?: any;
  factory?: ServiceFactory<any>;
}

class DIContainer {
  private services = new Map<string, ServiceDescriptor>();
  private instances = new Map<string, any>();
  
  register<T>(id: string, implementation: new (...args: any[]) => T, lifetime = ServiceLifetime.SINGLETON): DIContainer {
    this.services.set(id, { id, lifetime, implementation });
    return this;
  }
  
  registerFactory<T>(id: string, factory: ServiceFactory<T>, lifetime = ServiceLifetime.SINGLETON): DIContainer {
    this.services.set(id, { id, lifetime, factory });
    return this;
  }
  
  registerInstance<T>(id: string, instance: T): DIContainer {
    this.instances.set(id, instance);
    return this;
  }
  
  resolve<T>(id: string): T {
    if (this.instances.has(id)) {
      return this.instances.get(id) as T;
    }
    
    const descriptor = this.services.get(id);
    if (!descriptor) {
      throw new Error(`Service not registered: ${id}`);
    }
    
    let instance: T;
    
    if (descriptor.factory) {
      instance = descriptor.factory(this);
    } else if (descriptor.implementation) {
      // Simple implementation without automatic dependency resolution
      instance = new descriptor.implementation();
    } else {
      throw new Error(`Invalid service descriptor for: ${id}`);
    }
    
    if (descriptor.lifetime === ServiceLifetime.SINGLETON) {
      this.instances.set(id, instance);
    }
    
    return instance;
  }
  
  has(id: string): boolean {
    return this.services.has(id) || this.instances.has(id);
  }
}

// Create and configure the container
export function createContainer(): DIContainer {
  const container = new DIContainer();
  
  // Register mock services for development
  // These will be replaced with real implementations later
  
  return container;
}

// Export singleton container instance
export const container = createContainer();
