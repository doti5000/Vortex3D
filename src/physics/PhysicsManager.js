import { CustomWasmPhysics } from './CustomWasmPhysics.js';
import { RapierPhysics } from './RapierPhysics.js';

export class PhysicsManager {
  constructor() {
    this.customEngine = new CustomWasmPhysics();
    this.rapierEngine = new RapierPhysics();
    this.activeBackend = 'custom'; // 'custom' | 'rapier'
    this.telemetryCallback = null;
    this.activeBodiesCount = 0;
    this.onBackendSwitchedCallback = null;
  }

  async init() {
    await this.customEngine.init();
    await this.rapierEngine.init();
  }

  get currentEngine() {
    return this.activeBackend === 'custom' ? this.customEngine : this.rapierEngine;
  }

  setBackend(backendName) {
    if (backendName === 'custom' || backendName === 'rapier') {
      this.activeBackend = backendName;
      console.log(`Switched Active WASM Physics Backend to: ${backendName.toUpperCase()}`);
      if (this.onBackendSwitchedCallback) {
        this.onBackendSwitchedCallback(backendName);
      }
    }
  }

  setGravity(gx, gy, gz) {
    this.customEngine.setGravity(gx, gy, gz);
    this.rapierEngine.setGravity(gx, gy, gz);
  }

  createRigidBody(config) {
    this.activeBodiesCount++;
    return this.currentEngine.createRigidBody(config);
  }

  removeRigidBody(bodyId) {
    if (this.activeBodiesCount > 0) this.activeBodiesCount--;
    this.currentEngine.removeRigidBody(bodyId);
  }

  setPosition(bodyId, x, y, z) {
    this.currentEngine.setPosition(bodyId, x, y, z);
  }

  setRotation(bodyId, rxDeg, ryDeg, rzDeg) {
    if (this.currentEngine.setRotation) {
      this.currentEngine.setRotation(bodyId, rxDeg, ryDeg, rzDeg);
    }
  }

  setVelocity(bodyId, vx, vy, vz) {
    this.currentEngine.setVelocity(bodyId, vx, vy, vz);
  }

  applyImpulse(bodyId, ix, iy, iz) {
    this.currentEngine.applyImpulse(bodyId, ix, iy, iz);
  }

  applyTorque(bodyId, tx, ty, tz) {
    if (this.currentEngine.applyTorque) {
      this.currentEngine.applyTorque(bodyId, tx, ty, tz);
    }
  }

  createExplosion(x, y, z, radius = 15.0, force = 80.0) {
    if (this.currentEngine.createExplosion) {
      this.currentEngine.createExplosion(x, y, z, radius, force);
    }
  }

  getPosition(bodyId) {
    return this.currentEngine.getPosition(bodyId);
  }

  getVelocity(bodyId) {
    return this.currentEngine.getVelocity(bodyId);
  }

  getRotation(bodyId) {
    if (this.currentEngine.getRotation) {
      return this.currentEngine.getRotation(bodyId);
    }
    return [0, 0, 0];
  }

  onTelemetry(callback) {
    this.telemetryCallback = callback;
  }

  step(dt = 1 / 60) {
    const t0 = performance.now();
    this.currentEngine.step(dt);
    const stepTimeMs = performance.now() - t0;

    if (this.telemetryCallback) {
      this.telemetryCallback({
        backend: this.activeBackend,
        stepTimeMs: stepTimeMs,
        bodyCount: this.activeBodiesCount
      });
    }
  }
}
