import { GamesPortal } from '../ui/Pages/GamesPortal.js';

export class DiscoverApp {
  constructor() {
    this.init();
  }

  async init() {
    const appEl = document.querySelector('#app');
    appEl.innerHTML = '';
    
    this.gamesPortal = new GamesPortal({
      onJoinGame: (game) => this.joinGame(game),
      onOpenPublisher: () => {
        alert("To publish a new game, please open the Studio Editor.");
        window.location.href = '/?mode=studio';
      }
    });
    
    appEl.appendChild(this.gamesPortal.container);
  }

  joinGame(game) {
    window.location.href = `/?mode=play&id=${game.id}&tunnelUrl=${encodeURIComponent(game.tunnelUrl || '')}`;
  }
}
