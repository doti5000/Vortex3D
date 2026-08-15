import { Vec3 } from './math';
import { RigidBody } from './body';

export class BVHNode {
  id: i32;
  min: Vec3;
  max: Vec3;
  body: RigidBody | null;
  left: BVHNode | null;
  right: BVHNode | null;

  constructor(id: i32, body: RigidBody | null) {
    this.id = id;
    this.body = body;
    this.left = null;
    this.right = null;
    this.min = body ? body.getAABBMin() : new Vec3();
    this.max = body ? body.getAABBMax() : new Vec3();
  }

  isLeaf(): bool {
    return this.left === null && this.right === null;
  }
}

export class BVHTree {
  root: BVHNode | null;

  constructor() {
    this.root = null;
  }

  insert(body: RigidBody): void {
    const newNode = new BVHNode(body.id, body);
    if (this.root === null) {
      this.root = newNode;
      return;
    }

    // Insert node into tree
    const parent = new BVHNode(-1, null);
    parent.left = this.root;
    parent.right = newNode;
    parent.min = new Vec3(
      Mathf.min(this.root!.min.x, newNode.min.x),
      Mathf.min(this.root!.min.y, newNode.min.y),
      Mathf.min(this.root!.min.z, newNode.min.z)
    );
    parent.max = new Vec3(
      Mathf.max(this.root!.max.x, newNode.max.x),
      Mathf.max(this.root!.max.y, newNode.max.y),
      Mathf.max(this.root!.max.z, newNode.max.z)
    );
    this.root = parent;
  }
}
