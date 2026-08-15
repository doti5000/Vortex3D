// Playable 3D Luau Platformer Game Demo with Damage-on-Touch Lava Blocks & Coins

export function loadLuauPlatformerGame(sceneManager, physicsManager, luauVM) {
  sceneManager.clear();

  // 1. Start Platform
  const startPlat = sceneManager.createEntity('Start Platform');
  startPlat.transform.position = [0, 0, 0];
  startPlat.collider.extents = [12, 1, 12];
  startPlat.meshRenderer.color = '#10b981';
  startPlat.rigidBody.bodyType = 0; // Static

  // 2. Moving Platform
  const movePlat = sceneManager.createEntity('Moving Platform');
  movePlat.transform.position = [0, 2, -15];
  movePlat.collider.extents = [8, 1, 8];
  movePlat.meshRenderer.color = '#3b82f6';
  movePlat.rigidBody.bodyType = 2; // Kinematic

  // 3. Damage-on-Touch Lava Block
  const lavaBlock = sceneManager.createEntity('Damage Lava Trap');
  lavaBlock.transform.position = [0, 0.5, -24];
  lavaBlock.collider.extents = [10, 1, 4];
  lavaBlock.meshRenderer.color = '#ef4444';
  lavaBlock.meshRenderer.roughness = 0.2;
  lavaBlock.rigidBody.bodyType = 0; // Static
  lavaBlock.isDamageOnTouch = true;

  // 4. Goal Island & Coins
  const goalIsland = sceneManager.createEntity('Goal Island');
  goalIsland.transform.position = [0, 5, -35];
  goalIsland.collider.extents = [16, 1, 16];
  goalIsland.meshRenderer.color = '#8b5cf6';
  goalIsland.rigidBody.bodyType = 0; // Static

  const colors = ['#f59e0b', '#ec4899', '#3b82f6'];
  for (let i = 0; i < 3; i++) {
    const coin = sceneManager.createEntity(`Golden Coin ${i + 1}`);
    coin.transform.position = [(i - 1) * 4, 7.5, -35];
    coin.meshRenderer.geometryType = 'sphere';
    coin.collider.shapeType = 1;
    coin.collider.radius = 1.0;
    coin.meshRenderer.color = colors[i % colors.length];
    coin.meshRenderer.metalness = 0.9;
    coin.rigidBody.bodyType = 1; // Dynamic
    coin.rigidBody.mass = 0.5;
    coin.isCoin = true;
  }

  // 5. Luau Platformer Game Manager Script
  const gameManager = sceneManager.createEntity('Platformer Game Manager');
  gameManager.luauScript.source = `-- Luau 3D Platformer Game Manager
print("3D Platformer Ready! Avoid red Lava Trap damage parts and collect Golden Coins!")
`;

  sceneManager.selectEntity(startPlat.id);
  console.log('Luau Platformer Game scene loaded with Damage Lava Traps & Golden Coins.');
}
