import { Vec3 } from './math';

export class PBDParticle {
  id: i32;
  position: Vec3;
  oldPosition: Vec3;
  invMass: f32;

  constructor(id: i32, x: f32, y: f32, z: f32, mass: f32) {
    this.id = id;
    this.position = new Vec3(x, y, z);
    this.oldPosition = new Vec3(x, y, z);
    this.invMass = mass > f32(0.0) ? f32(1.0) / mass : f32(0.0);
  }
}

export class PBDDistanceConstraint {
  p1: PBDParticle;
  p2: PBDParticle;
  restLength: f32;

  constructor(p1: PBDParticle, p2: PBDParticle) {
    this.p1 = p1;
    this.p2 = p2;
    this.restLength = p1.position.sub(p2.position).length();
  }

  solve(): void {
    const delta = this.p1.position.sub(this.p2.position);
    const currentLen = delta.length();
    if (currentLen <= f32(0.0001)) return;

    const diff = (currentLen - this.restLength) / currentLen;
    const correction = delta.scale(f32(0.5) * diff);

    if (this.p1.invMass > f32(0.0)) {
      this.p1.position = this.p1.position.sub(correction);
    }
    if (this.p2.invMass > f32(0.0)) {
      this.p2.position = this.p2.position.add(correction);
    }
  }
}

export class PBDSolver {
  particles: PBDParticle[];
  constraints: PBDDistanceConstraint[];

  constructor() {
    this.particles = new Array<PBDParticle>();
    this.constraints = new Array<PBDDistanceConstraint>();
  }

  step(dt: f32): void {
    // 1. Verlet Integration
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.invMass > f32(0.0)) {
        const vel = p.position.sub(p.oldPosition);
        p.oldPosition = p.position;
        p.position = p.position.add(vel).add(new Vec3(f32(0.0), f32(-9.81), f32(0.0)).scale(dt * dt));
      }
    }

    // 2. Solve Distance Constraints
    for (let iter = 0; iter < 4; iter++) {
      for (let i = 0; i < this.constraints.length; i++) {
        this.constraints[i].solve();
      }
    }
  }
}
