import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 1000;

    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 1.0
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.count = 0;
    this.scene.add(this.instancedMesh);

    this.particles = [];
    this.dummy = new THREE.Object3D();
  }

  spawnBurst(position, count = 30, colorHex = 0xff5500, scale = 0.3) {
    const burstCount = Math.min(count, this.maxParticles - this.particles.length);
    const color = new THREE.Color(colorHex);

    for (let i = 0; i < burstCount; i++) {
      const vx = (Math.random() - 0.5) * 15;
      const vy = Math.random() * 12 + 2;
      const vz = (Math.random() - 0.5) * 15;

      this.particles.push({
        position: [...position],
        velocity: [vx, vy, vz],
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        scale: scale,
        color: color.clone()
      });
    }
  }

  update(dt = 0.016) {
    const activeCount = this.particles.length;

    for (let i = activeCount - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        p.position[0] += p.velocity[0] * dt;
        p.position[1] += p.velocity[1] * dt;
        p.position[2] += p.velocity[2] * dt;
        p.velocity[1] -= 9.81 * dt; // Gravity
      }
    }

    this.instancedMesh.count = this.particles.length;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.dummy.position.set(p.position[0], p.position[1], p.position[2]);
      const currentScale = p.scale * p.life;
      this.dummy.scale.set(currentScale, currentScale, currentScale);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.instancedMesh.setColorAt(i, p.color);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }
}
