import type { IStateService } from '../interfaces';

// Define application states
export enum AppState {
  IDLE = 'idle',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  RESULTS = 'results',
  ERROR = 'error'
}

// Observer interface
export interface StateObserver {
  update(state: string, data: any): void;
}

/**
 * State management service implementation
 */
export class ApplicationStateService implements IStateService {
  private currentState: string = AppState.IDLE;
  private stateData: Map<string, any> = new Map();
  private observers: StateObserver[] = [];
  
  /**
   * Get the current application state
   */
  getCurrentState(): string {
    return this.currentState;
  }
  
  /**
   * Transition to a new state
   */
  transition(newState: string): boolean {
    // Validate state transition (could add rules here)
    const oldState = this.currentState;
    this.currentState = newState;
    
    // Notify observers
    this.notifyObservers();
    
    console.log(`State transition: ${oldState} -> ${newState}`);
    return true;
  }
  
  /**
   * Get data associated with the current state
   */
  getStateData<T>(key: string): T | null {
    return this.stateData.has(key) ? this.stateData.get(key) : null;
  }
  
  /**
   * Set data associated with the current state
   */
  setStateData<T>(key: string, data: T): void {
    this.stateData.set(key, data);
    this.notifyObservers();
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(observer: StateObserver): void {
    this.observers.push(observer);
  }
  
  /**
   * Notify all observers of state change
   */
  private notifyObservers(): void {
    const stateDataObject = Object.fromEntries(this.stateData.entries());
    this.observers.forEach(observer => {
      observer.update(this.currentState, stateDataObject);
    });
  }
}
