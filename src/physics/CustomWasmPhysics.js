import * as THREE from 'three';

export class CustomWasmPhysics {
  constructor() {
    this.wasmInstance = null;
    this.exports = null;
    this.isLoaded = false;
  }

  async init() {
    try {
      const response = await fetch('/physics.wasm');
      const bytes = await response.arrayBuffer();

      const wasmModule = await WebAssembly.instantiate(bytes, {
        env: {
          abort: (msg, file, line, col) => {
            console.error(`WASM Abort called at ${file}:${line}:${col} msg:${msg}`);
          }
        }
      });

      this.wasmInstance = wasmModule.instance;
      this.exports = this.wasmInstance.exports;
      this.exports.initPhysics();
      this.isLoaded = true;
      console.log('Custom WASM 3D Angular Physics Engine loaded successfully.');
    } catch (err) {
      console.error('Failed to load Custom WASM Physics Engine:', err);
    }
  }

  setGravity(gx, gy, gz) {
    if (this.exports) {
      this.exports.setGravity(Number(gx), Number(gy), Number(gz));
    }
  }

  createRigidBody({ entityId, bodyType = 1, shapeType = 0, position = [0, 0, 0], rotation = [0, 0, 0], extents = [1, 1, 1], radius = 1, mass = 1, restitution = 0.3, friction = 0.5 }) {
    if (!this.exports) return null;

    const numericId = typeof entityId === 'number' ? entityId : Math.abs(this.hashString(entityId));

    const rx = THREE.MathUtils.degToRad(Number(rotation[0]));
    const ry = THREE.MathUtils.degToRad(Number(rotation[1]));
    const rz = THREE.MathUtils.degToRad(Number(rotation[2]));

    this.exports.createRigidBody(
      numericId,
      Number(bodyType),
      Number(shapeType),
      Number(position[0]), Number(position[1]), Number(position[2]),
      rx, ry, rz,
      Number(extents[0]), Number(extents[1]), Number(extents[2]),
      Number(radius),
      Number(mass),
      Number(restitution),
      Number(friction)
    );

    return numericId;
  }

  removeRigidBody(bodyId) {
    if (this.exports && bodyId !== null) {
      this.exports.removeRigidBody(bodyId);
    }
  }

  setPosition(bodyId, x, y, z) {
    if (this.exports && bodyId !== null) {
      this.exports.setPosition(bodyId, Number(x), Number(y), Number(z));
    }
  }

  setRotation(bodyId, rxDeg, ryDeg, rzDeg) {
    if (this.exports && bodyId !== null) {
      const rx = THREE.MathUtils.degToRad(Number(rxDeg));
      const ry = THREE.MathUtils.degToRad(Number(ryDeg));
      const rz = THREE.MathUtils.degToRad(Number(rzDeg));
      this.exports.setRotation(bodyId, rx, ry, rz);
    }
  }

  setVelocity(bodyId, vx, vy, vz) {
    if (this.exports && bodyId !== null) {
      this.exports.setVelocity(bodyId, Number(vx), Number(vy), Number(vz));
    }
  }

  applyImpulse(bodyId, ix, iy, iz) {
    if (this.exports && bodyId !== null) {
      this.exports.applyImpulse(bodyId, Number(ix), Number(iy), Number(iz));
    }
  }

  applyTorque(bodyId, tx, ty, tz) {
    if (this.exports && bodyId !== null) {
      this.exports.applyTorque(bodyId, Number(tx), Number(ty), Number(tz));
    }
  }

  createExplosion(x, y, z, radius = 15.0, force = 80.0) {
    if (this.exports) {
      this.exports.createExplosion(Number(x), Number(y), Number(z), Number(radius), Number(force));
    }
  }

  getPosition(bodyId) {
    if (!this.exports || bodyId === null) return [0, 0, 0];
    return [
      this.exports.getPositionX(bodyId),
      this.exports.getPositionY(bodyId),
      this.exports.getPositionZ(bodyId)
    ];
  }

  getVelocity(bodyId) {
    if (!this.exports || bodyId === null) return [0, 0, 0];
    return [
      this.exports.getVelocityX(bodyId),
      this.exports.getVelocityY(bodyId),
      this.exports.getVelocityZ(bodyId)
    ];
  }

  getRotation(bodyId) {
    if (!this.exports || bodyId === null) return [0, 0, 0];
    return [
      this.exports.getRotationX(bodyId),
      this.exports.getRotationY(bodyId),
      this.exports.getRotationZ(bodyId)
    ];
  }

  step(dt = 1 / 60) {
    if (this.exports) {
      this.exports.stepSimulation(Number(dt));
    }
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 10000);
  }
}
