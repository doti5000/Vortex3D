/**
 * @typedef {'INITIALIZING' | 'CONNECTING' | 'PLAYING' | 'DISCONNECTED'} GameState
 */

export class GameStateMachine {
  constructor(eventBus) {
    /** @type {import('./EventBus.js').EventBus} */
    this.eventBus = eventBus;
    
    /** @type {GameState} */
    this.currentState = 'INITIALIZING';
    
    /** @type {Map<GameState, Set<GameState>>} */
    this.validTransitions = new Map([
      ['INITIALIZING', new Set(['CONNECTING', 'DISCONNECTED'])],
      ['CONNECTING', new Set(['PLAYING', 'DISCONNECTED'])],
      ['PLAYING', new Set(['DISCONNECTED'])],
      ['DISCONNECTED', new Set(['CONNECTING'])]
    ]);
  }

  /**
   * Transition to a new state
   * @param {GameState} newState 
   * @returns {boolean} True if transition was successful
   */
  transition(newState) {
    const allowed = this.validTransitions.get(this.currentState);
    if (!allowed || !allowed.has(newState)) {
      console.warn(`[FSM] Invalid transition from ${this.currentState} to ${newState}`);
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;
    
    this.eventBus.emit('STATE_CHANGED', {
      oldState,
      newState
    });
    
    return true;
  }

  /**
   * Get current state
   * @returns {GameState}
   */
  getState() {
    return this.currentState;
  }

  /**
   * Check if currently in a specific state
   * @param {GameState} state 
   * @returns {boolean}
   */
  is(state) {
    return this.currentState === state;
  }
}
