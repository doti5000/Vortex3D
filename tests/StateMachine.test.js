import test from 'node:test';
import assert from 'node:assert';
import { GameStateMachine } from '../src/engine/GameStateMachine.js';
import { EventBus } from '../src/engine/EventBus.js';

test('GameStateMachine implementation', async (t) => {
  await t.test('initializes correctly', () => {
    const bus = new EventBus();
    const fsm = new GameStateMachine(bus);
    assert.strictEqual(fsm.getState(), 'INITIALIZING');
    assert.strictEqual(fsm.is('INITIALIZING'), true);
  });

  await t.test('allows valid transitions and emits event', () => {
    const bus = new EventBus();
    const fsm = new GameStateMachine(bus);
    let eventFired = false;
    
    bus.on('STATE_CHANGED', (data) => {
      eventFired = true;
      assert.strictEqual(data.oldState, 'INITIALIZING');
      assert.strictEqual(data.newState, 'CONNECTING');
    });

    const success = fsm.transition('CONNECTING');
    assert.strictEqual(success, true);
    assert.strictEqual(fsm.getState(), 'CONNECTING');
    assert.strictEqual(eventFired, true);
  });

  await t.test('blocks invalid transitions', () => {
    const bus = new EventBus();
    const fsm = new GameStateMachine(bus);
    
    // Cannot go directly from INITIALIZING to PLAYING
    const success = fsm.transition('PLAYING');
    assert.strictEqual(success, false);
    assert.strictEqual(fsm.getState(), 'INITIALIZING');
  });
});
