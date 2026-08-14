import { PhysicsManager } from './physics/PhysicsManager.js';
import { LuauVM } from './scripting/LuauVM.js';
import { Scene } from './engine/Scene.js';
import { Renderer } from './engine/Renderer.js';
import { Gizmos } from './engine/Gizmos.js';
import { PhysicsDebug } from './engine/PhysicsDebug.js';
import { Character } from './engine/Character.js';
import { AudioManager } from './engine/AudioManager.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { VehicleController } from './engine/VehicleController.js';
import { MultiplayerClient } from './network/MultiplayerClient.js';
import { getApiBaseUrl } from './network/api.js';

import { createHeader } from './ui/Components/Header.js';
import { createViewport } from './ui/Components/Viewport.js';
import { createHierarchy } from './ui/Components/Hierarchy.js';
import { createInspector } from './ui/Components/Inspector.js';
import { createLuauEditor } from './ui/Components/LuauEditor.js';
import { createPhysicsPanel } from './ui/Components/PhysicsPanel.js';
import { createPublishModal } from './ui/Components/PublishModal.js';
import { GamesPortal } from './ui/Pages/GamesPortal.js';

import { loadLuauSandboxDemo } from './demos/LuauSandboxDemo.js';
import { loadLuauVehicleGame } from './demos/LuauVehicleGame.js';
import { loadLuauPlatformerGame } from './demos/LuauPlatformerGame.js';
import { loadLuauAvatarMultiplayerDemo } from './demos/LuauAvatarMultiplayerDemo.js';

class StudioApp {
  constructor() {
    this.physicsManager = new PhysicsManager();
    this.sceneManager = new Scene('Vortex3D Workspace');
    this.luauVM = new LuauVM(this.physicsManager, this.sceneManager);

    this.renderer = null;
    this.gizmos = null;
    this.physicsDebug = null;
    this.headerUI = null;
    this.playerCharacter = null;
    this.playerVehicle = null;
    this.audioManager = new AudioManager();
    this.particleSystem = null;
    this.multiplayerClient = null;

    this.gamesPortal = null;
    this.workspaceEl = null;

    this.isPlaying = false;
    this.activeMode = 'studio';
    this.activePreset = 'avatar';

    this.init();
  }

