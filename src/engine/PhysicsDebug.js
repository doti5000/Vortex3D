import * as THREE from 'three';

export class PhysicsDebug {
  constructor(renderer, physicsManager, sceneManager) {
    this.renderer = renderer;
    this.physicsManager = physicsManager;
    this.sceneManager = sceneManager;
    this.enabled = true;

    this.debugGroup = new THREE.Group();
    this.renderer.scene.add(this.debugGroup);
    this.wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
  }

  toggle(visible) {
    this.enabled = visible;
    this.debugGroup.visible = visible;
  }

  update() {
    if (!this.enabled) return;

    // Clear previous debug wireframes
    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children.pop();
      if (child.geometry) child.geometry.dispose();
    }

    // Render green wireframes around physics bodies
    for (const entity of this.sceneManager.entities.values()) {
      if (entity.rigidBody && entity.rigidBody.enabled && entity.rigidBodyId) {
        const pos = this.physicsManager.getPosition(entity.rigidBodyId);
        const rot = this.physicsManager.getRotation(entity.rigidBodyId);
        let geometry;

        const scaledExtents = [
          entity.collider.extents[0] * entity.transform.scale[0],
          entity.collider.extents[1] * entity.transform.scale[1],
          entity.collider.extents[2] * entity.transform.scale[2]
        ];

        if (entity.collider.shapeType === 1) {
          geometry = new THREE.SphereGeometry(entity.collider.radius * Math.max(...entity.transform.scale), 16, 16);
        } else {
          geometry = new THREE.BoxGeometry(...scaledExtents);
        }

        const mesh = new THREE.Mesh(geometry, this.wireframeMaterial);
        mesh.position.set(...pos);
        mesh.rotation.set(...rot);
        this.debugGroup.add(mesh);
      }
    }
  }
}
