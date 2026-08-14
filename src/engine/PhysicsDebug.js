import * as THREE from 'three';

export class PhysicsDebug {
  constructor(renderer, physicsManager, sceneManager) {
    this.renderer = renderer;
    this.physicsManager = physicsManager;
    this.sceneManager = sceneManager;
    this.enabled = false;

    this.debugGroup = new THREE.Group();
    this.debugGroup.visible = false;
    this.renderer.scene.add(this.debugGroup);
    this.wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
    this.meshPool = new Map(); // entityId -> THREE.Mesh
  }

  toggle(visible) {
    this.enabled = visible;
    this.debugGroup.visible = visible;
    if (!visible) {
      this.clearPool();
    }
  }

  clearPool() {
    for (const mesh of this.meshPool.values()) {
      if (mesh.geometry) mesh.geometry.dispose();
      this.debugGroup.remove(mesh);
    }
    this.meshPool.clear();
  }

  update() {
    if (!this.enabled) return;

    const activeEntityIds = new Set();

    for (const entity of this.sceneManager.entities.values()) {
      if (entity.rigidBody && entity.rigidBody.enabled && entity.rigidBodyId) {
        activeEntityIds.add(entity.id);

        const pos = this.physicsManager.getPosition(entity.rigidBodyId);
        const rot = this.physicsManager.getRotation(entity.rigidBodyId);

        let mesh = this.meshPool.get(entity.id);
        if (!mesh) {
          const scaledExtents = [
            entity.collider.extents[0] * entity.transform.scale[0],
            entity.collider.extents[1] * entity.transform.scale[1],
            entity.collider.extents[2] * entity.transform.scale[2]
          ];

          let geometry;
          if (entity.collider.shapeType === 1) {
            geometry = new THREE.SphereGeometry(entity.collider.radius * Math.max(...entity.transform.scale), 12, 12);
          } else {
            geometry = new THREE.BoxGeometry(...scaledExtents);
          }

          mesh = new THREE.Mesh(geometry, this.wireframeMaterial);
          this.debugGroup.add(mesh);
          this.meshPool.set(entity.id, mesh);
        }

        mesh.position.set(...pos);
        mesh.rotation.set(...rot);
      }
    }

    // Clean up removed entities from debug pool
    for (const [id, mesh] of this.meshPool.entries()) {
      if (!activeEntityIds.has(id)) {
        if (mesh.geometry) mesh.geometry.dispose();
        this.debugGroup.remove(mesh);
        this.meshPool.delete(id);
      }
    }
  }
}
