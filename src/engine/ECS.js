// Entity Component System for 3D Game Platform

export class Entity {
  constructor(name = 'New Entity') {
    this.id = 'ent_' + Math.random().toString(36).substring(2, 9);
    this.name = name;
    this.parentId = null;
    this.children = [];

    // Core Components
    this.transform = {
      position: [0, 0, 0],
      rotation: [0, 0, 0], // Euler angles in degrees
      scale: [1, 1, 1]
    };

    this.meshRenderer = {
      enabled: true,
      geometryType: 'box', // 'box' | 'sphere' | 'cylinder' | 'plane'
      color: '#4f46e5',
      roughness: 0.4,
      metalness: 0.1,
      wireframe: false
    };

    this.rigidBody = {
      enabled: true,
      bodyType: 1, // 0: Static, 1: Dynamic, 2: Kinematic
      mass: 1.0,
      restitution: 0.5,
      friction: 0.5
    };

    this.collider = {
      enabled: true,
      shapeType: 0, // 0: Box, 1: Sphere
      extents: [1, 1, 1],
      radius: 1.0
    };

    this.light = {
      enabled: false,
      type: 'point', // 'point' | 'directional' | 'spot'
      color: '#ffffff',
      intensity: 1.0,
      distance: 20
    };

    this.luauScript = {
      enabled: true,
      source: `-- Typed Luau Entity Script\nlocal speed: number = 10\nlocal parent = script.Parent\n\nprint("Entity " .. parent.Name .. " initialized!")\n`
    };

    // Internal WASM handle
    this.rigidBodyId = null;
    this.threeMesh = null;
  }
}
