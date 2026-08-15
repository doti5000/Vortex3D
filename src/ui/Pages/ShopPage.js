import { getApiBaseUrl } from '../../discover/DiscoverApp.js';

export class ShopPage {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'shop-page';
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';
    this.container.style.background = 'var(--bg-dark)';
    this.container.style.color = 'var(--text-light)';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';

    this.user = null;
    this.assets = [];
    this.searchQuery = '';

    this.init();
  }

  async init() {
    await this.fetchData();
    this.render();
  }

  async fetchData() {
    try {
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
      <div style="padding: 20px 40px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2);">
        <h1 style="font-size: 2rem; font-weight: 700; margin: 0; background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Asset Shop</h1>
        
        <div style="display: flex; gap: 20px; align-items: center;">
          <div style="font-weight: 600; color: #fbbf24; font-size: 1.2rem;">💰 ${this.user ? this.user.vorbucks : 0} Vorbucks</div>
          <button id="btn-back" class="btn btn-secondary">Exit Shop</button>
        </div>
      </div>

      <div style="padding: 20px 40px; display: flex; gap: 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border);">
        <input type="text" id="shop-search" placeholder="Search for hats, shirts, pants..." style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: white;">
      </div>

      <div style="flex: 1; padding: 40px; overflow-y: auto;">
        <div id="shop-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px;">
          <!-- Shop items go here -->
        </div>
      </div>
    `;

    this.container.querySelector('#btn-back').onclick = () => {
      window.location.href = '/?mode=discover';
    };

    const searchInput = this.container.querySelector('#shop-search');
    searchInput.addEventListener('input', () => {
      this.searchQuery = searchInput.value;
      this.renderShopGrid();
    });

    this.renderShopGrid();
  }

  renderShopGrid() {
    const grid = this.container.querySelector('#shop-items-grid');
    grid.innerHTML = '';

    const filteredAssets = this.assets.filter(a => a.name.toLowerCase().includes(this.searchQuery.toLowerCase()));

    if (filteredAssets.length === 0) {
      grid.innerHTML = `<div style="color: var(--text-dim);">No items found matching your search.</div>`;
      return;
    }

    filteredAssets.forEach(asset => {
      const isOwned = this.user && this.user.inventory && this.user.inventory.includes(asset.id);
      
      const itemEl = document.createElement('div');
      itemEl.style.background = 'rgba(255,255,255,0.05)';
      itemEl.style.borderRadius = '12px';
      itemEl.style.padding = '20px';
      itemEl.style.border = '1px solid var(--border)';
      itemEl.style.display = 'flex';
      itemEl.style.flexDirection = 'column';
      itemEl.style.alignItems = 'center';
      itemEl.style.transition = 'transform 0.2s';
      itemEl.onmouseenter = () => itemEl.style.transform = 'scale(1.05)';
      itemEl.onmouseleave = () => itemEl.style.transform = 'scale(1)';

      itemEl.innerHTML = `
        <div style="width: 120px; height: 120px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
           ${asset.textureUrl ? `<img src="${asset.textureUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div style="font-size: 3rem;">🎩</div>`}
        </div>
        <div style="font-weight: 600; font-size: 1.1rem; text-align: center; margin-bottom: 4px;">${asset.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">${asset.type}</div>
        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7); text-align: center; margin-bottom: 16px; flex: 1;">${asset.description}</div>
        
        ${isOwned ? `
          <button class="btn btn-secondary" disabled style="width: 100%; padding: 8px; cursor: not-allowed; opacity: 0.5;">Owned</button>
        ` : `
          <button class="btn btn-primary btn-buy" style="width: 100%; padding: 8px; display: flex; justify-content: center; gap: 8px; font-weight: bold; background: #3b82f6;">
            <span>Buy</span>
            <span style="color: #fbbf24;">💰 ${asset.price}</span>
          </button>
        `}
      `;

      if (!isOwned) {
        itemEl.querySelector('.btn-buy').onclick = () => this.buyItem(asset);
      }
      grid.appendChild(itemEl);
    });
  }

  async buyItem(asset) {
    if (!this.user) {
      alert("Please log in to buy items.");
      return;
    }
    if (this.user.vorbucks < asset.price) {
      alert("You don't have enough Vorbucks!");
      return;
    }
    
    try {
      const token = localStorage.getItem('vortex3d_token');
      const res = await fetch(`${getApiBaseUrl()}/api/shop/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assetId: asset.id })
      });

      if (res.ok) {
        const data = await res.json();
        this.user.vorbucks = data.vorbucks;
        this.user.inventory = data.inventory;
        localStorage.setItem('vortex3d_user', JSON.stringify(this.user));
        this.render();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch(e) {
      console.error(e);
      alert('Failed to purchase item.');
    }
  }
}
