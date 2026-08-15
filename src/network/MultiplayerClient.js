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
    this.onChatMessage = null;
  }

  /**
   * Connect to authoritative Colyseus multiplayer session.
   * STRICT RULE: Multiplayer CANNOT start if player doesn't have an avatar!
   */
  async connect(serverUrl = 'ws://localhost:3001', roomCode = 'vortex_room', localCharacter = null, joinOptions = {}) {
    if (!localCharacter || !localCharacter.group) {
      console.warn('⚠️ Multiplayer Connection Blocked: Local player does not have an active avatar!');
      alert('⚠️ Multiplayer Cannot Start!\n\nYou must have an active player avatar in the scene to launch multiplayer.\n\nPlease select the "Classic R6 Avatar Playground" preset or spawn an Avatar first.');
      return false;
    }

    try {
      this.colyseusClient = new Colyseus.Client(serverUrl);
      
      // We pass the gameId as the room name, but the server needs to define it.
      // We mapped "vortex_room" in server/index.js
      this.room = await this.colyseusClient.joinOrCreate('vortex_room', { ...joinOptions, userId: localCharacter.id, gameId: roomCode });
      
      this.isConnected = true;
      this.peerId = this.room.sessionId;
      console.log(`Connected to Colyseus Room ${this.room.name} with Session ID: ${this.room.sessionId}`);

      if (this.onStatusChange) this.onStatusChange(true);

      this.room.onMessage("chat_broadcast", (data) => {
        if (this.onChatMessage) {
          this.onChatMessage(data);
        }
      });

      if (this.room.state.entities) {
        const syncEntity = (entityState, id) => {
          // If we own the entity, our local physics is driving it. Do NOT override.
          if (entityState.ownerId === this.peerId) return; 
          
          if (this.physicsManager && this.scene && this.scene.entities) {
            const entity = this.scene.entities.get(id);
            if (entity && entity.rigidBodyId !== undefined) {
              const rbId = entity.rigidBodyId;
            
            // If body exists, set position/rotation from server
            if (rbId) {
              this.physicsManager.setPosition(rbId, entityState.x, entityState.y, entityState.z);
              this.physicsManager.setRotationQuat(rbId, entityState.rx, entityState.ry, entityState.rz, entityState.rw);
            }
            }
          }
        };

        this.room.state.entities.onAdd((entityState, id) => {
          syncEntity(entityState, id);
          entityState.onChange(() => syncEntity(entityState, id));
        });
      }

      // Listen for remote players joining
      this.room.state.players.onAdd((player, sessionId) => {
        if (sessionId !== this.peerId) {
          if (this.remotePlayers.has(sessionId)) {
            this.remotePlayers.get(sessionId).destroy();
            this.remotePlayers.delete(sessionId);
          }

          let avatarConfig = {};
          let skinColors = undefined;
          if (player.avatarConfig) {
            try {
              const cfg = JSON.parse(player.avatarConfig);
              avatarConfig = cfg;
              if (cfg.skinColors) skinColors = cfg.skinColors;
            } catch(e) {}
          }

          const remoteChar = new Character({
            id: sessionId,
            name: player.username || player.id || 'Remote Player',
            position: [player.x, player.y, player.z],
            scene: this.scene,
            physicsManager: this.physicsManager,
            isLocalPlayer: false,
            avatarConfig: avatarConfig,
            skinColors: skinColors
          });
          remoteChar.initPhysics([player.x, player.y, player.z], true); // true = isKinematic
          remoteChar.gold = player.gold || 0;
          this.remotePlayers.set(sessionId, remoteChar);

          // Listen for state changes (movement, animation)
          player.onChange(() => {
            if (remoteChar.group) {
              remoteChar.group.position.set(player.x, player.y, player.z);
              remoteChar.group.rotation.y = player.rotationY;
              if (remoteChar.rigidBodyId !== undefined && this.physicsManager) {
                this.physicsManager.setPosition(remoteChar.rigidBodyId, player.x, player.y, player.z);
              }
              if (remoteChar.animator && player.state) {
                remoteChar.humanoid.state = player.state;
                remoteChar.animator.setState(player.state);
              }
              if (player.gold !== undefined) {
                remoteChar.gold = player.gold;
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

  sendGoldUpdate(amount) {
    if (!this.isConnected || !this.room) return;
    this.room.send("add_gold", amount);
  }

  sendChat(text) {
    if (!this.isConnected || !this.room) return;
    this.room.send("chat", text);
  }

  sendClaimEntity(entityId) {
    if (!this.isConnected || !this.room) return;
    this.room.send("claim_entity", entityId);
  }

  sendEntityUpdate(entityId, x, y, z, rx, ry, rz, rw) {
    if (!this.isConnected || !this.room) return;
    this.room.send("entity_update", {
      id: entityId,
      x, y, z, rx, ry, rz, rw
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
