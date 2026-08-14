import * as THREE from 'three';

export class CharacterRagdoll {
  constructor(character, physicsManager) {
    this.character = character;
    this.physicsManager = physicsManager;
    this.active = false;
    this.limbBodies = new Map(); // limbName -> rigidBodyId
  }

  activate(blastOrigin = null) {
    if (this.active) return;
    this.active = true;

    // Disable single main character physics body
    if (this.character.rigidBodyId) {
      this.physicsManager.removeRigidBody(this.character.rigidBodyId);
      this.character.rigidBodyId = null;
    }

    const parts = this.character.parts;
    const limbNames = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

    limbNames.forEach(name => {
      const mesh = parts[name];
      if (!mesh) return;

      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);

      // Remove from character group and attach directly to scene
      this.character.scene.scene.add(mesh);
      mesh.position.copy(worldPos);

      // Create WASM dynamic rigid body per limb
      const bodyId = this.physicsManager.createRigidBody({
        entityId: `ragdoll_${this.character.id}_${name}`,
        bodyType: 1, // Dynamic
        shapeType: 0, // Box
        position: [worldPos.x, worldPos.y, worldPos.z],
        extents: [1.0, 1.0, 1.0],
        mass: 1.0,
        restitution: 0.4,
        friction: 0.6
      });

      this.limbBodies.set(name, bodyId);

      // Apply explosive blast impulse if triggered by explosion
      if (blastOrigin) {
        const dx = worldPos.x - blastOrigin[0];
        const dy = worldPos.y - blastOrigin[1];
        const dz = worldPos.z - blastOrigin[2];
        const force = 80.0;
        this.physicsManager.applyImpulse(bodyId, dx * force, (dy + 5) * force, dz * force);
        this.physicsManager.applyTorque(bodyId, Math.random() * 20, Math.random() * 20, Math.random() * 20);
      }
    });
  }

  update() {
    if (!this.active) return;

    // Sync individual limb meshes from their WASM ragdoll rigid bodies
    for (const [name, bodyId] of this.limbBodies.entries()) {
      const mesh = this.character.parts[name];
      if (mesh && bodyId !== null) {
        const pos = this.physicsManager.getPosition(bodyId);
        const rot = this.physicsManager.getRotation(bodyId);
        mesh.position.set(...pos);
        mesh.rotation.set(...rot);
      }
    }
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;

    for (const [name, bodyId] of this.limbBodies.entries()) {
      this.physicsManager.removeRigidBody(bodyId);
    }
    this.limbBodies.clear();

    // Re-attach limbs to character group
    const p = this.character.parts;
    if (p.head) { p.head.position.set(0, 2.1, 0); this.character.group.add(p.head); }
    if (p.torso) { p.torso.position.set(0, 0.5, 0); this.character.group.add(p.torso); }
    if (p.leftArm) { p.leftArm.position.set(-1.5, 0.5, 0); this.character.group.add(p.leftArm); }
    if (p.rightArm) { p.rightArm.position.set(1.5, 0.5, 0); this.character.group.add(p.rightArm); }
    if (p.leftLeg) { p.leftLeg.position.set(-0.5, -1.5, 0); this.character.group.add(p.leftLeg); }
    if (p.rightLeg) { p.rightLeg.position.set(0.5, -1.5, 0); this.character.group.add(p.rightLeg); }

    // Re-initialize main physics body
    this.character.initPhysics([0, 5, 0]);
  }
}
