// WASM Luau Execution Engine using wasmoon
import * as Wasmoon from 'wasmoon';
import { LuauTranspiler } from './LuauTranspiler.js';
import { createLuauEnvironment } from './LuauEnvironment.js';

const LuaFactory = Wasmoon.LuaFactory || (Wasmoon.default && Wasmoon.default.LuaFactory);

export class LuauVM {
  constructor(physicsManager, scene) {
    this.factory = (LuaFactory ? new LuaFactory() : null);
    this.lua = null;
    this.isReady = false;
    this.physicsManager = physicsManager;
    this.scene = scene;
    this.runningScripts = new Map(); // entityId -> { scriptCode, state }
    this.logs = [];
    this.onLogCallback = null;
  }

  async init() {
    try {
      if (!this.factory) {
        if (Wasmoon.LuaFactory) {
          this.factory = new Wasmoon.LuaFactory();
        } else {
          console.warn('Wasmoon LuaFactory export unavailable, using fallback JS Luau evaluator.');
          this.isReady = true;
          return;
        }
      }
      this.lua = await this.factory.createEngine();
      this.isReady = true;
      console.log('Luau WASM Engine initialized.');
    } catch (err) {
      console.warn('Luau WASM VM engine load notice:', err);
      this.isReady = true;
    }
  }

  log(type, ...args) {
    const text = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    const entry = { type, text, timestamp: new Date().toLocaleTimeString() };
    this.logs.push(entry);
    if (this.logs.length > 200) this.logs.shift();
    if (this.onLogCallback) this.onLogCallback(entry, this.logs);
  }

  onLog(cb) {
    this.onLogCallback = cb;
  }

  async runEntityScript(entity, scriptCode) {
    if (!scriptCode) return;

    try {
      const transpiledCode = LuauTranspiler.transpile(scriptCode);
      const env = createLuauEnvironment(this.physicsManager, this.scene);

      // Create Parent Instance wrapper for script.Parent
      const scriptParent = {
        Name: entity.name,
        ApplyImpulse: (impulse) => {
          if (entity.rigidBodyId) {
            this.physicsManager.applyImpulse(entity.rigidBodyId, impulse.X, impulse.Y, impulse.Z);
          }
        },
        SetVelocity: (vel) => {
          if (entity.rigidBodyId) {
            this.physicsManager.setVelocity(entity.rigidBodyId, vel.X, vel.Y, vel.Z);
          }
        },
        SetPosition: (pos) => {
          entity.transform.position = [pos.X, pos.Y, pos.Z];
          if (entity.rigidBodyId) {
            this.physicsManager.setPosition(entity.rigidBodyId, pos.X, pos.Y, pos.Z);
          }
        },
        Touched: new env.Signal()
      };

      Object.defineProperty(scriptParent, 'Position', {
        get: () => env.Vector3.new(entity.transform.position[0], entity.transform.position[1], entity.transform.position[2]),
        set: (pos) => scriptParent.SetPosition(pos)
      });

      if (this.lua) {
        // Set globals in Luau WASM State
        this.lua.global.set('Vector3', env.Vector3);
        this.lua.global.set('Color3', env.Color3);
        this.lua.global.set('CFrame', env.CFrame);
        this.lua.global.set('task', env.task);
        this.lua.global.set('workspace', env.workspace);
        this.lua.global.set('game', env.game);
        this.lua.global.set('script', { Parent: scriptParent });
        this.lua.global.set('print', (...args) => this.log('info', `[${entity.name}]`, ...args));
        this.lua.global.set('warn', (...args) => this.log('warn', `[${entity.name}]`, ...args));
        this.lua.global.set('error', (...args) => this.log('error', `[${entity.name}]`, ...args));

        await this.lua.doString(transpiledCode);
      } else {
        // Fallback JS Evaluator for Luau environment
        const scriptContext = {
          Vector3: env.Vector3,
          Color3: env.Color3,
          CFrame: env.CFrame,
          task: env.task,
          workspace: env.workspace,
          game: env.game,
          script: { Parent: scriptParent },
          print: (...args) => this.log('info', `[${entity.name}]`, ...args),
          warn: (...args) => this.log('warn', `[${entity.name}]`, ...args),
          error: (...args) => this.log('error', `[${entity.name}]`, ...args)
        };

        const jsCode = transpiledCode.replace(/local\s+/g, 'let ');
        const fn = new Function('Vector3', 'Color3', 'CFrame', 'task', 'workspace', 'game', 'script', 'print', 'warn', 'error', jsCode);
        fn(
          scriptContext.Vector3,
          scriptContext.Color3,
          scriptContext.CFrame,
          scriptContext.task,
          scriptContext.workspace,
          scriptContext.game,
          scriptContext.script,
          scriptContext.print,
          scriptContext.warn,
          scriptContext.error
        );
      }

      this.runningScripts.set(entity.id, { scriptCode, parent: scriptParent });
    } catch (err) {
      this.log('error', `Luau execution error on ${entity.name}:`, err.message || err);
    }
  }

  stopEntityScript(entityId) {
    this.runningScripts.delete(entityId);
  }

  stopAll() {
    this.runningScripts.clear();
  }
}
