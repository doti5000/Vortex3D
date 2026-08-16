/**
 * @typedef {Object} EventBusEvents
 * @property {'LOCAL_PLAYER_MOVED'} LOCAL_PLAYER_MOVED
 * @property {'CHAT_MESSAGE_SENT'} CHAT_MESSAGE_SENT
 * @property {'NETWORK_CONNECTED'} NETWORK_CONNECTED
 * @property {'NETWORK_DISCONNECTED'} NETWORK_DISCONNECTED
 * @property {'STATE_CHANGED'} STATE_CHANGED
 */

export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {Function} callback 
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event 
   * @param {any} [data] 
   */
  emit(event, data = null) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (err) {
          console.error(`[EventBus] Error in listener for ${event}:`, err);
        }
      }
    }
  }
}
