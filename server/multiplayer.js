// Node.js WebSocket Relay Server for Vortex3D Multiplayer
import { WebSocketServer } from 'ws';

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

const rooms = new Map(); // roomCode -> Map(peerId -> peerState)

console.log(`Vortex3D Multiplayer Relay Server running on port ${PORT}`);

wss.on('connection', (ws) => {
  let currentRoom = 'lobby';
  let peerId = 'peer_' + Math.random().toString(36).substring(2, 9);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'join_room') {
        currentRoom = data.room || 'lobby';
        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Map());
        }
        rooms.get(currentRoom).set(peerId, { ws, state: data.playerState });

        // Send assigned peerId to client
        ws.send(JSON.stringify({ type: 'init', peerId, room: currentRoom }));

        // Broadcast player joined to room
        broadcastToRoom(currentRoom, peerId, {
          type: 'player_joined',
          peerId,
          playerState: data.playerState
        });
        return;
      }

      if (data.type === 'state_update') {
        const roomMap = rooms.get(currentRoom);
        if (roomMap && roomMap.has(peerId)) {
          roomMap.get(peerId).state = data.playerState;
        }

        broadcastToRoom(currentRoom, peerId, {
          type: 'player_update',
          peerId,
          playerState: data.playerState
        });
        return;
      }

      if (data.type === 'luau_event') {
        broadcastToRoom(currentRoom, peerId, {
          type: 'luau_event',
          peerId,
          eventName: data.eventName,
          payload: data.payload
        });
        return;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (rooms.has(currentRoom)) {
      const roomMap = rooms.get(currentRoom);
      roomMap.delete(peerId);
      if (roomMap.size === 0) {
        rooms.delete(currentRoom);
      } else {
        broadcastToRoom(currentRoom, peerId, {
          type: 'player_left',
          peerId
        });
      }
    }
  });
});

function broadcastToRoom(roomCode, senderPeerId, data) {
  const roomMap = rooms.get(roomCode);
  if (!roomMap) return;

  const payload = JSON.stringify(data);
  for (const [peerId, client] of roomMap.entries()) {
    if (peerId !== senderPeerId && client.ws.readyState === 1) {
      client.ws.send(payload);
    }
  }
}
