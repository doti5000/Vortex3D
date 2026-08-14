// Playable Classic R6 Avatar Multiplayer Playground Demo

export function loadLuauAvatarMultiplayerDemo(sceneManager, physicsManager, luauVM) {
  sceneManager.clear();

  // 1. Ground Arena Floor
  const floor = sceneManager.createEntity('Arena Floor');
  floor.transform.position = [0, -1, 0];
  floor.collider.extents = [80, 2, 80];
  floor.meshRenderer.color = '#1e293b';
  floor.meshRenderer.roughness = 0.7;
  floor.rigidBody.bodyType = 0; // Static

  // 2. Obstacle Ramp & Platforms
  const ramp = sceneManager.createEntity('Challenge Ramp');
  ramp.transform.position = [0, 2, -15];
  ramp.transform.rotation = [15, 0, 0];
  ramp.collider.extents = [12, 1, 16];
  ramp.meshRenderer.color = '#3b82f6';
  ramp.rigidBody.bodyType = 0;

  const highPlatform = sceneManager.createEntity('High Platform');
  highPlatform.transform.position = [0, 5, -32];
  highPlatform.collider.extents = [16, 1, 16];
  highPlatform.meshRenderer.color = '#8b5cf6';
  highPlatform.rigidBody.bodyType = 0;

  // 3. Stack of Physics Destructibles for Player Interaction
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
  for (let i = 0; i < 12; i++) {
    const box = sceneManager.createEntity(`Target Box ${i + 1}`);
    box.transform.position = [(i % 4 - 1.5) * 2.5, 1.5 + Math.floor(i / 4) * 2.1, -10];
    box.collider.extents = [2, 2, 2];
    box.meshRenderer.color = colors[i % colors.length];
    box.rigidBody.bodyType = 1; // Dynamic
    box.rigidBody.mass = 1.0;
  }

  // 4. Luau Character Controller Script
  const controllerScript = sceneManager.createEntity('Luau Player Manager');
  controllerScript.luauScript.source = `-- Typed Luau Player Avatar Controller
local parent = script.Parent
local walkSpeed: number = 18

print("Classic R6 Avatar Playground Ready! Move with WASD, Space to Jump.")
`;

  console.log('Classic R6 Avatar Multiplayer Playground scene loaded.');
}
