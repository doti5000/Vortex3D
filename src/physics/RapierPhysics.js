import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class RapierPhysics {
  constructor() {
    this.world = null;
    this.isInitialized = false;
    this.bodyMap = new Map(); // wasmBodyId -> { rigidBody, collider, entityId }
    this.nextId = 1;
  }

  async init() {
    try {
      await RAPIER.init();
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      this.world = new RAPIER.World(gravity);
      this.isInitialized = true;
      console.log('Rapier3D WASM Physics Engine initialized.');
    } catch (err) {
      console.error('Failed to initialize Rapier3D WASM:', err);
    }
  }

  setGravity(gx, gy, gz) {
    if (!this.isInitialized) return;
    this.world.gravity = { x: gx, y: gy, z: gz };
  }

  createRigidBody({
    entityId,
    bodyType = 1,
    shapeType = 0,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    extents = [1, 1, 1],
    radius = 1,
    mass = 1,
    restitution = 0.1,
    friction = 0.5,
    lockRotations = false
  }) {
    if (!this.isInitialized) return null;

    let bodyDesc;
    if (bodyType === 0) {
      bodyDesc = RAPIER.RigidBodyDesc.fixed();
    } else if (bodyType === 2) {
      bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
    } else {
      bodyDesc = RAPIER.RigidBodyDesc.dynamic();
    }

    bodyDesc.setTranslation(position[0], position[1], position[2]);

    // Initial Rotation
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2]),
      'XYZ'
    );
    const q = new THREE.Quaternion().setFromEuler(euler);
    bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });

    // Character Lock Rotations (keeps upright without tipping over)
    const isCharacter = typeof entityId === 'string' && (entityId.includes('player') || entityId.includes('char'));
    if (lockRotations || isCharacter) {
      bodyDesc.lockRotations();
    }

    const rigidBody = this.world.createRigidBody(bodyDesc);

    let colliderDesc;
    if (shapeType === 1) { // Sphere
      colliderDesc = RAPIER.ColliderDesc.ball(radius);
    } else { // Box
      colliderDesc = RAPIER.ColliderDesc.cuboid(extents[0] / 2, extents[1] / 2, extents[2] / 2);
    }

    colliderDesc.setRestitution(restitution);

    // Characters get zero friction to prevent sticking to floor/wall edges
    if (isCharacter) {
      colliderDesc.setFriction(0.0);
    } else {
      colliderDesc.setFriction(friction);
    }

    const collider = this.world.createCollider(colliderDesc, rigidBody);

    if (mass > 0 && bodyType === 1) {
      rigidBody.setAdditionalMass(mass, true);
    }

    const wasmBodyId = this.nextId++;
    this.bodyMap.set(wasmBodyId, { rigidBody, collider, entityId });
    return wasmBodyId;
  }

  removeRigidBody(wasmBodyId) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return;
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    this.world.removeRigidBody(rigidBody);
    this.bodyMap.delete(wasmBodyId);
  }

  applyImpulse(wasmBodyId, x, y, z) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return;
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    rigidBody.applyImpulse({ x, y, z }, true);
  }

  applyTorque(wasmBodyId, tx, ty, tz) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return;
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    rigidBody.applyTorqueImpulse({ x: tx, y: ty, z: tz }, true);
  }

  createExplosion(x, y, z, radius = 15.0, force = 80.0) {
    if (!this.isInitialized) return;
    const epicentre = new THREE.Vector3(x, y, z);
    for (const [id, { rigidBody }] of this.bodyMap.entries()) {
      if (rigidBody.bodyType() === RAPIER.RigidBodyType.Dynamic) {
        const pos = rigidBody.translation();
        const bodyPos = new THREE.Vector3(pos.x, pos.y, pos.z);
        const dir = bodyPos.clone().sub(epicentre);
        const dist = dir.length();
        if (dist < radius && dist > 0.001) {
          const falloff = (radius - dist) / radius;
          const impulse = dir.normalize().multiplyScalar(force * falloff);
          rigidBody.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true);
        }
      }
    }
  }

  setPosition(wasmBodyId, x, y, z) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return;
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    rigidBody.setTranslation({ x, y, z }, true);
  }

  setRotation(wasmBodyId, rxDeg, ryDeg, rzDeg) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return;
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(rxDeg),
      THREE.MathUtils.degToRad(ryDeg),
      THREE.MathUtils.degToRad(rzDeg),
      'XYZ'
    );
    const q = new THREE.Quaternion().setFromEuler(euler);
    rigidBody.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }, true);
  }

  setVelocity(wasmBodyId, x, y, z) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return;
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    rigidBody.setLinvel({ x, y, z }, true);
  }

  getPosition(wasmBodyId) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return [0, 0, 0];
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    const pos = rigidBody.translation();
    return [pos.x, pos.y, pos.z];
  }

  getVelocity(wasmBodyId) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return [0, 0, 0];
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    const vel = rigidBody.linvel();
    return [vel.x, vel.y, vel.z];
  }

  getRotation(wasmBodyId) {
    if (!this.isInitialized || !this.bodyMap.has(wasmBodyId)) return [0, 0, 0];
    const { rigidBody } = this.bodyMap.get(wasmBodyId);
    const q = rigidBody.rotation();
    const threeQ = new THREE.Quaternion(q.x, q.y, q.z, q.w);
    const euler = new THREE.Euler().setFromQuaternion(threeQ, 'XYZ');
    return [euler.x, euler.y, euler.z];
  }

  getBodyCount() {
    if (!this.isInitialized) return 0;
    return this.bodyMap.size;
  }

  step(dt) {
    if (!this.isInitialized) return 0;
    const t0 = performance.now();
    this.world.step();
    return performance.now() - t0;
  }

  raycast(origin, dir, maxDist = 100) {
    if (!this.isInitialized) return null;
    const ray = new RAPIER.Ray(
      { x: origin[0], y: origin[1], z: origin[2] },
      { x: dir[0], y: dir[1], z: dir[2] }
    );
    const hit = this.world.castRay(ray, maxDist, true);
    if (hit) {
      for (const [id, record] of this.bodyMap.entries()) {
        if (record.collider.handle === hit.collider.handle) {
          return { bodyId: id, entityId: record.entityId };
        }
      }
    }
    return null;
  }
}
