import * as THREE from 'three';

export class Vector3JS {
  constructor(x = 0, y = 0, z = 0) {
    this.X = x;
    this.Y = y;
    this.Z = z;
  }

  static new(x = 0, y = 0, z = 0) {
    return new Vector3JS(x, y, z);
  }

  static get zero() {
    return new Vector3JS(0, 0, 0);
  }

  static get one() {
    return new Vector3JS(1, 1, 1);
  }

  static get xAxis() {
    return new Vector3JS(1, 0, 0);
  }

  static get yAxis() {
    return new Vector3JS(0, 1, 0);
  }

  static get zAxis() {
    return new Vector3JS(0, 0, 1);
  }

  Add(v) {
    return new Vector3JS(this.X + v.X, this.Y + v.Y, this.Z + v.Z);
  }

  Sub(v) {
    return new Vector3JS(this.X - v.X, this.Y - v.Y, this.Z - v.Z);
  }

  Scale(s) {
    return new Vector3JS(this.X * s, this.Y * s, this.Z * s);
  }

  get Magnitude() {
    return Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
  }

  get Unit() {
    const mag = this.Magnitude;
    return mag > 0 ? this.Scale(1 / mag) : new Vector3JS(0, 0, 0);
  }
}

export class SignalJS {
  constructor() {
    this.listeners = new Set();
  }

  Connect(callback) {
    this.listeners.add(callback);
    return {
      Connected: true,
      Disconnect: () => this.listeners.delete(callback)
    };
  }

  Once(callback) {
    const wrapper = (...args) => {
      this.listeners.delete(wrapper);
      callback(...args);
    };
    this.listeners.add(wrapper);
    return {
      Connected: true,
      Disconnect: () => this.listeners.delete(wrapper)
    };
  }

  Wait() {
    return new Promise(resolve => {
      const conn = this.Connect((...args) => {
        conn.Disconnect();
        resolve(args.length === 1 ? args[0] : args);
      });
    });
  }

  Fire(...args) {
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(...args);
      } catch (err) {
        console.error('Signal listener error:', err);
      }
    }
  }
}

export class TweenJS {
  constructor(instance, tweenInfo, goals) {
    this.instance = instance;
    this.duration = tweenInfo ? (tweenInfo.time || 1.0) : 1.0;
    this.easingStyle = tweenInfo ? (tweenInfo.easingStyle || 'Quad') : 'Quad';
    this.goals = goals || {};
    this.playbackState = 'Begin';
    this.completedSignal = new SignalJS();
    this.Completed = this.completedSignal;
    this.animFrameId = null;
  }

  Play() {
    this.playbackState = 'Playing';
    const startTime = performance.now();
    const durationMs = this.duration * 1000;

    const startPos = [...(this.instance.transform ? this.instance.transform.position : [0, 0, 0])];

    const animate = (now) => {
      if (this.playbackState !== 'Playing') return;
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      let ease = progress;
      if (this.easingStyle === 'Quad') {
        ease = progress * (2 - progress);
      } else if (this.easingStyle === 'Bounce') {
        ease = progress < 0.5 ? 4 * progress * progress : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1;
      }

      if (this.goals.Position && this.instance.transform) {
        const goalPos = this.goals.Position;
        const targetX = goalPos.X !== undefined ? goalPos.X : goalPos[0];
        const targetY = goalPos.Y !== undefined ? goalPos.Y : goalPos[1];
        const targetZ = goalPos.Z !== undefined ? goalPos.Z : goalPos[2];

        this.instance.transform.position[0] = startPos[0] + (targetX - startPos[0]) * ease;
        this.instance.transform.position[1] = startPos[1] + (targetY - startPos[1]) * ease;
        this.instance.transform.position[2] = startPos[2] + (targetZ - startPos[2]) * ease;
      }

      if (progress < 1.0) {
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        this.playbackState = 'Completed';
        this.completedSignal.Fire();
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  Pause() {
    this.playbackState = 'Paused';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  Cancel() {
    this.playbackState = 'Cancelled';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}

export const TweenServiceJS = {
  Create: (instance, tweenInfo, goals) => new TweenJS(instance, tweenInfo, goals)
};

export function createLuauEnvironment(scene, physicsManager) {
  const task = {
    wait: (seconds = 0.03) => new Promise(res => setTimeout(res, seconds * 1000)),
    spawn: (fn) => setTimeout(fn, 0),
    delay: (seconds, fn) => setTimeout(fn, seconds * 1000)
  };

  const Color3 = {
    fromRGB: (r, g, b) => ({ R: r / 255, G: g / 255, B: b / 255 }),
    new: (r, g, b) => ({ R: r, G: g, B: b })
  };

  const CFrame = {
    new: (x, y, z) => ({
      Position: Vector3JS.new(x, y, z),
      LookVector: Vector3JS.new(0, 0, -1)
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
          Position: Vector3JS.new(...physicsManager.getPosition(hit.bodyId)),
          Normal: Vector3JS.new(0, 1, 0)
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
      if (serviceName === 'TweenService') return TweenServiceJS;
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
    TweenService: TweenServiceJS,
    Signal: SignalJS
  };
}
