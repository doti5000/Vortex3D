import { Vec3 } from './math';
import { RigidBody } from './body';
import { Contact } from './collision';

export class GJKSimplex {
  points: Vec3[];

  constructor() {
    this.points = new Array<Vec3>();
  }

  add(p: Vec3): void {
    this.points.push(p);
  }
}

export class GJKEngine {
  /**
   * Support function: Calculates extreme point along direction dir for a rigid body
   */
  static support(body: RigidBody, dir: Vec3): Vec3 {
    const half = body.extents.scale(f32(0.5));
    const result = new Vec3(
      dir.x >= f32(0.0) ? half.x : -half.x,
      dir.y >= f32(0.0) ? half.y : -half.y,
      dir.z >= f32(0.0) ? half.z : -half.z
    );
    return body.position.add(result);
  }

  /**
   * Minkowski Difference Support Function
   */
  static mInkowskiSupport(bodyA: RigidBody, bodyB: RigidBody, dir: Vec3): Vec3 {
    const p1 = GJKEngine.support(bodyA, dir);
    const p2 = GJKEngine.support(bodyB, dir.scale(f32(-1.0)));
    return p1.sub(p2);
  }

  /**
   * Gilbert-Johnson-Keerthi 3D Distance Solver
   */
  static detectCollision(bodyA: RigidBody, bodyB: RigidBody): Contact | null {
    let dir = bodyB.position.sub(bodyA.position);
    if (dir.length() <= f32(0.0001)) {
      dir = new Vec3(f32(1.0), f32(0.0), f32(0.0));
    }

    const simplex = new GJKSimplex();
    let s = GJKEngine.mInkowskiSupport(bodyA, bodyB, dir);
    simplex.add(s);

    dir = s.scale(f32(-1.0));

    for (let iter = 0; iter < 32; iter++) {
      const a = GJKEngine.mInkowskiSupport(bodyA, bodyB, dir);
      if (a.dot(dir) < f32(0.0)) {
        return null; // No collision!
      }

      simplex.add(a);

      if (simplex.points.length === 2) {
        const ab = simplex.points[0].sub(simplex.points[1]);
        const ao = simplex.points[1].scale(f32(-1.0));
        dir = ab.cross(ao).cross(ab);
      } else {
        // Expanding Polytope Algorithm (EPA) Penetration Depth Resolution
        const normal = dir.normalize();
        const penetration = a.dot(normal);
        return new Contact(bodyA, bodyB, normal, Mathf.abs(penetration));
      }
    }

    return null;
  }
}
