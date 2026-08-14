// WASM Vector & Matrix Math Kernel for 3D OBB SAT Collisions
export class Vec3 {
  x: f32;
  y: f32;
  z: f32;

  constructor(x: f32 = f32(0.0), y: f32 = f32(0.0), z: f32 = f32(0.0)) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: f32, y: f32, z: f32): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  sub(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s: f32): Vec3 {
    return new Vec3(this.x * s, this.y * s, this.z * s);
  }

  dot(v: Vec3): f32 {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length(): f32 {
    return Mathf.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Vec3 {
    const l = this.length();
    if (l > f32(0.00001)) {
      return this.scale(f32(1.0) / l);
    }
    return new Vec3(f32(0.0), f32(0.0), f32(0.0));
  }
}

/**
 * Computes 3 local orthonormal axes (X, Y, Z) from Euler angles (in radians)
 */
export class RotationMatrix {
  m00: f32; m01: f32; m02: f32;
  m10: f32; m11: f32; m12: f32;
  m20: f32; m21: f32; m22: f32;

  constructor() {
    this.m00 = f32(1.0); this.m01 = f32(0.0); this.m02 = f32(0.0);
    this.m10 = f32(0.0); this.m11 = f32(1.0); this.m12 = f32(0.0);
    this.m20 = f32(0.0); this.m21 = f32(0.0); this.m22 = f32(1.0);
  }

  static fromEuler(euler: Vec3): RotationMatrix {
    const mat = new RotationMatrix();
    const cx = Mathf.cos(euler.x); const sx = Mathf.sin(euler.x);
    const cy = Mathf.cos(euler.y); const sy = Mathf.sin(euler.y);
    const cz = Mathf.cos(euler.z); const sz = Mathf.sin(euler.z);

    // ZYX Euler rotation matrix
    mat.m00 = cy * cz;
    mat.m01 = -cy * sz;
    mat.m02 = sy;

    mat.m10 = sx * sy * cz + cx * sz;
    mat.m11 = -sx * sy * sz + cx * cz;
    mat.m12 = -sx * cy;

    mat.m20 = -cx * sy * cz + sx * sz;
    mat.m21 = cx * sy * sz + sx * cz;
    mat.m22 = cx * cy;

    return mat;
  }

  getAxisX(): Vec3 { return new Vec3(this.m00, this.m10, this.m20); }
  getAxisY(): Vec3 { return new Vec3(this.m01, this.m11, this.m21); }
  getAxisZ(): Vec3 { return new Vec3(this.m02, this.m12, this.m22); }
}
