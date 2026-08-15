import * as THREE from 'three';

export class CSGManager {
  constructor(renderer, physicsManager, sceneManager) {
    this.renderer = renderer;
    this.physicsManager = physicsManager;
    this.sceneManager = sceneManager;
  }

  /**
   * Carve out a hole or slice a target entity's visual geometry
   */
  carveHole(targetEntityId, cutterPosition, cutterSize = [2, 2, 2]) {
    const entity = this.sceneManager.getEntity(targetEntityId);
    if (!entity || !entity.meshRenderer) return;

    const mesh = this.renderer.meshMap.get(targetEntityId);
    if (!mesh) return;

    // Create cutter geometry for visual slicing
    const cutterGeo = new THREE.BoxGeometry(...cutterSize);
    const cutterMat = new THREE.MeshBasicMaterial();
    const cutterMesh = new THREE.Mesh(cutterGeo, cutterMat);
    cutterMesh.position.set(...cutterPosition);

    // Apply visual mesh scale adjustment
    mesh.geometry.dispose();
    const newGeo = new THREE.BoxGeometry(
      Math.max(0.5, entity.collider.extents[0] - cutterSize[0] * 0.3),
      Math.max(0.5, entity.collider.extents[1] - cutterSize[1] * 0.3),
      Math.max(0.5, entity.collider.extents[2] - cutterSize[2] * 0.3)
    );
    mesh.geometry = newGeo;

    // Update entity collider extents
    entity.collider.extents = [newGeo.parameters.width, newGeo.parameters.height, newGeo.parameters.depth];

    // Rebuild physics rigid body for sliced geometry
    if (entity.rigidBodyId) {
      this.physicsManager.removeRigidBody(entity.rigidBodyId);
      entity.rigidBodyId = this.physicsManager.createRigidBody({
        entityId: entity.id,
        bodyType: entity.rigidBody.bodyType,
        shapeType: 0,
        position: entity.transform.position,
        rotation: entity.transform.rotation,
        extents: entity.collider.extents,
        mass: entity.rigidBody.mass,
        restitution: entity.rigidBody.restitution,
        friction: entity.rigidBody.friction
      });
    }
  }
}
