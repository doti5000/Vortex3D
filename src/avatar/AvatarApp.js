import { AvatarPage } from '../ui/Pages/AvatarPage.js';

export class AvatarApp {
  constructor() {
    this.init();
  }

  async init() {
    const appEl = document.querySelector('#app');
    appEl.innerHTML = '';
    
    this.avatarPage = new AvatarPage();
    appEl.appendChild(this.avatarPage.container);
  }
}
