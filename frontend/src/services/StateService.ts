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

// Define valid state transitions
export const StateTransitions: Record<string, string[]> = {
  [AppState.IDLE]: [AppState.RECORDING, AppState.ERROR],
  [AppState.RECORDING]: [AppState.PROCESSING, AppState.IDLE, AppState.ERROR],
  [AppState.PROCESSING]: [AppState.RESULTS, AppState.ERROR],
  [AppState.RESULTS]: [AppState.IDLE, AppState.ERROR],
  [AppState.ERROR]: [AppState.IDLE]
};

/**
 * State management service implementation
 * 
 * This service manages application state transitions and maintains
 * associated data for each state. It follows the observer pattern
 * to notify components of state changes.
 */
export class ApplicationStateService implements IStateService {
  private currentState: string = AppState.IDLE;
  private stateData: Map<string, any> = new Map();
  private observers: StateObserver[] = [];
  private stateHistory: Array<{state: string, timestamp: number}> = [];
  
  constructor() {
    console.log('ApplicationStateService initialized');
    this.stateHistory.push({
      state: this.currentState,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get the current application state
   */
  getCurrentState(): string {
    return this.currentState;
  }
  
  /**
   * Get the state history (for debugging and analytics)
   */
  getStateHistory(): Array<{state: string, timestamp: number}> {
    return [...this.stateHistory];
  }
  
  /**
   * Transition to a new state
   * @param newState - The state to transition to
   * @returns Boolean indicating if the transition was successful
   */
  transition(newState: string): boolean {
    // Validate state transition
    const oldState = this.currentState;
    const validTransitions = StateTransitions[oldState] || [];
    
    if (!validTransitions.includes(newState)) {
      console.warn(
        `Invalid state transition: ${oldState} -> ${newState}. ` +
        `Valid transitions are: ${validTransitions.join(', ')}`
      );
      return false;
    }
    
    // Update state
    this.currentState = newState;
    
    // Add to history
    this.stateHistory.push({
      state: newState,
      timestamp: Date.now()
    });
    
    // Keep history limited to last 10 states
    if (this.stateHistory.length > 10) {
      this.stateHistory.shift();
    }
    
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
   * @param key - The key for the data
   * @param data - The data to store
   */
  setStateData<T>(key: string, data: T): void {
    this.stateData.set(key, data);
    this.notifyObservers();
  }
  
  /**
   * Clear all state data
   * Useful when transitioning to IDLE state
   */
  clearStateData(): void {
    this.stateData.clear();
    this.notifyObservers();
  }
  
  /**
   * Remove a specific piece of state data
   * @param key - The key of the data to remove
   */
  removeStateData(key: string): void {
    if (this.stateData.has(key)) {
      this.stateData.delete(key);
      this.notifyObservers();
    }
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
    
    // Use try/catch for each observer to prevent one error from
    // stopping notifications to other observers
    this.observers.forEach(observer => {
      try {
        observer.update(this.currentState, stateDataObject);
      } catch (error) {
        console.error('Error notifying observer:', error);
      }
    });
  }
  
  /**
   * Unsubscribe an observer from state changes
   * @param observer - The observer to unsubscribe
   */
  unsubscribe(observer: StateObserver): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }
}
