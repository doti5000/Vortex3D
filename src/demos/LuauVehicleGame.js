// Playable 3D Luau Vehicle Simulator Demo

export function loadLuauVehicleGame(sceneManager, physicsManager, luauVM) {
  sceneManager.clear();

  // 1. Ground Terrain
  const ground = sceneManager.createEntity('Ground Track');
  ground.transform.position = [0, 0, 0];
  ground.collider.extents = [100, 1, 100];
  ground.meshRenderer.color = '#1e293b';
  ground.meshRenderer.roughness = 0.8;
  ground.rigidBody.bodyType = 0; // Static

  // 2. Ramps & Obstacles
  const ramp = sceneManager.createEntity('Mega Ramp');
  ramp.transform.position = [0, 1.5, -15];
  ramp.transform.rotation = [15, 0, 0];
  ramp.collider.extents = [12, 1, 15];
  ramp.meshRenderer.color = '#f59e0b';
  ramp.rigidBody.bodyType = 0;

  // Domino Destruction Targets
  for (let i = 0; i < 6; i++) {
    const target = sceneManager.createEntity(`Barrier ${i + 1}`);
    target.transform.position = [(i - 2.5) * 2, 2, -35];
    target.collider.extents = [1.2, 4, 0.8];
    target.meshRenderer.color = '#ef4444';
    target.rigidBody.bodyType = 1;
    target.rigidBody.mass = 2.0;
  }

  // 3. Playable Vehicle Chassis
  const car = sceneManager.createEntity('Player Vehicle');
  car.transform.position = [0, 2, 10];
  car.collider.extents = [2.5, 1.2, 4.5];
  car.meshRenderer.color = '#6366f1';
  car.meshRenderer.roughness = 0.2;
  car.meshRenderer.metalness = 0.8;
  car.rigidBody.bodyType = 1;
  car.rigidBody.mass = 12.0;

  // Luau Vehicle Driver Script
  car.luauScript.source = `-- Typed Luau Playable Vehicle Controller
local car = script.Parent
local speed: number = 25
local turnPower: number = 15

print("Vortex3D Vehicle initialized! Drive with WASD / Arrow Keys.")

-- Apply initial forward boost via WASM Physics Engine
car:ApplyImpulse(Vector3.new(0, 5, -50))
`;

  sceneManager.selectEntity(car.id);
  console.log('Luau Vehicle Game scene loaded.');
}
