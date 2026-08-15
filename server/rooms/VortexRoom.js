import { Room } from 'colyseus';
import { Schema, MapSchema, type } from '@colyseus/schema';

class PlayerState extends Schema {
  constructor() {
    super();
    this.id = "";
    this.username = "Unknown Player";
    this.state = "idle";
    this.x = 0;
    this.y = 5;
    this.z = 0;
    this.rotationY = 0;
  }
}

type("string")(PlayerState.prototype, "id");
type("string")(PlayerState.prototype, "username");
type("string")(PlayerState.prototype, "state");
type("number")(PlayerState.prototype, "x");
type("number")(PlayerState.prototype, "y");
type("number")(PlayerState.prototype, "z");
type("number")(PlayerState.prototype, "rotationY");

class VortexState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}
type({ map: PlayerState })(VortexState.prototype, "players");

export class VortexRoom extends Room {
  onCreate(options) {
    this.setState(new VortexState());
    
    this.onMessage("player_update", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.state = data.state;
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
        player.rotationY = data.rotationY;
      }
    });
  }

  onJoin(client, options) {
    console.log(`[VortexRoom] Client joined: ${client.sessionId}`);
    const player = new PlayerState();
    player.id = options.userId || client.sessionId;
    player.username = options.username || "Guest";
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client, consented) {
    console.log(`[VortexRoom] Client left: ${client.sessionId}`);
    this.state.players.delete(client.sessionId);
  }
}
