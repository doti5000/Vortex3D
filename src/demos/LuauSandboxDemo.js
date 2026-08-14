// Physics Sandbox & Destruction Spawner Demo

export function loadLuauSandboxDemo(sceneManager, physicsManager, luauVM) {
  sceneManager.clear();

  // Floor (Extents: 60 width, 2 height, 60 depth -> Half-extents: 30, 1, 30)
  const floor = sceneManager.createEntity('Ground Floor');
  floor.transform.position = [0, -1, 0];
  floor.collider.extents = [60, 2, 60];
  floor.meshRenderer.color = '#1e293b';
  floor.meshRenderer.roughness = 0.7;
  floor.rigidBody.bodyType = 0; // Static

  // Stack of 30 Boxes placed cleanly above floor level (Floor top is at Y = 0)
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  let boxIndex = 1;
  for (let x = -2; x <= 2; x++) {
    for (let y = 1; y <= 5; y++) {
      const box = sceneManager.createEntity(`Physics Box ${boxIndex++}`);
      box.transform.position = [x * 2.2, y * 2.05, 0];
      box.collider.extents = [2, 2, 2];
      box.meshRenderer.color = colors[(x + y + 10) % colors.length];
      box.rigidBody.bodyType = 1;
      box.rigidBody.mass = 1.0;
      box.rigidBody.restitution = 0.4;
      box.rigidBody.friction = 0.6;
    }
  }

  // Wrecking Ball
  const ball = sceneManager.createEntity('Wrecking Ball');
  ball.transform.position = [0, 10, 16];
  ball.meshRenderer.geometryType = 'sphere';
  ball.collider.shapeType = 1;
  ball.collider.radius = 2.5;
  ball.meshRenderer.color = '#e11d48';
  ball.meshRenderer.metalness = 0.9;
  ball.rigidBody.bodyType = 1;
  ball.rigidBody.mass = 25.0;

  ball.luauScript.source = `-- Typed Luau Wrecking Ball Impulse Script
local ball = script.Parent
local blastForce: Vector3 = Vector3.new(0, 30, -400)

print("Demolition in progress! Wrecking ball fired into stack.")
ball:ApplyImpulse(blastForce)
`;

  sceneManager.selectEntity(ball.id);
  console.log('Luau Physics Sandbox scene loaded.');
}
