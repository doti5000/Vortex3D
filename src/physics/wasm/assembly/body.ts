import { Vec3 } from './math';

export class RigidBody {
  id: i32;
  bodyType: i32; // 0 = Static, 1 = Dynamic, 2 = Kinematic
  shapeType: i32; // 0 = Box, 1 = Sphere, 2 = Plane

  position: Vec3;
  rotationEuler: Vec3;
  velocity: Vec3;
  angularVelocity: Vec3;
  force: Vec3;
  torque: Vec3;

  extents: Vec3; // [width, height, depth]
  radius: f32;

  mass: f32;
  invMass: f32;
  inertia: f32;
  invInertia: f32;

  restitution: f32;
  friction: f32;
  linearDamping: f32;
  angularDamping: f32;

  constructor(id: i32, bodyType: i32, shapeType: i32) {
    this.id = id;
    this.bodyType = bodyType;
    this.shapeType = shapeType;

    this.position = new Vec3();
    this.rotationEuler = new Vec3();
    this.velocity = new Vec3();
    this.angularVelocity = new Vec3();
    this.force = new Vec3();
    this.torque = new Vec3();

    this.extents = new Vec3(f32(1.0), f32(1.0), f32(1.0));
    this.radius = f32(1.0);

    this.mass = f32(1.0);
    this.invMass = f32(1.0);
    this.inertia = f32(1.0);
    this.invInertia = f32(1.0);

    this.restitution = f32(0.3);
    this.friction = f32(0.5);
    this.linearDamping = f32(0.995);
    this.angularDamping = f32(0.98);
  }

  setMass(m: f32): void {
    if (this.bodyType === 0) { // Static
      this.mass = f32(0.0);
      this.invMass = f32(0.0);
      this.inertia = f32(0.0);
      this.invInertia = f32(0.0);
    } else {
      this.mass = m;
      this.invMass = f32(1.0) / m;
      this.inertia = f32(0.4) * m * this.radius * this.radius + f32(0.166) * m * (this.extents.x * this.extents.x + this.extents.y * this.extents.y);
      this.invInertia = f32(1.0) / this.inertia;
    }
  }

  getAABBMin(): Vec3 {
    const halfX = this.extents.x * f32(0.5);
    const halfY = this.extents.y * f32(0.5);
    const halfZ = this.extents.z * f32(0.5);
    const r = Mathf.max(halfX, Mathf.max(halfY, halfZ)) * f32(1.414);
    return new Vec3(this.position.x - r, this.position.y - r, this.position.z - r);
  }

  getAABBMax(): Vec3 {
    const halfX = this.extents.x * f32(0.5);
    const halfY = this.extents.y * f32(0.5);
    const halfZ = this.extents.z * f32(0.5);
    const r = Mathf.max(halfX, Mathf.max(halfY, halfZ)) * f32(1.414);
    return new Vec3(this.position.x + r, this.position.y + r, this.position.z + r);
  }

  applyForce(f: Vec3): void {
    if (this.bodyType !== 1) return;
    this.force = this.force.add(f);
  }

  applyTorque(t: Vec3): void {
    if (this.bodyType !== 1) return;
    this.torque = this.torque.add(t);
  }

  integrate(dt: f32): void {
    if (this.bodyType !== 1) return; // Only dynamic bodies move

    // Linear Integration
    const accel = this.force.scale(this.invMass);
    this.velocity = this.velocity.add(accel.scale(dt));
    this.velocity = this.velocity.scale(this.linearDamping);
    this.position = this.position.add(this.velocity.scale(dt));

    // Angular Integration (Tumbling spin dynamics)
    const alpha = this.torque.scale(this.invInertia);
    this.angularVelocity = this.angularVelocity.add(alpha.scale(dt));
    this.angularVelocity = this.angularVelocity.scale(this.angularDamping);
    this.rotationEuler = this.rotationEuler.add(this.angularVelocity.scale(dt));

    // Reset forces & torques
    this.force.set(f32(0.0), f32(0.0), f32(0.0));
    this.torque.set(f32(0.0), f32(0.0), f32(0.0));
  }
}
