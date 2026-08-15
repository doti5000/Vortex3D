import { Character } from '../engine/Character.js';
import * as Colyseus from 'colyseus.js';

export class MultiplayerClient {
  constructor(scene, physicsManager) {
    this.scene = scene;
    this.physicsManager = physicsManager;
    this.colyseusClient = null;
    this.room = null;
    this.peerId = null;
    this.remotePlayers = new Map(); // sessionId -> Character
    this.isConnected = false;
    this.onStatusChange = null;
  }

  /**
   * Connect to authoritative Colyseus multiplayer session.
   * STRICT RULE: Multiplayer CANNOT start if player doesn't have an avatar!
   */
  async connect(serverUrl = 'ws://localhost:3001', roomCode = 'vortex_room', localCharacter = null) {
    if (!localCharacter || !localCharacter.group) {
      console.warn('⚠️ Multiplayer Connection Blocked: Local player does not have an active avatar!');
      alert('⚠️ Multiplayer Cannot Start!\n\nYou must have an active player avatar in the scene to launch multiplayer.\n\nPlease select the "Classic R6 Avatar Playground" preset or spawn an Avatar first.');
      return false;
    }

    try {
      this.colyseusClient = new Colyseus.Client(serverUrl);
      
      // We pass the gameId as the room name, but the server needs to define it.
      // We mapped "vortex_room" in server/index.js
      this.room = await this.colyseusClient.joinOrCreate('vortex_room', { userId: localCharacter.id, gameId: roomCode });
      
      this.isConnected = true;
      this.peerId = this.room.sessionId;
      console.log(`Connected to Colyseus Room ${this.room.name} with Session ID: ${this.room.sessionId}`);

      if (this.onStatusChange) this.onStatusChange(true);

      // Listen for remote players joining
      this.room.state.players.onAdd((player, sessionId) => {
        if (sessionId !== this.peerId) {
          const remoteChar = new Character({
            id: sessionId,
            name: player.id || 'Remote Player',
            position: [player.x, player.y, player.z],
            scene: this.scene,
            physicsManager: this.physicsManager,
            isLocalPlayer: false
          });
          this.remotePlayers.set(sessionId, remoteChar);

          // Listen for state changes (movement, animation)
          player.onChange(() => {
            if (remoteChar.group) {
              remoteChar.group.position.set(player.x, player.y, player.z);
              remoteChar.group.rotation.y = player.rotationY;
              if (remoteChar.animator && player.state) {
                remoteChar.humanoid.state = player.state;
                remoteChar.animator.setState(player.state);
              }
            }
          });
        }
      });

      // Listen for remote players leaving
      this.room.state.players.onRemove((player, sessionId) => {
        const remoteChar = this.remotePlayers.get(sessionId);
        if (remoteChar) {
          remoteChar.destroy();
          this.remotePlayers.delete(sessionId);
        }
      });

      return true;
    } catch (err) {
      console.error('Failed to connect to multiplayer server:', err);
      return false;
    }
  }

  sendLocalState(localCharacter) {
    if (!this.isConnected || !this.room || !localCharacter || !localCharacter.group) return;

    const pos = localCharacter.group.position;
    const rotY = localCharacter.group.rotation.y;

    this.room.send("player_update", {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      rotationY: rotY,
      state: localCharacter.humanoid.state
    });
  }

  disconnect() {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    for (const remoteChar of this.remotePlayers.values()) {
      remoteChar.destroy();
    }
    this.remotePlayers.clear();
    this.isConnected = false;
  }
}