  async init() {
    const appEl = document.querySelector('#app');
    appEl.innerHTML = '';

    // Initialize Physics & Luau WASM Engines
    await this.physicsManager.init();
    await this.luauVM.init();

    // Rebuild physics world whenever active engine backend changes
    this.physicsManager.onBackendSwitchedCallback = () => this.rebuildPhysicsWorld();

    // 1. Build Viewport Container
    const viewportEl = createViewport({
      onGizmoModeChange: (mode) => this.gizmos && this.gizmos.setMode(mode),
      onToggleDebugWireframe: (visible) => this.physicsDebug && this.physicsDebug.toggle(visible)
    });

    // 2. Build Sidebar & Panels
    const hierarchyPanel = createHierarchy({
      sceneManager: this.sceneManager,
      onAddEntity: (name, shape) => this.spawnEntity(name, shape),
      onDeleteEntity: (id) => this.deleteEntity(id)
    });

    const rightPanel = document.createElement('div');
    rightPanel.className = 'panel panel-right';

    const tabHeader = document.createElement('div');
    tabHeader.className = 'tab-header';
    tabHeader.innerHTML = `
      <button class="tab-btn active" data-tab="inspector">INSPECTOR</button>
      <button class="tab-btn" data-tab="luau">LUAU SCRIPT</button>
    `;

    const inspectorEl = createInspector({
      sceneManager: this.sceneManager,
      onEntityUpdate: (entity) => this.onEntityUpdate(entity),
      physicsManager: this.physicsManager,
      getPlayerCharacter: () => this.playerCharacter
    });

    const luauEditorEl = createLuauEditor({
      sceneManager: this.sceneManager,
      luauVM: this.luauVM
    });

    luauEditorEl.style.display = 'none';

    tabHeader.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabHeader.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.tab === 'inspector') {
          inspectorEl.style.display = 'block';
          luauEditorEl.style.display = 'none';
        } else {
          inspectorEl.style.display = 'none';
          luauEditorEl.style.display = 'block';
        }
      });
    });

    rightPanel.appendChild(tabHeader);
    rightPanel.appendChild(inspectorEl);
    rightPanel.appendChild(luauEditorEl);

    this.workspaceEl = document.createElement('div');
    this.workspaceEl.className = 'studio-workspace';
    this.workspaceEl.appendChild(hierarchyPanel);
    this.workspaceEl.appendChild(viewportEl);
    this.workspaceEl.appendChild(rightPanel);

    // 3. Build Games Portal Page (Dynamic DB Fetched)
    this.gamesPortal = new GamesPortal({
      onJoinGame: (game) => this.joinPublishedGame(game),
      onOpenPublisher: () => this.openPublishModal()
    });

    // 4. Build Header & Bottom Telemetry Bar
    this.headerUI = createHeader({
      getIsPlaying: () => this.isPlaying,
      onPlay: () => this.startSimulation(),
      onPause: () => this.pauseSimulation(),
      onStep: () => this.stepSimulationOnce(),
      onBackendChange: (backend) => this.physicsManager.setBackend(backend),
      activeBackend: this.physicsManager.activeBackend,
      onPresetChange: (preset) => this.loadPreset(preset),
      onExportScene: () => this.exportScene(),
      onImportScene: (json) => this.importScene(json),
      onOpenPublishModal: () => this.openPublishModal(),
      onSwitchFace: (facePath) => this.switchPlayerFace(facePath),
      onModeToggle: (mode) => this.switchAppMode(mode),
      activeMode: this.activeMode
    });

    const telemetryEl = createPhysicsPanel({
      physicsManager: this.physicsManager
    });

    appEl.appendChild(this.headerUI.header);
    appEl.appendChild(this.workspaceEl);
    appEl.appendChild(this.gamesPortal.container);
    appEl.appendChild(telemetryEl);

    // Initial View Mode: Studio Editor
    this.gamesPortal.container.style.display = 'none';

    // 5. Initialize Three.js Renderer, Gizmos & Particle System
    this.renderer = new Renderer(viewportEl);
    this.gizmos = new Gizmos(this.renderer, this.sceneManager);
    this.physicsDebug = new PhysicsDebug(this.renderer, this.physicsManager, this.sceneManager);
    this.particleSystem = new ParticleSystem(this.renderer.scene);

    // Initialize Multiplayer Client
    this.multiplayerClient = new MultiplayerClient(this.renderer, this.physicsManager);

    // Setup Keyboard Shortcuts (W, E, R for Gizmos, X for WASM Explosion)
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'w') this.gizmos.setMode('translate');
      if (k === 'e') this.gizmos.setMode('rotate');
      if (k === 'r') this.gizmos.setMode('scale');
      if (k === 'x') this.triggerExplosionAtCenter();
    });

    // Load initial avatar playground demo
    this.loadPreset('avatar');

    // Start Render Loop
    this.startLoop();
  }

  triggerExplosionAtCenter() {
    let epicentre = [0, 2, 0];
    if (this.playerCharacter && this.playerCharacter.group) {
      epicentre = [this.playerCharacter.group.position.x, this.playerCharacter.group.position.y, this.playerCharacter.group.position.z];
    }
    this.physicsManager.createExplosion(epicentre[0], epicentre[1], epicentre[2], 20.0, 120.0);
    this.audioManager.playSound('explosion', epicentre);
    this.particleSystem.spawnBurst(epicentre, 45, 0xff3300, 0.4);
  }

  switchAppMode(mode) {
    this.activeMode = mode;
    const studioBtn = document.querySelector('#nav-btn-studio');
    const portalBtn = document.querySelector('#nav-btn-portal');

    if (mode === 'portal') {
      this.workspaceEl.style.display = 'none';
      this.gamesPortal.container.style.display = 'flex';
      if (studioBtn) studioBtn.classList.remove('active');
      if (portalBtn) portalBtn.classList.add('active');
    } else {
      this.workspaceEl.style.display = 'flex';
      this.gamesPortal.container.style.display = 'none';
      if (portalBtn) portalBtn.classList.remove('active');
      if (studioBtn) studioBtn.classList.add('active');
      this.renderer.onResize();
    }
  }

  openPublishModal() {
    createPublishModal({
      onPublish: async (gameData) => {
        let user = null;
        try {
          const uStr = localStorage.getItem('vortex3d_user');
          if (uStr) user = JSON.parse(uStr);
        } catch (e) {}

        let tunnelUrl = 'https://vortex3d-live.trycloudflare.com';
        try {
          const baseUrl = getApiBaseUrl();
          const tunnelRes = await fetch(`${baseUrl}/api/tunnel/session`);
          if (tunnelRes.ok) {
            const tData = await tunnelRes.json();
            if (tData.tunnelUrl) tunnelUrl = tData.tunnelUrl;
          }
        } catch (e) {}

        gameData.tunnelUrl = tunnelUrl + '?room=' + Math.floor(Math.random()*1000);
        gameData.userId = user ? user.id : 'usr_guest';
        gameData.sceneData = this.sceneManager.serialize();

        await this.gamesPortal.addPublishedGame(gameData);
        alert(`🎉 Game Successfully Published to PostgreSQL Database & Cloudflare Tunnel!\n\nTitle: ${gameData.title}\nCreator UserID: ${gameData.userId}\nTunnel Link: ${gameData.tunnelUrl}\n\nYour game is live in the Discover Games Portal!`);
        this.switchAppMode('portal');
      }
    });
  }

  joinPublishedGame(game) {
    alert(`🎮 Connecting to Live Game: "${game.title}"\n\nCloudflare Tunnel: ${game.tunnelUrl || 'Active'}\nCreator: ${game.creator_name || game.user_id || 'User'}\n\nSpawning Player Avatar...`);
    this.switchAppMode('studio');
    this.loadPreset('avatar');

    if (this.playerCharacter) {
      this.multiplayerClient.connect('ws://localhost:3001', game.id, this.playerCharacter);
    }
    this.startSimulation();
  }

  loadPreset(presetName) {
    this.pauseSimulation();
    this.activePreset = presetName;

    // Clear old physics bodies
    for (const entity of this.sceneManager.entities.values()) {
      if (entity.rigidBodyId) {
        this.physicsManager.removeRigidBody(entity.rigidBodyId);
        entity.rigidBodyId = null;
      }
      this.renderer.removeEntityMesh(entity.id);
    }

    if (this.playerCharacter) {
      this.playerCharacter.destroy();
      this.playerCharacter = null;
    }
    if (this.playerVehicle) {
      this.playerVehicle.destroy();
      this.playerVehicle = null;
    }

    if (presetName === 'vehicle') {
      loadLuauVehicleGame(this.sceneManager, this.physicsManager, this.luauVM);
      this.playerVehicle = new VehicleController({
        id: 'vehicle_player',
        position: [0, 4, 0],
        scene: this.renderer,
        physicsManager: this.physicsManager
      });
    } else if (presetName === 'platformer') {
      loadLuauPlatformerGame(this.sceneManager, this.physicsManager, this.luauVM);
      this.playerCharacter = new Character({
        id: 'player_local',
        name: 'Player 1',
        position: [0, 4, 10],
        scene: this.renderer,
        physicsManager: this.physicsManager,
        isLocalPlayer: true
      });
    } else if (presetName === 'sandbox') {
      loadLuauSandboxDemo(this.sceneManager, this.physicsManager, this.luauVM);
    } else {
      loadLuauAvatarMultiplayerDemo(this.sceneManager, this.physicsManager, this.luauVM);
      this.playerCharacter = new Character({
        id: 'player_local',
        name: 'Player 1',
        position: [0, 4, 10],
        scene: this.renderer,
        physicsManager: this.physicsManager,
        isLocalPlayer: true
      });
    }

    this.rebuildPhysicsWorld();
  }

  switchPlayerFace(facePath) {
    if (this.playerCharacter) {
      this.playerCharacter.setFaceTexture(facePath);
    }
  }

  rebuildPhysicsWorld() {
    // 1. Rebuild Scene Entities in active physics engine
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

    // 2. Rebuild Player Avatar rigid body in active physics engine
    if (this.playerCharacter) {
      if (this.playerCharacter.rigidBodyId) {
        this.physicsManager.removeRigidBody(this.playerCharacter.rigidBodyId);
        this.playerCharacter.rigidBodyId = null;
      }
      const curPos = [this.playerCharacter.group.position.x, Math.max(4.0, this.playerCharacter.group.position.y), this.playerCharacter.group.position.z];
      this.playerCharacter.initPhysics(curPos);
    }

    // 3. Rebuild Player Vehicle rigid body in active physics engine
    if (this.playerVehicle) {
      if (this.playerVehicle.rigidBodyId) {
        this.physicsManager.removeRigidBody(this.playerVehicle.rigidBodyId);
        this.playerVehicle.rigidBodyId = null;
      }
      const curPos = [this.playerVehicle.group.position.x, Math.max(4.0, this.playerVehicle.group.position.y), this.playerVehicle.group.position.z];
      this.playerVehicle.initPhysics(curPos);
    }
  }

  spawnEntity(name, shapeType) {
    const ent = this.sceneManager.createEntity(name);
    ent.transform.position = [0, 8, 0];
    if (shapeType === 'sphere') {
      ent.meshRenderer.geometryType = 'sphere';
      ent.collider.shapeType = 1;
    }
    this.rebuildPhysicsWorld();
    this.sceneManager.selectEntity(ent.id);
  }

  deleteEntity(id) {
    const entity = this.sceneManager.getEntity(id);
    if (entity) {
      if (entity.rigidBodyId) this.physicsManager.removeRigidBody(entity.rigidBodyId);
      this.renderer.removeEntityMesh(id);
      this.sceneManager.removeEntity(id);
    }
  }

  onEntityUpdate(entity) {
    this.renderer.createOrUpdateEntityMesh(entity);
    if (entity.rigidBodyId) {
      this.physicsManager.setPosition(entity.rigidBodyId, ...entity.transform.position);
      this.physicsManager.setRotation(entity.rigidBodyId, ...entity.transform.rotation);
    }
  }

  async startSimulation() {
    this.isPlaying = true;
    if (this.headerUI) this.headerUI.updatePlayButtonUI();

    for (const entity of this.sceneManager.entities.values()) {
      if (entity.luauScript && entity.luauScript.enabled && entity.luauScript.source) {
        await this.luauVM.runEntityScript(entity, entity.luauScript.source);
      }
    }
  }

  pauseSimulation() {
    this.isPlaying = false;
    if (this.headerUI) this.headerUI.updatePlayButtonUI();
    this.luauVM.stopAll();
  }

  stepSimulationOnce() {
    this.physicsManager.step(1 / 60);
    this.syncTransformsFromPhysics();
    if (this.playerCharacter) {
      this.playerCharacter.update();
      if (this.renderer) this.renderer.followAvatar(this.playerCharacter.group.position);
    }
    if (this.playerVehicle) {
      this.playerVehicle.update();
      if (this.renderer) this.renderer.followAvatar(this.playerVehicle.group.position);
    }
    if (this.particleSystem) this.particleSystem.update(0.016);
    if (this.physicsDebug) this.physicsDebug.update();
    if (this.renderer) this.renderer.render();
  }

  syncTransformsFromPhysics() {
    for (const entity of this.sceneManager.entities.values()) {
      if (entity.rigidBodyId && entity.rigidBody && entity.rigidBody.bodyType === 1) { // Dynamic
        const pos = this.physicsManager.getPosition(entity.rigidBodyId);
        const rot = this.physicsManager.getRotation(entity.rigidBodyId);
        entity.transform.position = pos;
        this.renderer.syncMeshTransform(entity.id, pos, rot);
      }
    }
  }

  exportScene() {
    const json = this.sceneManager.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sceneManager.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importScene(jsonString) {
    this.sceneManager.deserialize(jsonString);
    this.rebuildPhysicsWorld();
  }

  startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      if (this.isPlaying) {
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

        if (this.playerVehicle) {
          this.playerVehicle.update();
          if (this.renderer) this.renderer.followAvatar(this.playerVehicle.group.position);
        }
      }

      if (this.particleSystem) this.particleSystem.update(0.016);
      this.physicsDebug.update();
      this.renderer.render();
    };
    animate();
  }
}

new StudioApp();
