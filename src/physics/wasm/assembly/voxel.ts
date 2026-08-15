import { Vec3 } from './math';

export class VoxelRaycastHit {
  hit: bool;
  voxelX: i32;
  voxelY: i32;
  voxelZ: i32;
  normal: Vec3;

  constructor() {
    this.hit = false;
    this.voxelX = 0;
    this.voxelY = 0;
    this.voxelZ = 0;
    this.normal = new Vec3();
  }
}

export class VoxelPhysicsEngine {
  /**
   * 3D DDA (Digital Differential Analyzer) Fast Grid Traversal
   */
  static raycastVoxelGrid(
    origin: Vec3,
    direction: Vec3,
    maxDistance: f32,
    gridSize: f32 = 1.0
  ): VoxelRaycastHit {
    const result = new VoxelRaycastHit();

    let rayX = Math.floor(origin.x / gridSize) as i32;
    let rayY = Math.floor(origin.y / gridSize) as i32;
    let rayZ = Math.floor(origin.z / gridSize) as i32;

    const stepX = direction.x >= f32(0.0) ? 1 : -1;
    const stepY = direction.y >= f32(0.0) ? 1 : -1;
    const stepZ = direction.z >= f32(0.0) ? 1 : -1;

    const deltaX = direction.x != f32(0.0) ? Mathf.abs(gridSize / direction.x) : f32(99999.0);
    const deltaY = direction.y != f32(0.0) ? Mathf.abs(gridSize / direction.y) : f32(99999.0);
    const deltaZ = direction.z != f32(0.0) ? Mathf.abs(gridSize / direction.z) : f32(99999.0);

    let dist = f32(0.0);

    for (let step = 0; step < 64; step++) {
      if (dist > maxDistance) break;

      // Sample ground floor voxel boundary at y <= 0
      if (rayY <= 0) {
        result.hit = true;
        result.voxelX = rayX;
        result.voxelY = rayY;
        result.voxelZ = rayZ;
        result.normal = new Vec3(f32(0.0), f32(1.0), f32(0.0));
        return result;
      }

      if (deltaX < deltaY && deltaX < deltaZ) {
        rayX += stepX;
        dist += deltaX;
      } else if (deltaY < deltaZ) {
        rayY += stepY;
        dist += deltaY;
      } else {
        rayZ += stepZ;
        dist += deltaZ;
      }
    }

    return result;
  }
}
