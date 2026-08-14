import { Character } from '../engine/Character.js';

export class MultiplayerClient {
  constructor(scene, physicsManager) {
    this.scene = scene;
    this.physicsManager = physicsManager;
    this.socket = null;
    this.peerId = null;
    this.roomCode = 'lobby';
    this.remotePlayers = new Map(); // peerId -> Character
    this.isConnected = false;
    this.onStatusChange = null;
  }

  /**
   * Connect to multiplayer session.
   * STRICT RULE: Multiplayer CANNOT start if player doesn't have an avatar!
   */
  connect(serverUrl = 'ws://localhost:3001', roomCode = 'lobby', localCharacter = null) {
    if (!localCharacter || !localCharacter.group) {
      console.warn('⚠️ Multiplayer Connection Blocked: Local player does not have an active avatar!');
      alert('⚠️ Multiplayer Cannot Start!\n\nYou must have an active player avatar in the scene to launch multiplayer.\n\nPlease select the "Classic R6 Avatar Playground" preset or spawn an Avatar first.');
      return false;
    }

    this.roomCode = roomCode;
    try {
      this.socket = new WebSocket(serverUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log(`Connected to Multiplayer WebSocket at ${serverUrl}`);

        const initialState = {
          name: localCharacter.name,
          position: [localCharacter.group.position.x, localCharacter.group.position.y, localCharacter.group.position.z],
          face: localCharacter.faceTexturePath,
          shirt: localCharacter.shirtTexturePath
        };

        this.socket.send(JSON.stringify({
          type: 'join_room',
          room: this.roomCode,
          playerState: initialState
        }));

        if (this.onStatusChange) this.onStatusChange(true);
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log('Multiplayer connection closed.');
        if (this.onStatusChange) this.onStatusChange(false);
      };

      return true;
    } catch (err) {
      console.error('Failed to connect to multiplayer server:', err);
      return false;
    }
  }

  handleMessage(data) {
    if (data.type === 'init') {
      this.peerId = data.peerId;
      console.log(`Assigned Peer ID: ${this.peerId} in room ${data.room}`);
      return;
    }

    if (data.type === 'player_joined' || data.type === 'player_update') {
      const { peerId, playerState } = data;
      let remoteChar = this.remotePlayers.get(peerId);

      if (!remoteChar) {
        remoteChar = new Character({
          id: peerId,
          name: playerState.name || 'Remote Player',
          position: playerState.position || [0, 5, 0],
          scene: this.scene,
          physicsManager: this.physicsManager,
          isLocalPlayer: false
        });
        this.remotePlayers.set(peerId, remoteChar);
      } else if (playerState && playerState.position) {
        // Interpolate position
        if (remoteChar.group) {
          remoteChar.group.position.set(...playerState.position);
        }
      }
      return;
    }

    if (data.type === 'player_left') {
      const remoteChar = this.remotePlayers.get(data.peerId);
      if (remoteChar) {
        remoteChar.destroy();
        this.remotePlayers.delete(data.peerId);
      }
    }
  }

  sendLocalState(localCharacter) {
    if (!this.isConnected || !this.socket || !localCharacter || !localCharacter.group) return;

    const pos = [localCharacter.group.position.x, localCharacter.group.position.y, localCharacter.group.position.z];
    const rotY = localCharacter.group.rotation.y;

    this.socket.send(JSON.stringify({
      type: 'state_update',
      playerState: {
        name: localCharacter.name,
        position: pos,
        rotationY: rotY,
        face: localCharacter.faceTexturePath,
        shirt: localCharacter.shirtTexturePath
      }
    }));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    for (const remoteChar of this.remotePlayers.values()) {
      remoteChar.destroy();
    }
    this.remotePlayers.clear();
    this.isConnected = false;
  }
}
