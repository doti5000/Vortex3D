import * as Colyseus from "colyseus.js";

async function test() {
  const client = new Colyseus.Client("ws://127.0.0.1:3001");
  console.log("Connecting...");
  const room = await client.joinOrCreate("vortex_room", { gameId: "test_room" });
  console.log("Connected!");
  console.log("room.state:", room.state);
  if (room.state && room.state.players) {
    console.log("players defined!");
  } else {
    console.log("players UNDEFINED!");
  }
  process.exit(0);
}
test().catch(console.error);
