import { ShopPage } from '../ui/Pages/ShopPage.js';

export class ShopApp {
  constructor() {
    this.init();
  }

  async init() {
    const appEl = document.querySelector('#app');
    appEl.innerHTML = '';
    
    this.shopPage = new ShopPage();
    appEl.appendChild(this.shopPage.container);
  }
}
