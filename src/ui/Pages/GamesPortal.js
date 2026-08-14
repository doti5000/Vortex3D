export class GamesPortal {
  constructor({ onJoinGame, onOpenPublisher }) {
    this.onJoinGame = onJoinGame;
    this.onOpenPublisher = onOpenPublisher;
    this.container = document.createElement('div');
    this.container.className = 'games-portal';

    this.searchQuery = '';
    this.selectedCategory = 'All';
    this.publishedGames = [];
    this.isLoading = true;

    this.fetchRealGames();
    this.render();
  }

  async fetchRealGames() {
    try {
      this.isLoading = true;
      const res = await fetch('http://localhost:3001/api/games');
      if (res.ok) {
        this.publishedGames = await res.json();
      }
    } catch (err) {
      console.warn('Could not fetch games list from backend:', err);
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  async addPublishedGame(gameData) {
    try {
      const res = await fetch('http://localhost:3001/api/games/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      if (res.ok) {
        await this.fetchRealGames();
      }
    } catch (err) {
      console.error('Failed to publish game to backend API:', err);
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="portal-hero">
        <h1>Discover & Play 3D WebAssembly Games</h1>
        <p>Explore live multiplayer 3D games published over Cloudflare Tunnels, stored on PostgreSQL database & local disk storage.</p>
      </div>

      <div class="portal-controls">
        <input type="text" id="portal-search" class="search-input" placeholder="🔍 Search published games..." value="${this.searchQuery}">
        <select id="portal-category" class="select-input" style="padding: 10px 16px;">
          <option value="All">All Categories</option>
          <option value="Avatar Playground">Avatar Playground</option>
          <option value="Physics Sandbox">Physics Sandbox</option>
          <option value="Vehicle Simulator">Vehicle Simulator</option>
          <option value="3D Platformer">3D Platformer</option>
        </select>
        <button id="btn-portal-publish" class="btn btn-primary" style="padding: 10px 20px;">🚀 Publish New Game</button>
      </div>

      <div class="games-grid" id="games-grid"></div>
    `;

    const grid = this.container.querySelector('#games-grid');

    if (this.isLoading) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; color: #38bdf8; text-align: center; padding: 40px; font-weight: 600;">🔄 Loading live games from PostgreSQL database...</div>`;
      return;
    }

    const filteredGames = this.publishedGames.filter(g => {
      const matchesSearch = (g.title || '').toLowerCase().includes(this.searchQuery.toLowerCase()) || (g.description || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCat = this.selectedCategory === 'All' || g.category === this.selectedCategory;
      return matchesSearch && matchesCat;
    });

    if (filteredGames.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; color: var(--text-dim); text-align: center; padding: 40px;">No published games found in database. Click <b>"🚀 Publish New Game"</b> to create the first live game!</div>`;
    } else {
      for (const game of filteredGames) {
        const icon = game.title.includes('Vehicle') ? '🏎️' : game.title.includes('Platformer') ? '🪙' : game.title.includes('Sandbox') ? '💥' : '🎭';
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
          <div class="game-card-banner">
            <span style="font-size: 3rem;">${icon}</span>
            <div class="game-badge">
              <div class="game-badge-dot"></div>
              <span>ONLINE</span>
            </div>
          </div>
          <div class="game-card-body">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="game-card-title">${game.title}</span>
              <span style="font-size: 0.75rem; background: var(--bg-surface-elevated); padding: 3px 8px; border-radius: 4px; color: var(--accent); font-weight: 600;">WASM Engine</span>
            </div>
            <p class="game-card-desc">${game.description || 'Live Vortex3D multiplayer game.'}</p>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;">Creator: <b>${game.creator_name || game.user_id || 'User'}</b></div>
            <div class="game-card-footer">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">👤 ${game.plays || 1} Plays</span>
              <button class="btn btn-primary btn-join-game">🎮 Join Game</button>
            </div>
          </div>
        `;

        card.querySelector('.btn-join-game').addEventListener('click', () => {
          this.onJoinGame(game);
        });

        grid.appendChild(card);
      }
    }

    // Event Bindings
    this.container.querySelector('#portal-search').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
    });

    this.container.querySelector('#portal-category').addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.render();
    });

    this.container.querySelector('#btn-portal-publish').addEventListener('click', () => {
      this.onOpenPublisher();
    });
  }
}
