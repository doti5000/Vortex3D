import test from 'node:test';
import assert from 'node:assert';
import { EventBus } from '../src/engine/EventBus.js';

test('EventBus implementation', async (t) => {
  await t.test('should subscribe and receive events', () => {
    const bus = new EventBus();
    let received = null;
    
    bus.on('LOCAL_PLAYER_MOVED', (data) => {
      received = data;
    });
    
    bus.emit('LOCAL_PLAYER_MOVED', { x: 5, z: 10 });
    
    assert.deepStrictEqual(received, { x: 5, z: 10 });
  });

  await t.test('should unsubscribe from events correctly', () => {
    const bus = new EventBus();
    let count = 0;
    
    const handler = () => count++;
    
    bus.on('CHAT_MESSAGE_SENT', handler);
    bus.emit('CHAT_MESSAGE_SENT');
    assert.strictEqual(count, 1);
    
    bus.off('CHAT_MESSAGE_SENT', handler);
    bus.emit('CHAT_MESSAGE_SENT');
    assert.strictEqual(count, 1); // Should not increment again
  });
});
