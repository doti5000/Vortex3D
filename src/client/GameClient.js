import { PhysicsManager } from '../physics/PhysicsManager.js';
import { LuauVM } from '../scripting/LuauVM.js';
import { Scene } from '../engine/Scene.js';
import { Renderer } from '../engine/Renderer.js';
import { Character } from '../engine/Character.js';
import { AudioManager } from '../engine/AudioManager.js';
import { ParticleSystem } from '../engine/ParticleSystem.js';
import { MultiplayerClient } from '../network/MultiplayerClient.js';
import { CanvasUIEngine } from '../ui/CanvasUIEngine.js';
import { getApiBaseUrl } from '../network/api.js';

export class GameClient {
  constructor(gameId, tunnelUrl) {
    this.gameId = gameId;
    this.tunnelUrl = tunnelUrl;

    this.physicsManager = new PhysicsManager();
    this.sceneManager = new Scene('Vortex3D Client');
    this.luauVM = new LuauVM(this.physicsManager, this.sceneManager);

    this.renderer = null;
    this.playerCharacter = null;
    this.audioManager = new AudioManager();
    this.particleSystem = null;
    this.multiplayerClient = null;
    this.canvasUI = null;

    this.init();
  }

  async init() {
    const appEl = document.querySelector('#app');
    appEl.innerHTML = '';
    
    // Create full screen viewport
    const viewportEl = document.createElement('div');
    viewportEl.id = 'viewport';
    viewportEl.style.width = '100vw';
    viewportEl.style.height = '100vh';
    viewportEl.style.position = 'absolute';
    viewportEl.style.top = '0';
    viewportEl.style.left = '0';
    appEl.appendChild(viewportEl);

    // Add a back button
    const backBtn = document.createElement('button');
    backBtn.textContent = '← Leave Game';
    backBtn.style.position = 'absolute';
    backBtn.style.top = '10px';
    backBtn.style.left = '10px';
    backBtn.style.zIndex = '1000';
    backBtn.style.padding = '8px 16px';
    backBtn.style.background = 'rgba(0,0,0,0.5)';
    backBtn.style.color = '#fff';
    backBtn.style.border = '1px solid rgba(255,255,255,0.2)';
    backBtn.style.borderRadius = '4px';
    backBtn.style.cursor = 'pointer';
    backBtn.onclick = () => window.location.href = '/?mode=discover';
    appEl.appendChild(backBtn);

    await this.physicsManager.init();
    await this.luauVM.init();

    this.renderer = new Renderer(viewportEl);
    this.particleSystem = new ParticleSystem(this.renderer.scene);
    this.canvasUI = new CanvasUIEngine(viewportEl, this.renderer, this.sceneManager);
    this.multiplayerClient = new MultiplayerClient(this.renderer, this.physicsManager);

    // Load Game Data
    await this.loadGameData();

    // Start Render Loop
    this.startLoop();
  }

