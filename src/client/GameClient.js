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
    backBtn.onclick = () => {
      if (this.multiplayerClient) this.multiplayerClient.disconnect();
      window.location.href = '/?mode=discover';
    };
    appEl.appendChild(backBtn);

    // Chat UI
    const isGuest = !localStorage.getItem('vortex3d_token');
    
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.style.position = 'absolute';
    chatContainer.style.top = '50px';
    chatContainer.style.left = '10px';
    chatContainer.style.width = '300px';
    chatContainer.style.height = '250px';
    chatContainer.style.zIndex = '1000';
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.background = 'rgba(15, 23, 42, 0.6)';
    chatContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    chatContainer.style.borderRadius = '8px';
    chatContainer.style.overflow = 'hidden';
    chatContainer.style.transition = 'height 0.2s';
    
    let chatMinimized = false;
    
    const chatHeader = document.createElement('div');
    chatHeader.style.padding = '8px';
    chatHeader.style.background = 'rgba(0,0,0,0.5)';
    chatHeader.style.color = '#cbd5e1';
    chatHeader.style.fontSize = '12px';
    chatHeader.style.fontWeight = 'bold';
    chatHeader.style.cursor = 'pointer';
    chatHeader.style.display = 'flex';
    chatHeader.style.justifyContent = 'space-between';
    chatHeader.innerHTML = `<span>💬 Chat</span><span id="chat-toggle">▼</span>`;
    chatHeader.onclick = () => {
      chatMinimized = !chatMinimized;
      chatContainer.style.height = chatMinimized ? '34px' : '250px';
      chatHeader.querySelector('#chat-toggle').textContent = chatMinimized ? '▲' : '▼';
    };
    
    const chatLog = document.createElement('div');
    chatLog.id = 'chat-log';
    chatLog.style.flex = '1';
    chatLog.style.padding = '8px';
    chatLog.style.overflowY = 'auto';
    chatLog.style.color = '#f8fafc';
    chatLog.style.fontSize = '13px';
    chatLog.style.display = 'flex';
    chatLog.style.flexDirection = 'column';
    chatLog.style.gap = '4px';
    
    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = isGuest ? "Guests cannot chat. Please sign in." : "Press Enter to chat...";
    chatInput.disabled = isGuest;
    chatInput.style.padding = '8px';
    chatInput.style.border = 'none';
    chatInput.style.borderTop = '1px solid rgba(255,255,255,0.1)';
    chatInput.style.background = 'rgba(0,0,0,0.4)';
    chatInput.style.color = '#fff';
    chatInput.style.outline = 'none';
    
    chatInput.addEventListener('keydown', (e) => {
      // Prevent WASD keys from moving the character while typing
      e.stopPropagation();
      if (e.key === 'Enter' && chatInput.value.trim().length > 0 && this.multiplayerClient) {
        this.multiplayerClient.sendChat(chatInput.value.trim());
        chatInput.value = '';
      }
    });

    chatContainer.appendChild(chatHeader);
    chatContainer.appendChild(chatLog);
    chatContainer.appendChild(chatInput);
    appEl.appendChild(chatContainer);
    this.chatLog = chatLog;

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

    let user = null;
    try {
      const uStr = localStorage.getItem('vortex3d_user');
      if (uStr) user = JSON.parse(uStr);
    } catch (e) {}
    
    let avatarConfig = {};
    let skinColors = undefined;

    // Resolve equipped assets to texture URLs
    if (user && user.equipped) {
      try {
        const assetsRes = await fetch(`${getApiBaseUrl()}/api/shop/assets`);
        const assets = await assetsRes.json();
        
        ['shirt', 'pants', 'face', 'hat'].forEach(type => {
          if (user.equipped[type]) {
            const equippedIds = Array.isArray(user.equipped[type]) ? user.equipped[type] : [user.equipped[type]];
            if (type === 'hat') {
              avatarConfig.hat = equippedIds.map(id => assets.find(a => a.id === id)).filter(Boolean).map(a => a.modelType);
            } else {
              const asset = assets.find(a => a.id === equippedIds[0]);
              if (asset) avatarConfig[type] = asset.textureUrl || asset.modelType;
            }
          }
        });
        
        if (user.skinColors && Object.keys(user.skinColors).length > 0) {
          skinColors = user.skinColors;
        }
      } catch(e) {
        console.warn('Failed to resolve avatar assets:', e);
      }
    }

    const guestId = Math.floor(Math.random() * 9999);
    const playerId = user ? user.id : 'guest_' + guestId;
    const playerName = user ? user.username : 'Guest ' + guestId;

    // Spawn local player
    this.playerCharacter = new Character({
      id: playerId,
      name: playerName,
      position: [0, 5, 0],
      scene: this.renderer,
      physicsManager: this.physicsManager,
      isLocalPlayer: true,
      avatarConfig: avatarConfig,
      skinColors: skinColors
    });
    
    if (this.canvasUI) {
      this.canvasUI.playerName = playerName;
    }
    
    // Setup initial character physics
    const curPos = [this.playerCharacter.group.position.x, Math.max(4.0, this.playerCharacter.group.position.y), this.playerCharacter.group.position.z];
    this.playerCharacter.initPhysics(curPos);

    // Re-initialize Network with arguments if overriding
    this.multiplayerClient = new MultiplayerClient(this.renderer, this.physicsManager);
    
    this.multiplayerClient.onChatMessage = (msg) => {
      // Append to DOM chat log
      const msgEl = document.createElement('div');
      msgEl.innerHTML = `<span style="font-weight: bold; color: #a855f7;">${msg.username}:</span> <span style="word-break: break-word;">${msg.text}</span>`;
      this.chatLog.appendChild(msgEl);
      this.chatLog.scrollTop = this.chatLog.scrollHeight;
      
      // Tell CanvasUIEngine to show overhead bubble
      if (this.canvasUI) {
        this.canvasUI.addChatBubble(msg.playerId, msg.text);
      }
    };
    
    // Convert active api base url to wss
    const activeApiUrl = getApiBaseUrl();
    const serverUrl = activeApiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    // We also need to pass the avatar config to the multiplayer server so others see us
    const joinOptions = {
      userId: this.playerCharacter.id,
      username: this.playerCharacter.name,
      avatarConfig: avatarConfig,
      skinColors: skinColors
    };
    await this.multiplayerClient.connect(serverUrl, this.gameId, this.playerCharacter, joinOptions);

    // Sync coins to server
    window.addEventListener('coins_added', (e) => {
      if (this.multiplayerClient && this.multiplayerClient.isConnected) {
        this.multiplayerClient.sendGoldUpdate(e.detail.amount);
      }
    });

    // Graceful disconnect on tab close/reload
    window.addEventListener('beforeunload', () => {
      if (this.multiplayerClient) {
        this.multiplayerClient.disconnect();
      }
    });

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
    let frameHostUpdates = 0;
    const myPeerId = this.multiplayerClient ? this.multiplayerClient.peerId : null;
    const roomState = this.multiplayerClient && this.multiplayerClient.room ? this.multiplayerClient.room.state : null;

    for (const entity of this.sceneManager.entities.values()) {
      if (entity.rigidBodyId !== undefined && entity.rigidBody && entity.rigidBody.bodyType === 1) { 
        const pos = this.physicsManager.getPosition(entity.rigidBodyId);
        const rotEuler = this.physicsManager.getRotation(entity.rigidBodyId);
        entity.transform.position = pos;
        entity.transform.rotation = rotEuler;
        this.renderer.syncMeshTransform(entity.id, pos, rotEuler);
        
        if (myPeerId && roomState && roomState.entities) {
           const networkEntity = roomState.entities.get(entity.id);
           const ownerId = networkEntity ? networkEntity.ownerId : "";
           
           // Check if it's moving locally
           const vel = this.physicsManager.getVelocity(entity.rigidBodyId);
           const speedSq = vel[0]*vel[0] + vel[1]*vel[1] + vel[2]*vel[2];
           
           if (speedSq > 0.05 && ownerId !== myPeerId) {
             // We bumped it, claim ownership
             this.multiplayerClient.sendClaimEntity(entity.id);
           }
           
           if (ownerId === myPeerId && frameHostUpdates < 30) {
             const rotQuat = this.physicsManager.getRotationQuat(entity.rigidBodyId);
             this.multiplayerClient.sendEntityUpdate(entity.id, pos[0], pos[1], pos[2], rotQuat[0], rotQuat[1], rotQuat[2], rotQuat[3]);
             frameHostUpdates++;
           }
        }
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
        const remotePlayers = this.multiplayerClient ? Array.from(this.multiplayerClient.remotePlayers.values()) : [];
        this.canvasUI.update(this.playerCharacter, 0.016, remotePlayers);
        this.checkTouchCollisions();
      }

      if (this.particleSystem) this.particleSystem.update(0.016);
      this.renderer.render();
    };
    animate();
  }
}
