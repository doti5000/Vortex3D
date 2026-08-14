import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  /**
   * Spawn particle burst (explosions, sparks, coin collection stars)
   */
  spawnBurst(position, count = 30, colorHex = 0xff5500, scale = 0.3) {
    const geometry = new THREE.BoxGeometry(scale, scale, scale);
    const material = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1.0 });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, material.clone());
      mesh.position.set(...position);

      const vx = (Math.random() - 0.5) * 15;
      const vy = Math.random() * 12 + 2;
      const vz = (Math.random() - 0.5) * 15;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: [vx, vy, vz],
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  update(dt = 0.016) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      } else {
        p.mesh.position.x += p.velocity[0] * dt;
        p.mesh.position.y += p.velocity[1] * dt;
        p.mesh.position.z += p.velocity[2] * dt;
        p.velocity[1] -= 9.81 * dt; // Gravity on particles
        p.mesh.material.opacity = p.life;
      }
    }
  }
}