  async loadGameData() {
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/games`);
      if (res.ok) {
        const games = await res.json();
        const game = games.find(g => g.id === this.gameId);
        
        if (game && game.scene_data) {
           this.sceneManager.deserialize(JSON.stringify(game.scene_data));
        } else if (game && game.sceneData) {
           this.sceneManager.deserialize(JSON.stringify(game.sceneData));
        }
      }
    } catch (e) {
      console.warn('Failed to load game scene data from backend:', e);
    }

    this.rebuildPhysicsWorld();

    if (this.sceneManager.entities.size === 0) {
      console.log('Scene is empty. Generating default floor to prevent infinite falling.');
      const floor = this.sceneManager.createEntity('Default Arena Floor');
      floor.transform.position = [0, -1, 0];
      floor.meshRenderer = { enabled: true, geometryType: 'box', color: '#1e293b', roughness: 0.7, metalness: 0.1, wireframe: false };
      floor.rigidBody = { enabled: true, bodyType: 0, mass: 1, restitution: 0.5, friction: 0.5 };
      floor.collider = { enabled: true, shapeType: 0, extents: [80, 2, 80], radius: 1 };
      this.rebuildPhysicsWorld();
    }

    // Spawn local player
    this.playerCharacter = new Character({
      id: 'player_local',
      name: 'Player 1',
      position: [0, 5, 0],
      scene: this.renderer,
      physicsManager: this.physicsManager,
      isLocalPlayer: true
    });
    
    // Setup initial character physics
    const curPos = [this.playerCharacter.group.position.x, Math.max(4.0, this.playerCharacter.group.position.y), this.playerCharacter.group.position.z];
    this.playerCharacter.initPhysics(curPos);

    // Connect to server
    const serverUrl = this.tunnelUrl ? this.tunnelUrl.replace('https', 'wss').replace('http', 'ws') : 'ws://localhost:3001';
    this.multiplayerClient.connect(serverUrl, this.gameId, this.playerCharacter);

    // Start simulation right away for client
    this.startSimulation();
  }

  rebuildPhysicsWorld() {
    for (const entity of this.sceneManager.entities.values()) {
      this.renderer.createOrUpdateEntityMesh(entity);

      if (entity.rigidBody && entity.rigidBody.enabled) {
        if (entity.rigidBodyId) {
          this.physicsManager.removeRigidBody(entity.rigidBodyId);
        }

        const scaledExtents = [
          entity.collider.extents[0] * entity.transform.scale[0],
          entity.collider.extents[1] * entity.transform.scale[1],
          entity.collider.extents[2] * entity.transform.scale[2]
        ];

        entity.rigidBodyId = this.physicsManager.createRigidBody({
          entityId: entity.id,
          bodyType: entity.rigidBody.bodyType,
          shapeType: entity.collider.shapeType,
          position: entity.transform.position,
          rotation: entity.transform.rotation,
          extents: scaledExtents,
          radius: entity.collider.radius * Math.max(...entity.transform.scale),
          mass: entity.rigidBody.mass,
          restitution: entity.rigidBody.restitution,
          friction: entity.rigidBody.friction
        });
      }
    }
  }

  async startSimulation() {
    for (const entity of this.sceneManager.entities.values()) {
      if (entity.luauScript && entity.luauScript.enabled && entity.luauScript.source) {
        await this.luauVM.runEntityScript(entity, entity.luauScript.source);
      }
    }
  }

  syncTransformsFromPhysics() {
    for (const entity of this.sceneManager.entities.values()) {
      if (entity.rigidBodyId && entity.rigidBody && entity.rigidBody.bodyType === 1) { 
        const pos = this.physicsManager.getPosition(entity.rigidBodyId);
        const rot = this.physicsManager.getRotation(entity.rigidBodyId);
        entity.transform.position = pos;
        entity.transform.rotation = rot;
        this.renderer.syncMeshTransform(entity.id, pos, rot);
      }
    }
  }

  checkTouchCollisions() {
    if (!this.playerCharacter || !this.playerCharacter.group) return;
    const charPos = this.playerCharacter.group.position;

    for (const entity of Array.from(this.sceneManager.entities.values())) {
      if (!entity.transform) continue;

      const dx = charPos.x - entity.transform.position[0];
      const dy = charPos.y - entity.transform.position[1];
      const dz = charPos.z - entity.transform.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (entity.isDamageOnTouch && dist < 3.5) {
        this.playerCharacter.takeDamage(25);
        if (this.canvasUI) this.canvasUI.triggerDamageNotice(25, [charPos.x, charPos.y + 2, charPos.z]);
      }

      if (entity.isCoin && dist < 2.5) {
        if (this.audioManager) this.audioManager.playBeep(880, 0.15);
        if (this.particleSystem) this.particleSystem.spawnBurst([entity.transform.position[0], entity.transform.position[1], entity.transform.position[2]], 20, 0xfbbf24);
        if (this.canvasUI) this.canvasUI.addCoins(1);
        
        // Remove coin locally
        const entityObj = this.sceneManager.getEntity(entity.id);
        if (entityObj) {
          if (entityObj.rigidBodyId) this.physicsManager.removeRigidBody(entityObj.rigidBodyId);
          this.renderer.removeEntityMesh(entity.id);
          this.sceneManager.removeEntity(entity.id);
        }
      }
    }
  }

  startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      this.physicsManager.step(1 / 60);
      this.syncTransformsFromPhysics();

      if (this.playerCharacter) {
        const oldState = this.playerCharacter.humanoid.state;
        this.playerCharacter.update();
        if (oldState !== 'jump' && this.playerCharacter.humanoid.state === 'jump') {
          this.audioManager.playSound('jump', [this.playerCharacter.group.position.x, this.playerCharacter.group.position.y, this.playerCharacter.group.position.z]);
        }
        if (this.renderer) this.renderer.followAvatar(this.playerCharacter.group.position);
        if (this.multiplayerClient) this.multiplayerClient.sendLocalState(this.playerCharacter);
      }

      if (this.canvasUI) {
        this.canvasUI.update(this.playerCharacter, 0.016);
        this.checkTouchCollisions();
      }

      if (this.particleSystem) this.particleSystem.update(0.016);
      this.renderer.render();
    };
    animate();
  }
}
