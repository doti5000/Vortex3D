import colyseus from 'colyseus';
const { Room } = colyseus;
import { Schema, MapSchema, type } from '@colyseus/schema';

class PlayerState extends Schema {
  constructor() {
    super();
    this.id = "";
    this.username = "Unknown Player";
    this.state = "idle";
    this.x = 0;
    this.y = 5;
    this.rotationY = 0;
    this.gold = 0;
  }
}

type("string")(PlayerState.prototype, "id");
type("string")(PlayerState.prototype, "username");
type("string")(PlayerState.prototype, "state");
type("number")(PlayerState.prototype, "x");
type("number")(PlayerState.prototype, "y");
type("number")(PlayerState.prototype, "z");
type("number")(PlayerState.prototype, "rotationY");
type("number")(PlayerState.prototype, "gold");
type("string")(PlayerState.prototype, "avatarConfig");

class EntityState extends Schema {
  constructor() {
    super();
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.rx = 0;
    this.ry = 0;
    this.rz = 0;
    this.rw = 1;
    this.ownerId = "";
    this.lastClaimed = 0;
  }
}
type("number")(EntityState.prototype, "x");
type("number")(EntityState.prototype, "y");
type("number")(EntityState.prototype, "z");
type("number")(EntityState.prototype, "rx");
type("number")(EntityState.prototype, "ry");
type("number")(EntityState.prototype, "rz");
type("number")(EntityState.prototype, "rw");
type("string")(EntityState.prototype, "ownerId");
type("number")(EntityState.prototype, "lastClaimed");

class VortexState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
    this.entities = new MapSchema();
  }
}
type({ map: PlayerState })(VortexState.prototype, "players");
type({ map: EntityState })(VortexState.prototype, "entities");

export class VortexRoom extends Room {
  maxClients = 8;

  onCreate(options) {
    this.setState(new VortexState());
    
    this.onMessage("player_update", (client, data) => {
      const p = this.state.players.get(client.sessionId);
      if (p) {
        p.x = data.x;
        p.y = data.y;
        p.z = data.z;
        p.rotationY = data.rotationY;
        p.state = data.state;
      }
    });

    this.onMessage("add_gold", (client, amount) => {
      const p = this.state.players.get(client.sessionId);
      if (p && typeof amount === 'number') {
        p.gold += amount;
      }
    });

    this.onMessage("chat", (client, text) => {
      const p = this.state.players.get(client.sessionId);
      if (p && typeof text === 'string' && text.trim().length > 0) {
        this.broadcast("chat_broadcast", {
          playerId: client.sessionId,
          username: p.username,
          text: text.trim().substring(0, 200),
          timestamp: Date.now()
        });
      }
    });

    this.onMessage("claim_entity", (client, entityId) => {
      if (!this.state.entities.has(entityId)) {
        this.state.entities.set(entityId, new EntityState());
      }
      const ent = this.state.entities.get(entityId);
      
      const now = Date.now();
      // Allow claiming if it's unowned, or if it has been owned by someone else for > 2 seconds
      // (This prevents deadlocks if a client crashes or lags while owning it)
      if (ent.ownerId === "" || ent.ownerId === client.sessionId || (now - ent.lastClaimed > 2000)) {
        ent.ownerId = client.sessionId;
        ent.lastClaimed = now;
      }
    });

    this.onMessage("entity_update", (client, data) => {
      if (!this.state.entities.has(data.id)) return;
      
      const ent = this.state.entities.get(data.id);
      
      // Only the current owner can update the entity
      if (ent.ownerId !== client.sessionId) return;
      
      ent.x = data.x;
      ent.y = data.y;
      ent.z = data.z;
      ent.rx = data.rx;
      ent.ry = data.ry;
      ent.rz = data.rz;
      ent.rw = data.rw;
    });
  }

  onJoin(client, options) {
    console.log(`[VortexRoom] Client joined: ${client.sessionId}`);
    const player = new PlayerState();
    player.id = options.userId || client.sessionId;
    player.username = options.username || "Guest";
    
    // The client has already resolved asset IDs into URLs in avatarConfig
    let config = { face: null, shirt: null, pants: null, hat: null, skinColors: null };
    if (options.avatarConfig) {
      config = { ...config, ...options.avatarConfig };
    }
    if (options.skinColors) {
      config.skinColors = options.skinColors;
    }
    player.avatarConfig = JSON.stringify(config);

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client, consented) {
    console.log(`[VortexRoom] Client left: ${client.sessionId}`);
    this.state.players.delete(client.sessionId);
    
    // Release any entities owned by this client
    for (const [id, ent] of this.state.entities.entries()) {
      if (ent.ownerId === client.sessionId) {
        ent.ownerId = "";
      }
    }
  }
}
