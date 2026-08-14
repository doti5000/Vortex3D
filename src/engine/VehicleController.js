import * as THREE from 'three';

export class VehicleController {
  constructor({ id, position = [0, 5, 0], scene, physicsManager }) {
    this.id = id;
    this.scene = scene;
    this.physicsManager = physicsManager;

    this.group = new THREE.Group();
    this.rigidBodyId = null;

    this.steeringAngle = 0;
    this.maxSteerAngle = 0.5;
    this.motorForce = 40;

    this.keys = { w: false, a: false, s: false, d: false, space: false };
    this.wheels = [];

    this.initMesh(position);
    this.initPhysics(position);
    this.setupControls();
  }

  initMesh(position) {
    // 1. Vehicle Body Chassis (4.0 x 1.2 x 2.2)
    const chassisGeo = new THREE.BoxGeometry(4.0, 1.2, 2.2);
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    chassisMesh.position.y = 0.6;
    chassisMesh.castShadow = true;
    this.group.add(chassisMesh);

    // 2. Cabin Hood
    const cabinGeo = new THREE.BoxGeometry(2.0, 0.8, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.1 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(-0.2, 1.4, 0);
    cabinMesh.castShadow = true;
    this.group.add(cabinMesh);

    // 3. 4 Wheels (Radius: 0.5)
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    const wheelPositions = [
      [1.4, 0, 1.2],   // Front Left
      [1.4, 0, -1.2],  // Front Right
      [-1.4, 0, 1.2],  // Rear Left
      [-1.4, 0, -1.2]  // Rear Right
    ];

    for (let i = 0; i < 4; i++) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(...wheelPositions[i]);
      wheel.castShadow = true;
      this.group.add(wheel);
      this.wheels.push(wheel);
    }

    this.group.position.set(...position);
    this.scene.scene.add(this.group);
  }

  initPhysics(position) {
    this.rigidBodyId = this.physicsManager.createRigidBody({
      entityId: this.id,
      bodyType: 1, // Dynamic
      shapeType: 0, // Box
      position: position,
      extents: [4.0, 1.8, 2.2],
      radius: 1.0,
      mass: 8.0,
      restitution: 0.2,
      friction: 0.7
    });
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.keys.w = true;
      if (k === 'a' || k === 'arrowleft') this.keys.a = true;
      if (k === 's' || k === 'arrowdown') this.keys.s = true;
      if (k === 'd' || k === 'arrowright') this.keys.d = true;
      if (k === ' ' || e.code === 'Space') this.keys.space = true;
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.keys.w = false;
      if (k === 'a' || k === 'arrowleft') this.keys.a = false;
      if (k === 's' || k === 'arrowdown') this.keys.s = false;
      if (k === 'd' || k === 'arrowright') this.keys.d = false;
      if (k === ' ' || e.code === 'Space') this.keys.space = false;
    });
  }

  update() {
    if (!this.rigidBodyId) return;

    // Steering
    if (this.keys.a) {
      this.steeringAngle = Math.min(this.maxSteerAngle, this.steeringAngle + 0.05);
    } else if (this.keys.d) {
      this.steeringAngle = Math.max(-this.maxSteerAngle, this.steeringAngle - 0.05);
    } else {
      this.steeringAngle *= 0.8;
    }

    // Front wheels visual steer angle
    this.wheels[0].rotation.y = this.steeringAngle;
    this.wheels[1].rotation.y = this.steeringAngle;

    // Motor acceleration & drift torque
    const rotY = this.group.rotation.y;
    const forwardX = Math.cos(rotY);
    const forwardZ = Math.sin(rotY);

    if (this.keys.w) {
      this.physicsManager.applyImpulse(this.rigidBodyId, forwardX * this.motorForce, 0, forwardZ * this.motorForce);
    } else if (this.keys.s) {
      this.physicsManager.applyImpulse(this.rigidBodyId, -forwardX * (this.motorForce * 0.5), 0, -forwardZ * (this.motorForce * 0.5));
    }

    if (this.steeringAngle !== 0) {
      this.physicsManager.applyTorque(this.rigidBodyId, 0, this.steeringAngle * 35, 0);
    }

    // Sync mesh position and WASM rotation
    const pos = this.physicsManager.getPosition(this.rigidBodyId);
    const rot = this.physicsManager.getRotation(this.rigidBodyId);

    this.group.position.set(pos[0], pos[1], pos[2]);
    this.group.rotation.set(rot[0], rot[1], rot[2]);
  }

  destroy() {
    if (this.rigidBodyId) {
      this.physicsManager.removeRigidBody(this.rigidBodyId);
    }
    this.scene.scene.remove(this.group);
  }
}
