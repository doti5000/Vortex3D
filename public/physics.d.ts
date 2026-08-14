/** Exported memory */
export declare const memory: WebAssembly.Memory;
// Exported runtime interface
export declare function __new(size: number, id: number): number;
export declare function __pin(ptr: number): number;
export declare function __unpin(ptr: number): void;
export declare function __collect(): void;
export declare const __rtti_base: number;
/**
 * src/physics/wasm/assembly/index/initPhysics
 */
export declare function initPhysics(): void;
/**
 * src/physics/wasm/assembly/index/setGravity
 * @param gx `f32`
 * @param gy `f32`
 * @param gz `f32`
 */
export declare function setGravity(gx: number, gy: number, gz: number): void;
/**
 * src/physics/wasm/assembly/index/createRigidBody
 * @param id `i32`
 * @param bodyType `i32`
 * @param shapeType `i32`
 * @param px `f32`
 * @param py `f32`
 * @param pz `f32`
 * @param rx `f32`
 * @param ry `f32`
 * @param rz `f32`
 * @param ex `f32`
 * @param ey `f32`
 * @param ez `f32`
 * @param radius `f32`
 * @param mass `f32`
 * @param restitution `f32`
 * @param friction `f32`
 * @returns `i32`
 */
export declare function createRigidBody(id: number, bodyType: number, shapeType: number, px: number, py: number, pz: number, rx: number, ry: number, rz: number, ex: number, ey: number, ez: number, radius: number, mass: number, restitution: number, friction: number): number;
/**
 * src/physics/wasm/assembly/index/removeRigidBody
 * @param id `i32`
 */
export declare function removeRigidBody(id: number): void;
/**
 * src/physics/wasm/assembly/index/setPosition
 * @param id `i32`
 * @param px `f32`
 * @param py `f32`
 * @param pz `f32`
 */
export declare function setPosition(id: number, px: number, py: number, pz: number): void;
/**
 * src/physics/wasm/assembly/index/setRotation
 * @param id `i32`
 * @param rx `f32`
 * @param ry `f32`
 * @param rz `f32`
 */
export declare function setRotation(id: number, rx: number, ry: number, rz: number): void;
/**
 * src/physics/wasm/assembly/index/setVelocity
 * @param id `i32`
 * @param vx `f32`
 * @param vy `f32`
 * @param vz `f32`
 */
export declare function setVelocity(id: number, vx: number, vy: number, vz: number): void;
/**
 * src/physics/wasm/assembly/index/applyImpulse
 * @param id `i32`
 * @param ix `f32`
 * @param iy `f32`
 * @param iz `f32`
 */
export declare function applyImpulse(id: number, ix: number, iy: number, iz: number): void;
/**
 * src/physics/wasm/assembly/index/applyTorque
 * @param id `i32`
 * @param tx `f32`
 * @param ty `f32`
 * @param tz `f32`
 */
export declare function applyTorque(id: number, tx: number, ty: number, tz: number): void;
/**
 * src/physics/wasm/assembly/index/createExplosion
 * @param ex `f32`
 * @param ey `f32`
 * @param ez `f32`
 * @param radius `f32`
 * @param force `f32`
 */
export declare function createExplosion(ex: number, ey: number, ez: number, radius: number, force: number): void;
/**
 * src/physics/wasm/assembly/index/getPositionX
 * @param id `i32`
 * @returns `f32`
 */
export declare function getPositionX(id: number): number;
/**
 * src/physics/wasm/assembly/index/getPositionY
 * @param id `i32`
 * @returns `f32`
 */
export declare function getPositionY(id: number): number;
/**
 * src/physics/wasm/assembly/index/getPositionZ
 * @param id `i32`
 * @returns `f32`
 */
export declare function getPositionZ(id: number): number;
/**
 * src/physics/wasm/assembly/index/getVelocityX
 * @param id `i32`
 * @returns `f32`
 */
export declare function getVelocityX(id: number): number;
/**
 * src/physics/wasm/assembly/index/getVelocityY
 * @param id `i32`
 * @returns `f32`
 */
export declare function getVelocityY(id: number): number;
/**
 * src/physics/wasm/assembly/index/getVelocityZ
 * @param id `i32`
 * @returns `f32`
 */
export declare function getVelocityZ(id: number): number;
/**
 * src/physics/wasm/assembly/index/getRotationX
 * @param id `i32`
 * @returns `f32`
 */
export declare function getRotationX(id: number): number;
/**
 * src/physics/wasm/assembly/index/getRotationY
 * @param id `i32`
 * @returns `f32`
 */
export declare function getRotationY(id: number): number;
/**
 * src/physics/wasm/assembly/index/getRotationZ
 * @param id `i32`
 * @returns `f32`
 */
export declare function getRotationZ(id: number): number;
/**
 * src/physics/wasm/assembly/index/stepSimulation
 * @param dt `f32`
 */
export declare function stepSimulation(dt: number): void;
