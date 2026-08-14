// Playable 3D Luau Platformer Game Demo

export function loadLuauPlatformerGame(sceneManager, physicsManager, luauVM) {
  sceneManager.clear();

  // 1. Start Platform
  const startPlat = sceneManager.createEntity('Start Platform');
  startPlat.transform.position = [0, 0, 0];
  startPlat.collider.extents = [10, 1, 10];
  startPlat.meshRenderer.color = '#10b981';
  startPlat.rigidBody.bodyType = 0;

  // 2. Moving Platform
  const movePlat = sceneManager.createEntity('Moving Platform');
  movePlat.transform.position = [0, 2, -15];
  movePlat.collider.extents = [6, 0.8, 6];
  movePlat.meshRenderer.color = '#3b82f6';
  movePlat.rigidBody.bodyType = 2; // Kinematic

  // 3. Goal Island & Coins
  const goalIsland = sceneManager.createEntity('Goal Island');
  goalIsland.transform.position = [0, 5, -35];
  goalIsland.collider.extents = [12, 1, 12];
  goalIsland.meshRenderer.color = '#8b5cf6';
  goalIsland.rigidBody.bodyType = 0;

  for (let i = 0; i < 3; i++) {
    const coin = sceneManager.createEntity(`Coin ${i + 1}`);
    coin.transform.position = [(i - 1) * 3, 7.5, -35];
    coin.meshRenderer.geometryType = 'sphere';
    coin.collider.shapeType = 1;
    coin.collider.radius = 0.8;
    coin.meshRenderer.color = '#f59e0b';
    coin.meshRenderer.metalness = 0.9;
    coin.rigidBody.bodyType = 1;
    coin.rigidBody.mass = 0.5;
  }

  // 4. Player Character
  const player = sceneManager.createEntity('Player Character');
  player.transform.position = [0, 3, 0];
  player.meshRenderer.geometryType = 'sphere';
  player.collider.shapeType = 1;
  player.collider.radius = 1.2;
  player.meshRenderer.color = '#ec4899';
  player.rigidBody.bodyType = 1;
  player.rigidBody.mass = 5.0;

  player.luauScript.source = `-- Typed Luau Character Controller
local player = script.Parent
local jumpForce: Vector3 = Vector3.new(0, 180, -30)

print("Character ready! Launching onto moving platform...")
player:ApplyImpulse(jumpForce)
`;

  sceneManager.selectEntity(player.id);
  console.log('Luau Platformer Game scene loaded.');
}
