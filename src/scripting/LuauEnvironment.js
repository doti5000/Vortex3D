// Luau Standard Library & Roblox API Bindings for WASM Engine

export class Vector3JS {
  constructor(x = 0, y = 0, z = 0) {
    this.X = x;
    this.Y = y;
    this.Z = z;
  }

  static new(x = 0, y = 0, z = 0) {
    return new Vector3JS(x, y, z);
  }

  static zero() {
    return new Vector3JS(0, 0, 0);
  }

  static one() {
    return new Vector3JS(1, 1, 1);
  }

  Add(other) {
    return new Vector3JS(this.X + other.X, this.Y + other.Y, this.Z + other.Z);
  }

  Sub(other) {
    return new Vector3JS(this.X - other.X, this.Y - other.Y, this.Z - other.Z);
  }

  Multiply(scalar) {
    if (typeof scalar === 'number') {
      return new Vector3JS(this.X * scalar, this.Y * scalar, this.Z * scalar);
    }
    return new Vector3JS(this.X * scalar.X, this.Y * scalar.Y, this.Z * scalar.Z);
  }

  Divide(scalar) {
    return new Vector3JS(this.X / scalar, this.Y / scalar, this.Z / scalar);
  }

  get Magnitude() {
    return Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
  }

  get Unit() {
    const mag = this.Magnitude;
    return mag > 0 ? this.Divide(mag) : new Vector3JS(0, 0, 0);
  }

  Dot(other) {
    return this.X * other.X + this.Y * other.Y + this.Z * other.Z;
  }

  Cross(other) {
    return new Vector3JS(
      this.Y * other.Z - this.Z * other.Y,
      this.Z * other.X - this.X * other.Z,
      this.X * other.Y - this.Y * other.X
    );
  }

  Lerp(other, alpha) {
    return new Vector3JS(
      this.X + (other.X - this.X) * alpha,
      this.Y + (other.Y - this.Y) * alpha,
      this.Z + (other.Z - this.Z) * alpha
    );
  }
}

export class SignalJS {
  constructor() {
    this.listeners = new Set();
  }

  Connect(callback) {
    this.listeners.add(callback);
    return {
      Disconnect: () => this.listeners.delete(callback)
    };
  }

  Fire(...args) {
    for (const listener of this.listeners) {
      try {
        listener(...args);
      } catch (err) {
        console.error('Signal listener error:', err);
      }
    }
  }
}

export function createLuauEnvironment(physicsManager, scene) {
  const task = {
    wait: (seconds = 0) => new Promise(resolve => setTimeout(resolve, seconds * 1000)),
    spawn: (fn) => setTimeout(fn, 0),
    delay: (seconds, fn) => setTimeout(fn, seconds * 1000)
  };

  const Color3 = {
    fromRGB: (r, g, b) => ({ R: r / 255, G: g / 255, B: b / 255 }),
    new: (r, g, b) => ({ R: r, G: g, B: b })
  };

  const CFrame = {
    new: (x, y, z) => ({
      Position: new Vector3JS(x, y, z),
      LookVector: new Vector3JS(0, 0, -1)
    }),
    lookAt: (at, lookAt) => ({
      Position: at,
      LookVector: lookAt.Sub(at).Unit
    })
  };

  const workspace = {
    Gravity: 9.81,
    Raycast: (origin, dir, maxDist = 100) => {
      const hit = physicsManager.raycast([origin.X, origin.Y, origin.Z], [dir.X, dir.Y, dir.Z], maxDist);
      if (hit) {
        const entity = scene.getEntity(hit.entityId);
        return {
          Instance: entity,
          Position: new Vector3JS(...physicsManager.getPosition(hit.bodyId)),
          Normal: new Vector3JS(0, 1, 0)
        };
      }
      return null;
    }
  };

  const game = {
    Workspace: workspace,
    GetService: (serviceName) => {
      if (serviceName === 'Workspace') return workspace;
      if (serviceName === 'PhysicsService') return physicsManager;
      return null;
    }
  };

  return {
    Vector3: Vector3JS,
    Color3,
    CFrame,
    task,
    workspace,
    game,
    Signal: SignalJS
  };
}
