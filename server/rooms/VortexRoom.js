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

class VortexState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}
type({ map: PlayerState })(VortexState.prototype, "players");

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
          playerId: p.id,
          username: p.username,
          text: text.trim().substring(0, 200),
          timestamp: Date.now()
        });
      }
    });
  }

  onJoin(client, options) {
    console.log(`[VortexRoom] Client joined: ${client.sessionId}`);
    const player = new PlayerState();
    player.id = options.userId || client.sessionId;
    player.username = options.username || "Guest";
    
    // Convert equipped asset IDs into full texture URLs for the game client
    const config = { face: null, shirt: null, pants: null, hat: null, skinColors: null };
    if (options.equipped) {
      if (options.equipped.face) config.face = options.equipped.face;
      if (options.equipped.shirt) config.shirt = options.equipped.shirt;
      if (options.equipped.pants) config.pants = options.equipped.pants;
      if (options.equipped.hat) config.hat = options.equipped.hat;
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
  }
}
