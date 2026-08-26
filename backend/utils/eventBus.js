const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners if there are many workflows
    this.setMaxListeners(100);
  }

  /**
   * Emit an event asynchronously so it doesn't block the main request thread
   * @param {string} eventName 
   * @param {object} payload 
   */
  emitAsync(eventName, payload) {
    setImmediate(() => {
      this.emit(eventName, payload);
    });
  }
}

// Export as a singleton
const eventBus = new EventBus();

module.exports = eventBus;
