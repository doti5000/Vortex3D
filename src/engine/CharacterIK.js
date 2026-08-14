import * as THREE from 'three';

export class CharacterIK {
  constructor(character, scene) {
    this.character = character;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.enabled = true;
    this.downVector = new THREE.Vector3(0, -1, 0);
    this.aimTarget = new THREE.Vector3();
    this.isAiming = false;
  }

  setAimTarget(targetVector) {
    if (targetVector) {
      this.aimTarget.copy(targetVector);
      this.isAiming = true;
    } else {
      this.isAiming = false;
    }
  }

  update() {
    if (!this.enabled || !this.character.parts) return;

    // 1. Procedural 2-Joint Leg Terrain Grounding IK
    if (this.character.parts.leftLeg && this.character.parts.rightLeg) {
      const worldPos = new THREE.Vector3();
      const legs = [
        { mesh: this.character.parts.leftLeg, defaultY: -1.5 },
        { mesh: this.character.parts.rightLeg, defaultY: -1.5 }
      ];

      const meshesToTest = Array.from(this.scene.meshMap.values()).filter(m => m !== this.character.group);

      legs.forEach(leg => {
        leg.mesh.getWorldPosition(worldPos);
        worldPos.y += 1.0;

        this.raycaster.set(worldPos, this.downVector);
        const hits = this.raycaster.intersectObjects(meshesToTest, true);

        if (hits.length > 0) {
          const hit = hits[0];
          const dist = hit.distance;

          if (dist < 2.2) {
            const targetY = leg.defaultY + (2.0 - dist) * 0.5;
            leg.mesh.position.y = THREE.MathUtils.lerp(leg.mesh.position.y, targetY, 0.25);

            const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
            leg.mesh.rotation.x = THREE.MathUtils.lerp(leg.mesh.rotation.x, -normal.z * 0.45, 0.25);
            leg.mesh.rotation.z = THREE.MathUtils.lerp(leg.mesh.rotation.z, normal.x * 0.45, 0.25);
          } else {
            leg.mesh.position.y = THREE.MathUtils.lerp(leg.mesh.position.y, leg.defaultY, 0.2);
            leg.mesh.rotation.x = THREE.MathUtils.lerp(leg.mesh.rotation.x, 0, 0.2);
            leg.mesh.rotation.z = THREE.MathUtils.lerp(leg.mesh.rotation.z, 0, 0.2);
          }
        } else {
          leg.mesh.position.y = THREE.MathUtils.lerp(leg.mesh.position.y, leg.defaultY, 0.2);
          leg.mesh.rotation.x = THREE.MathUtils.lerp(leg.mesh.rotation.x, 0, 0.2);
          leg.mesh.rotation.z = THREE.MathUtils.lerp(leg.mesh.rotation.z, 0, 0.2);
        }
      });
    }

    // 2. Procedural Arm Aiming IK Solver
    if (this.isAiming && this.character.parts.rightArm) {
      const arm = this.character.parts.rightArm;
      const armWorldPos = new THREE.Vector3();
      arm.getWorldPosition(armWorldPos);

      const aimDir = new THREE.Vector3().subVectors(this.aimTarget, armWorldPos).normalize();
      const pitch = Math.asin(THREE.MathUtils.clamp(-aimDir.y, -1, 1));

      arm.rotation.x = THREE.MathUtils.lerp(arm.rotation.x, pitch + Math.PI / 2, 0.3);
    }
  }
}
