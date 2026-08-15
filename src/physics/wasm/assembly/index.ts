import { Vec3 } from './math';
import { RigidBody } from './body';
import { CollisionDetector, Contact } from './collision';
import { PhysicsSolver } from './solver';

// Internal Rigid Body Storage
const bodies: Array<RigidBody | null> = new Array<RigidBody | null>();
const gravity: Vec3 = new Vec3(f32(0.0), f32(-9.81), f32(0.0));

export function initPhysics(): void {
  bodies.length = 0;
}

export function setGravity(gx: f32, gy: f32, gz: f32): void {
  gravity.set(gx, gy, gz);
}

export function createRigidBody(
  id: i32,
  bodyType: i32,
  shapeType: i32,
  px: f32, py: f32, pz: f32,
  rx: f32, ry: f32, rz: f32,
  ex: f32, ey: f32, ez: f32,
  radius: f32,
  mass: f32,
  restitution: f32,
  friction: f32
): i32 {
  const body = new RigidBody(id, bodyType, shapeType);
  body.position.set(px, py, pz);
  body.rotationEuler.set(rx, ry, rz);
  body.extents.set(ex, ey, ez);
  body.radius = radius;
  body.restitution = restitution;
  body.friction = friction;
  body.setMass(mass);

  while (bodies.length <= id) {
    bodies.push(null);
  }
  bodies[id] = body;
  return id;
}

export function removeRigidBody(id: i32): void {
  if (id >= 0 && id < bodies.length) {
    bodies[id] = null;
  }
}

export function setPosition(id: i32, px: f32, py: f32, pz: f32): void {
  if (id >= 0 && id < bodies.length && bodies[id] !== null) {
    bodies[id]!.position.set(px, py, pz);
  }
}

export function setRotation(id: i32, rx: f32, ry: f32, rz: f32): void {
  if (id >= 0 && id < bodies.length && bodies[id] !== null) {
    bodies[id]!.rotationEuler.set(rx, ry, rz);
  }
}

export function setVelocity(id: i32, vx: f32, vy: f32, vz: f32): void {
  if (id >= 0 && id < bodies.length && bodies[id] !== null) {
    bodies[id]!.velocity.set(vx, vy, vz);
  }
}

export function applyImpulse(id: i32, ix: f32, iy: f32, iz: f32): void {
  if (id >= 0 && id < bodies.length && bodies[id] !== null) {
    const b = bodies[id]!;
    if (b.bodyType === 1) {
      b.velocity = b.velocity.add(new Vec3(ix, iy, iz).scale(b.invMass));
    }
  }
}

export function applyTorque(id: i32, tx: f32, ty: f32, tz: f32): void {
  if (id >= 0 && id < bodies.length && bodies[id] !== null) {
    const b = bodies[id]!;
    if (b.bodyType === 1) {
      b.applyTorque(new Vec3(tx, ty, tz));
    }
  }
}

/**
 * WASM Explosion Impulse Engine: Applies radial outward blast force
 */
export function createExplosion(ex: f32, ey: f32, ez: f32, radius: f32, force: f32): void {
  const epicentre = new Vec3(ex, ey, ez);

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b !== null && b.bodyType === 1) {
      const dir = b.position.sub(epicentre);
      const dist = dir.length();

      if (dist < radius && dist > f32(0.0001)) {
        const falloff = (radius - dist) / radius;
        const impulseMag = force * falloff;
        const blastImpulse = dir.normalize().scale(impulseMag);

        b.velocity = b.velocity.add(blastImpulse.scale(b.invMass));
        b.angularVelocity = b.angularVelocity.add(new Vec3(falloff * f32(10.0), falloff * f32(15.0), falloff * f32(10.0)));
      }
    }
  }
}

// Memory Buffer Offsets for Fast JS Serialization
export function getPositionX(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.position.x : f32(0.0); }
export function getPositionY(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.position.y : f32(0.0); }
export function getPositionZ(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.position.z : f32(0.0); }

export function getVelocityX(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.velocity.x : f32(0.0); }
export function getVelocityY(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.velocity.y : f32(0.0); }
export function getVelocityZ(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.velocity.z : f32(0.0); }

export function getRotationX(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.rotationEuler.x : f32(0.0); }
export function getRotationY(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.rotationEuler.y : f32(0.0); }
export function getRotationZ(id: i32): f32 { return (id >= 0 && id < bodies.length && bodies[id] !== null) ? bodies[id]!.rotationEuler.z : f32(0.0); }

/**
 * Optimized Multi-Substepping 3D Physics Loop with AABB Broadphase Filter
 */
export function stepSimulation(dt: f32): void {
  let subSteps = 4;
  let activeContactsCount = 0;

  // Pre-pass broadphase contact count estimation
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    if (a === null) continue;
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (b === null) continue;
      if (a.bodyType === 0 && b.bodyType === 0) continue;

      if (CollisionDetector.aabbOverlap(a, b)) {
        activeContactsCount++;
      }
    }
  }

  if (activeContactsCount > 15) {
    subSteps = 8;
  }

  const subDt = dt / f32(subSteps);

  for (let step = 0; step < subSteps; step++) {
    // 1. Apply Gravity and Integration
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b !== null && b.bodyType === 1) {
        b.applyForce(gravity.scale(b.mass));
        b.integrate(subDt);
      }
    }

    // 2. Detect & Resolve Collisions with Broadphase AABB Pruning
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a === null) continue;

      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b === null) continue;
        if (a.bodyType === 0 && b.bodyType === 0) continue;

        // FAST AABB BROADPHASE FILTER (Skips 90% of non-touching body pairs)
        if (!CollisionDetector.aabbOverlap(a, b)) {
          continue;
        }

        // NARROWPHASE: Continuous Collision Detection (CCD) TOI + 15-axis OBB SAT test
        const contact = CollisionDetector.detectCcd(a, b, subDt);
        if (contact !== null) {
          PhysicsSolver.resolveContact(contact);
        }
      }
    }
  }
}
