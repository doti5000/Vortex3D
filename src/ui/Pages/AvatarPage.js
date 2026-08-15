import { getApiBaseUrl } from '../../network/api.js';
import * as THREE from 'three';
import { Character } from '../../engine/Character.js';
import { ThumbnailGenerator } from '../../engine/ThumbnailGenerator.js';

export class AvatarPage {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'avatar-page';
    this.container.style.display = 'flex';
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';
    this.container.style.background = 'var(--bg-dark)';
    this.container.style.color = 'var(--text-light)';

    this.user = null;
    this.assets = [];
    this.character = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.init();
  }

  async init() {
    await this.fetchData();
    this.render();
    this.init3DPreview();
  }

  async fetchData() {
    try {
      const uStr = localStorage.getItem('vortex3d_user');
      const token = localStorage.getItem('vortex3d_token');
      if (token) {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          this.user = await res.json();
          localStorage.setItem('vortex3d_user', JSON.stringify(this.user));
        }
      }

      const shopRes = await fetch(`${getApiBaseUrl()}/api/shop/assets`);
      if (shopRes.ok) {
        this.assets = await shopRes.json();
      }
    } catch(e) {
      console.error(e);
    }
  }

  render() {
    this.container.innerHTML = `
      <div style="flex: 1; padding: 40px; display: flex; flex-direction: column; border-right: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <h1 style="font-size: 2rem; font-weight: 700; margin: 0; background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Avatar Editor</h1>
          <button id="btn-back" class="btn btn-secondary" style="padding: 10px 20px;">Exit Avatar Editor</button>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <input type="text" id="avatar-search" placeholder="Search owned items..." style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: white;">
        </div>

        <div id="owned-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; overflow-y: auto; flex: 1; align-content: start;">
          <!-- Owned items go here -->
        </div>
      </div>
      
      <div id="avatar-3d-preview" style="width: 400px; background: #000; position: relative;">
        <div style="position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; pointer-events: none;">
          <div style="font-weight: 600; font-size: 1.2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">${this.user ? this.user.username : 'Guest'}</div>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-back').onclick = () => {
      window.location.href = '/?mode=discover';
    };

    const searchInput = this.container.querySelector('#avatar-search');
    searchInput.addEventListener('input', () => this.renderInventoryGrid(searchInput.value));

    this.renderInventoryGrid();
  }

  renderInventoryGrid(searchQuery = '') {
    const grid = this.container.querySelector('#owned-items-grid');
    grid.innerHTML = '';

    if (!this.user || !this.user.inventory) {
      grid.innerHTML = `<div style="color: var(--text-dim);">No items owned.</div>`;
      return;
    }

    const ownedAssets = this.assets.filter(a => this.user.inventory.includes(a.id) && a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (ownedAssets.length === 0) {
      grid.innerHTML = `<div style="color: var(--text-dim);">No items found. Visit the Shop to buy some!</div>`;
      return;
    }

    ownedAssets.forEach(asset => {
      const isEquipped = this.user.equipped && Object.values(this.user.equipped).includes(asset.id);
      
      const itemEl = document.createElement('div');
      itemEl.style.background = 'rgba(255,255,255,0.05)';
      itemEl.style.borderRadius = '12px';
      itemEl.style.padding = '16px';
      itemEl.style.border = isEquipped ? '2px solid #10b981' : '1px solid var(--border)';
      itemEl.style.display = 'flex';
      itemEl.style.flexDirection = 'column';
      itemEl.style.alignItems = 'center';

      itemEl.innerHTML = `
        <div style="width: 80px; height: 80px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
           <img id="thumb-${asset.id}" style="width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.3s;" />
        </div>
        <div style="font-weight: 600; font-size: 0.9rem; text-align: center; margin-bottom: 4px;">${asset.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: 12px;">${asset.type}</div>
        <button class="btn btn-primary" style="width: 100%; padding: 6px; ${isEquipped ? 'background: #ef4444;' : 'background: #10b981;'}">
          ${isEquipped ? 'Unequip' : 'Equip'}
        </button>
      `;

      itemEl.querySelector('button').onclick = () => this.equipItem(asset, isEquipped);
      grid.appendChild(itemEl);

      ThumbnailGenerator.generateThumbnail(asset).then(url => {
        const img = itemEl.querySelector(`#thumb-${asset.id}`);
        if (img) {
          img.src = url;
          img.style.opacity = '1';
        }
      });
    });
  }

  async equipItem(asset, isEquipped) {
    try {
      const token = localStorage.getItem('vortex3d_token');
      if (!token) return;

      const res = await fetch(`${getApiBaseUrl()}/api/avatar/equip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assetId: asset.id, type: asset.type, unequip: isEquipped })
      });

      if (res.ok) {
        const data = await res.json();
        this.user.equipped = data.equipped;
        localStorage.setItem('vortex3d_user', JSON.stringify(this.user));
        this.renderInventoryGrid();
        this.update3DPreview();
      }
    } catch(e) {
      console.error(e);
    }
  }

  init3DPreview() {
    const previewEl = this.container.querySelector('#avatar-3d-preview');
    if (!previewEl) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#111827');
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    // Directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    this.camera = new THREE.PerspectiveCamera(50, previewEl.clientWidth / previewEl.clientHeight, 0.1, 100);
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 3, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(previewEl.clientWidth, previewEl.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    previewEl.insertBefore(this.renderer.domElement, previewEl.firstChild);

    this.update3DPreview();

    const animate = () => {
      requestAnimationFrame(animate);
      if (this.character && this.character.group) {
        this.character.group.rotation.y += 0.01;
      }
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  update3DPreview() {
    if (this.character && this.character.group) {
      this.scene.remove(this.character.group);
      this.character = null;
    }

    let avatarConfig = {};
    if (this.user && this.user.equipped) {
      ['shirt', 'pants', 'face', 'hat'].forEach(type => {
        if (this.user.equipped[type]) {
          const asset = this.assets.find(a => a.id === this.user.equipped[type]);
          if (asset) avatarConfig[type] = asset.textureUrl || asset.modelType;
        }
      });
    }

    let skinColors = undefined;
    if (this.user && this.user.skinColors && Object.keys(this.user.skinColors).length > 0) {
      skinColors = this.user.skinColors;
    }

    this.character = new Character({
      id: 'preview',
      position: [0, 0, 0],
      scene: { scene: this.scene }, // Mock Renderer structure
      physicsManager: { createRigidBody: () => null, removeRigidBody: () => {} },
      isLocalPlayer: false,
      avatarConfig: avatarConfig,
      skinColors: skinColors
    });
    
    // Remove physics constraints for preview
    this.character.group.position.set(0, 0, 0);
  }
}
