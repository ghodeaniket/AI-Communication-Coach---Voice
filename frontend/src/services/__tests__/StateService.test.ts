import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationStateService, AppState, StateTransitions } from '../StateService';
import type { StateObserver } from '../StateService';

// Mock the DI decorators
vi.mock('../../di-container', () => ({
  Injectable: () => (target: any) => target,
  ServiceLifetime: {
    SINGLETON: 'singleton'
  }
}));

describe('ApplicationStateService', () => {
  let stateService: ApplicationStateService;
  
  beforeEach(() => {
    // Create a new instance for each test
    stateService = new ApplicationStateService();
  });
  
  describe('initialization', () => {
    it('should start in IDLE state', () => {
      expect(stateService.getCurrentState()).toBe(AppState.IDLE);
    });
    
    it('should initialize with empty state data', () => {
      expect(stateService.getStateData('test')).toBeNull();
    });
    
    it('should have state history with initial state', () => {
      const history = stateService.getStateHistory();
      expect(history.length).toBe(1);
      expect(history[0].state).toBe(AppState.IDLE);
    });
  });
  
  describe('state transitions', () => {
    it('should allow valid state transitions', () => {
      // IDLE -> RECORDING is valid
      expect(stateService.transition(AppState.RECORDING)).toBe(true);
      expect(stateService.getCurrentState()).toBe(AppState.RECORDING);
    });
    
    it('should prevent invalid state transitions', () => {
      // IDLE -> RESULTS is invalid
      expect(stateService.transition(AppState.RESULTS)).toBe(false);
      expect(stateService.getCurrentState()).toBe(AppState.IDLE);
    });
    
    it('should update state history on transition', () => {
      stateService.transition(AppState.RECORDING);
      const history = stateService.getStateHistory();
      expect(history.length).toBe(2);
      expect(history[1].state).toBe(AppState.RECORDING);
    });
    
    it('should limit history to 10 entries', () => {
      // Fill the history with transitions
      for (let i = 0; i < 15; i++) {
        stateService.transition(AppState.ERROR);
        stateService.transition(AppState.IDLE);
      }
      
      const history = stateService.getStateHistory();
      expect(history.length).toBe(10);
    });
  });
  
  describe('state data management', () => {
    it('should store and retrieve state data', () => {
      const testData = { test: 'data' };
      stateService.setStateData('testKey', testData);
      expect(stateService.getStateData('testKey')).toEqual(testData);
    });
    
    it('should clear all state data', () => {
      stateService.setStateData('key1', 'value1');
      stateService.setStateData('key2', 'value2');
      
      stateService.clearStateData();
      
      expect(stateService.getStateData('key1')).toBeNull();
      expect(stateService.getStateData('key2')).toBeNull();
    });
    
    it('should remove specific state data', () => {
      stateService.setStateData('key1', 'value1');
      stateService.setStateData('key2', 'value2');
      
      stateService.removeStateData('key1');
      
      expect(stateService.getStateData('key1')).toBeNull();
      expect(stateService.getStateData('key2')).toBe('value2');
    });
  });
  
  describe('observer pattern', () => {
    it('should notify observers on state change', () => {
      const mockObserver: StateObserver = {
        update: vi.fn()
      };
      
      stateService.subscribe(mockObserver);
      stateService.transition(AppState.RECORDING);
      
      expect(mockObserver.update).toHaveBeenCalledWith(
        AppState.RECORDING,
        expect.any(Object)
      );
    });
    
    it('should notify observers on data change', () => {
      const mockObserver: StateObserver = {
        update: vi.fn()
      };
      
      stateService.subscribe(mockObserver);
      stateService.setStateData('testKey', 'testValue');
      
      expect(mockObserver.update).toHaveBeenCalledWith(
        AppState.IDLE,
        expect.objectContaining({ 'testKey': 'testValue' })
      );
    });
    
    it('should handle observer errors gracefully', () => {
      // Create an observer that throws an error
      const errorObserver: StateObserver = {
        update: () => { throw new Error('Test error'); }
      };
      
      // Create a normal observer
      const normalObserver: StateObserver = {
        update: vi.fn()
      };
      
      // Subscribe both observers
      stateService.subscribe(errorObserver);
      stateService.subscribe(normalObserver);
      
      // This should not throw even though the first observer throws
      stateService.transition(AppState.RECORDING);
      
      // The normal observer should still be called
      expect(normalObserver.update).toHaveBeenCalled();
    });
    
    it('should allow unsubscribing observers', () => {
      const mockObserver: StateObserver = {
        update: vi.fn()
      };
      
      stateService.subscribe(mockObserver);
      stateService.unsubscribe(mockObserver);
      
      stateService.transition(AppState.RECORDING);
      
      expect(mockObserver.update).not.toHaveBeenCalled();
    });
  });
});
