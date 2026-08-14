import * as THREE from 'three';

export class CharacterIK {
  constructor(character, scene) {
    this.character = character;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this.enabled = true;
    this.downVector = new THREE.Vector3(0, -1, 0);
  }

  update() {
    if (!this.enabled || !this.character.parts.leftLeg || !this.character.parts.rightLeg) return;

    const worldPos = new THREE.Vector3();
    const legs = [
      { mesh: this.character.parts.leftLeg, offsetX: -0.5 },
      { mesh: this.character.parts.rightLeg, offsetX: 0.5 }
    ];

    const meshesToTest = Array.from(this.scene.meshMap.values()).filter(m => m !== this.character.group);

    legs.forEach(leg => {
      leg.mesh.getWorldPosition(worldPos);
      worldPos.y += 1.0; // Start ray slightly above hip

      this.raycaster.set(worldPos, this.downVector);
      const hits = this.raycaster.intersectObjects(meshesToTest, true);

      if (hits.length > 0) {
        const hit = hits[0];
        const dist = hit.distance;

        // Ground offset alignment
        if (dist < 2.2) {
          const targetY = -1.5 + (2.0 - dist) * 0.5;
          leg.mesh.position.y = THREE.MathUtils.lerp(leg.mesh.position.y, targetY, 0.2);

          // Align foot rotation with terrain surface normal
          const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
          leg.mesh.rotation.x = THREE.MathUtils.lerp(leg.mesh.rotation.x, -normal.z * 0.4, 0.2);
        } else {
          leg.mesh.position.y = THREE.MathUtils.lerp(leg.mesh.position.y, -1.5, 0.2);
        }
      } else {
        leg.mesh.position.y = THREE.MathUtils.lerp(leg.mesh.position.y, -1.5, 0.2);
      }
    });
  }
}
