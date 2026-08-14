import { RigidBody } from './body';
import { Vec3 } from './math';
import { Contact } from './collision';

export class PhysicsSolver {
  static resolveContact(c: Contact): void {
    const a = c.bodyA;
    const b = c.bodyB;

    const totalInvMass = a.invMass + b.invMass;
    if (totalInvMass <= f32(0.00001)) return;

    // Relative Velocity at contact point
    const relativeVel = b.velocity.sub(a.velocity);
    const velAlongNormal = relativeVel.dot(c.normal);

    // Do not resolve if velocities are separating
    if (velAlongNormal > f32(0.0)) return;

    // Restitution (bounciness)
    const e = Mathf.min(a.restitution, b.restitution);

    // Calculate normal impulse magnitude
    let j = -(f32(1.0) + e) * velAlongNormal;
    j /= totalInvMass;

    // Apply normal impulse
    const impulse = c.normal.scale(j);
    if (a.bodyType === 1) a.velocity = a.velocity.sub(impulse.scale(a.invMass));
    if (b.bodyType === 1) b.velocity = b.velocity.add(impulse.scale(b.invMass));

    // Calculate Tangent Friction Impulse
    const tangentVel = relativeVel.sub(c.normal.scale(velAlongNormal));
    const tangentLen = tangentVel.length();

    if (tangentLen > f32(0.0001)) {
      const tangentDir = tangentVel.normalize();
      const mu = Mathf.sqrt(a.friction * b.friction);

      let jt = -relativeVel.dot(tangentDir) / totalInvMass;

      // Static vs Dynamic Friction threshold
      if (Mathf.abs(jt) < j * mu * f32(0.8)) {
        jt *= f32(0.8); // Static Friction hold
      } else {
        jt = -j * mu;   // Dynamic Friction sliding
      }

      const frictionImpulse = tangentDir.scale(jt);
      if (a.bodyType === 1) a.velocity = a.velocity.sub(frictionImpulse.scale(a.invMass));
      if (b.bodyType === 1) b.velocity = b.velocity.add(frictionImpulse.scale(b.invMass));

      // Off-center impact generates Angular Torque spin!
      if (b.bodyType === 1) {
        const arm = c.normal.cross(tangentDir).scale(c.penetration * f32(5.0));
        b.angularVelocity = b.angularVelocity.add(arm);
      }
    }

    // Baumgarte Positional Stabilization (Prevents penetrating/phasing into platforms)
    const slop = f32(0.01);
    const percent = f32(0.4);
    const penetrationErr = Mathf.max(c.penetration - slop, f32(0.0));
    const correction = c.normal.scale((penetrationErr / totalInvMass) * percent);

    if (a.bodyType === 1) a.position = a.position.sub(correction.scale(a.invMass));
    if (b.bodyType === 1) b.position = b.position.add(correction.scale(b.invMass));
  }
}
