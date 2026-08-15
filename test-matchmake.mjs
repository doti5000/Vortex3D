import { Client } from 'colyseus.js';

async function run() {
  const client1 = new Client('ws://localhost:3014');
  const client2 = new Client('ws://localhost:3014');
  
  console.log("Client 1 joining...");
  try {
    const room1 = await client1.joinOrCreate('vortex_room', { userId: 'player1', gameId: 'test_game', username: 'P1' });
    console.log("Client 1 joined room:", room1.id);
    
    console.log("Client 2 joining...");
    const room2 = await client2.joinOrCreate('vortex_room', { userId: 'player2', gameId: 'test_game', username: 'P2' });
    console.log("Client 2 joined room:", room2.id);
    
    if (room1.id === room2.id) {
      console.log("SUCCESS: Both joined the same room!");
    } else {
      console.log("FAIL: Joined different rooms.");
    }
    
    room1.leave();
    room2.leave();
  } catch (e) {
    console.error("Error joining:", e);
  }
}

run().catch(console.error);
