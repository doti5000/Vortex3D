import { RigidBody } from './body';
import { Vec3, RotationMatrix } from './math';

export const SHAPE_BOX: i32 = 0;
export const SHAPE_SPHERE: i32 = 1;
export const SHAPE_PLANE: i32 = 2;

export class Contact {
  bodyA: RigidBody;
  bodyB: RigidBody;
  normal: Vec3;
  penetration: f32;

  constructor(a: RigidBody, b: RigidBody, normal: Vec3, penetration: f32) {
    this.bodyA = a;
    this.bodyB = b;
    this.normal = normal;
    this.penetration = penetration;
  }
}

class SatResult {
  minOverlap: f32;
  bestNormal: Vec3;

  constructor() {
    this.minOverlap = f32(99999.0);
    this.bestNormal = new Vec3(f32(0.0), f32(1.0), f32(0.0));
  }
}

export class CollisionDetector {
  /**
   * Fast AABB Broadphase Overlap Filter
   */
  static aabbOverlap(a: RigidBody, b: RigidBody): bool {
    const minA = a.getAABBMin();
    const maxA = a.getAABBMax();
    const minB = b.getAABBMin();
    const maxB = b.getAABBMax();

    return (minA.x <= maxB.x && maxA.x >= minB.x) &&
           (minA.y <= maxB.y && maxA.y >= minB.y) &&
           (minA.z <= maxB.z && maxA.z >= minB.z);
  }

  static detect(a: RigidBody, b: RigidBody): Contact | null {
    if (a.shapeType === SHAPE_BOX && b.shapeType === SHAPE_BOX) {
      return CollisionDetector.obbVsObb(a, b);
    } else if (a.shapeType === SHAPE_SPHERE && b.shapeType === SHAPE_SPHERE) {
      return CollisionDetector.sphereVsSphere(a, b);
    } else if (a.shapeType === SHAPE_SPHERE && b.shapeType === SHAPE_BOX) {
      return CollisionDetector.sphereVsBox(a, b);
    } else if (a.shapeType === SHAPE_BOX && b.shapeType === SHAPE_SPHERE) {
      const c = CollisionDetector.sphereVsBox(b, a);
      if (c !== null) {
        c.normal = c.normal.scale(f32(-1.0));
      }
      return c;
    }
    return null;
  }

  /**
   * 3D Separating Axis Theorem (SAT) for Oriented Bounding Boxes (OBB)
   */
  static obbVsObb(a: RigidBody, b: RigidBody): Contact | null {
    const rotA = RotationMatrix.fromEuler(a.rotationEuler);
    const rotB = RotationMatrix.fromEuler(b.rotationEuler);

    const axesA = [rotA.getAxisX(), rotA.getAxisY(), rotA.getAxisZ()];
    const axesB = [rotB.getAxisX(), rotB.getAxisY(), rotB.getAxisZ()];

    const halfA = a.extents.scale(f32(0.5));
    const halfB = b.extents.scale(f32(0.5));

    const delta = b.position.sub(a.position);
    const res = new SatResult();

    // Test 15 Separation Axes (3 Face A + 3 Face B + 9 Cross Products)
    // 1. Face Axes of Box A
    for (let i = 0; i < 3; i++) {
      if (!CollisionDetector.testSatAxis(axesA[i], delta, axesA, halfA, axesB, halfB, res)) {
        return null;
      }
    }

    // 2. Face Axes of Box B
    for (let i = 0; i < 3; i++) {
      if (!CollisionDetector.testSatAxis(axesB[i], delta, axesA, halfA, axesB, halfB, res)) {
        return null;
      }
    }

    // 3. Edge Cross Product Axes
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const axis = axesA[i].cross(axesB[j]);
        if (axis.length() > f32(0.0001)) {
          const normAxis = axis.normalize();
          if (!CollisionDetector.testSatAxis(normAxis, delta, axesA, halfA, axesB, halfB, res)) {
            return null;
          }
        }
      }
    }

    // Ensure normal points from A to B
    let finalNormal = res.bestNormal;
    if (delta.dot(finalNormal) < f32(0.0)) {
      finalNormal = finalNormal.scale(f32(-1.0));
    }

    return new Contact(a, b, finalNormal, res.minOverlap);
  }

  static testSatAxis(
    axis: Vec3,
    delta: Vec3,
    axesA: Vec3[],
    halfA: Vec3,
    axesB: Vec3[],
    halfB: Vec3,
    res: SatResult
  ): bool {
    const projA = Mathf.abs(halfA.x * axesA[0].dot(axis)) +
                  Mathf.abs(halfA.y * axesA[1].dot(axis)) +
                  Mathf.abs(halfA.z * axesA[2].dot(axis));

    const projB = Mathf.abs(halfB.x * axesB[0].dot(axis)) +
                  Mathf.abs(halfB.y * axesB[1].dot(axis)) +
                  Mathf.abs(halfB.z * axesB[2].dot(axis));

    const dist = Mathf.abs(delta.dot(axis));
    const overlap = (projA + projB) - dist;

    if (overlap <= f32(0.0)) {
      return false; // Separating axis found -> No collision!
    }

    if (overlap < res.minOverlap) {
      res.minOverlap = overlap;
      res.bestNormal = axis;
    }
    return true;
  }

  static sphereVsSphere(a: RigidBody, b: RigidBody): Contact | null {
    const delta = b.position.sub(a.position);
    const dist = delta.length();
    const radiusSum = a.radius + b.radius;

    if (dist >= radiusSum || dist <= f32(0.00001)) {
      return null;
    }

    const normal = delta.scale(f32(1.0) / dist);
    const penetration = radiusSum - dist;
    return new Contact(a, b, normal, penetration);
  }

  static sphereVsBox(sphere: RigidBody, box: RigidBody): Contact | null {
    const halfBox = box.extents.scale(f32(0.5));
    const delta = sphere.position.sub(box.position);

    const closestX = Mathf.max(-halfBox.x, Mathf.min(halfBox.x, delta.x));
    const closestY = Mathf.max(-halfBox.y, Mathf.min(halfBox.y, delta.y));
    const closestZ = Mathf.max(-halfBox.z, Mathf.min(halfBox.z, delta.z));

    const closestPoint = new Vec3(closestX, closestY, closestZ);
    const surfaceDist = delta.sub(closestPoint);
    const dist = surfaceDist.length();

    if (dist > sphere.radius || dist <= f32(0.00001)) {
      return null;
    }

    const normal = surfaceDist.scale(f32(1.0) / dist);
    const penetration = sphere.radius - dist;
    return new Contact(sphere, box, normal, penetration);
  }
}
