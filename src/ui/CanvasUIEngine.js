import * as THREE from 'three';

export class CanvasUIEngine {
  constructor(containerElement, renderer, sceneManager) {
    this.container = containerElement;
    this.renderer = renderer;
    this.sceneManager = sceneManager;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'canvas-ui-overlay';
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    `;
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.coins = 0;
    this.playerName = 'Player 1';
    this.damageTimer = 0;
    this.activeDamageText = null;
    this.chatBubbles = new Map(); // playerId -> { text, timer }

    this.onResize();
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    if (!this.container) return;
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
  }

  addCoins(amount = 1) {
    this.coins += amount;
    window.dispatchEvent(new CustomEvent('coins_added', { detail: { amount } }));
  }

  addChatBubble(playerId, text) {
    this.chatBubbles.set(playerId, { text, timer: 5.0 }); // Show for 5 seconds
  }

  triggerDamageNotice(amount, pos3D) {
    this.damageTimer = 2.0; // 2 seconds fade
    this.activeDamageText = {
      amount,
      pos3D: [...pos3D]
    };
  }

  update(character, dt = 0.016, remotePlayers = []) {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Render Roblox-style Leaderboard & Leaderstats Overlay (Top Right)
    this.renderLeaderboard(remotePlayers);

    // 2. Render Overhead Canvas Health Bar & Damage Floating Text
    if (character) {
      this.renderOverheadHealthBar(character);
      this.renderChatBubble(character, true);
    }
    
    // 3. Render remote player Chat Bubbles
    for (const rp of remotePlayers) {
      this.renderChatBubble(rp, false);
    }

    // Update timers
    for (const [id, bubble] of this.chatBubbles.entries()) {
      bubble.timer -= dt;
      if (bubble.timer <= 0) {
        this.chatBubbles.delete(id);
      }
    }
  }

  renderLeaderboard(remotePlayers = []) {
    const ctx = this.ctx;
    const x = this.canvas.width - 220;
    const y = 20;
    const width = 200;
    const rowHeight = 30;
    const headerHeight = 40;
    const height = headerHeight + rowHeight + (remotePlayers.length * rowHeight) + 10;

    // Glassmorphism Leaderboard Card
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();

    // Header Title
    ctx.fillStyle = '#6366f1';
    ctx.font = '700 12px "Fira Code", monospace';
    ctx.fillText('🏆 LEADERBOARD', x + 14, y + 24);

    let currentY = y + 50;

    // Local Player Row
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillText(this.playerName, x + 14, currentY);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🪙 ${this.coins}`, x + width - 50, currentY);
    currentY += rowHeight;

    // Remote Players
    for (let i = 0; i < remotePlayers.length; i++) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 13px "Inter", sans-serif';
      ctx.fillText(remotePlayers[i].name, x + 14, currentY);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🪙 ${remotePlayers[i].gold || 0}`, x + width - 50, currentY);
      currentY += rowHeight;
    }

    // Coins Counter (Bottom of leaderboard)
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 13px "Fira Code", monospace';
    ctx.fillText(`🪙 ${this.coins} Coins`, x + 14, height + y + 20);

    ctx.restore();
  }

  renderOverheadHealthBar(character) {
    if (!character || !character.group) return;

    const ctx = this.ctx;
    const worldPos = new THREE.Vector3();
    character.group.getWorldPosition(worldPos);
    worldPos.y += 3.5; // Lifted up to avoid covering the face

    // Project 3D world position to 2D canvas screen space
    const screenVec = worldPos.clone().project(this.renderer.camera);
    if (screenVec.z > 1) return; // Behind camera

    const screenX = (screenVec.x * 0.5 + 0.5) * this.canvas.width;
    const screenY = (-(screenVec.y * 0.5) + 0.5) * this.canvas.height;

    const barWidth = 100;
    const barHeight = 12;
    const barX = screenX - barWidth / 2;
    const barY = screenY;

    const healthRatio = Math.max(0, character.humanoid.health / character.humanoid.maxHealth);

    ctx.save();
    // Background bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Fill health gradient
    const fillWidth = barWidth * healthRatio;
    if (fillWidth > 0) {
      const grad = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
      if (healthRatio > 0.5) {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, '#34d399');
      } else if (healthRatio > 0.25) {
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, '#fbbf24');
      } else {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#f87171');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillWidth, barHeight, 6);
      ctx.fill();
    }

    // Health Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 10px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(character.humanoid.health)} HP`, screenX, barY - 4);

    ctx.restore();
  }

  renderChatBubble(character, isLocal) {
    if (!character || !character.group) return;
    const bubble = this.chatBubbles.get(character.id);
    if (!bubble) return;

    const ctx = this.ctx;
    const worldPos = new THREE.Vector3();
    character.group.getWorldPosition(worldPos);
    worldPos.y += 4.5; // Above the HP bar

    const screenVec = worldPos.clone().project(this.renderer.camera);
    if (screenVec.z > 1) return;

    const screenX = (screenVec.x * 0.5 + 0.5) * this.canvas.width;
    const screenY = (-(screenVec.y * 0.5) + 0.5) * this.canvas.height;

    ctx.save();
    ctx.font = '600 13px "Inter", sans-serif';
    
    // Bubble padding and sizing
    const textWidth = ctx.measureText(bubble.text).width;
    const paddingX = 12;
    const paddingY = 8;
    const bubbleWidth = textWidth + paddingX * 2;
    const bubbleHeight = 13 + paddingY * 2; // ~13px font height
    const bubbleX = screenX - bubbleWidth / 2;
    const bubbleY = screenY - bubbleHeight;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Little tail pointing down
    ctx.beginPath();
    ctx.moveTo(screenX - 5, bubbleY + bubbleHeight);
    ctx.lineTo(screenX + 5, bubbleY + bubbleHeight);
    ctx.lineTo(screenX, bubbleY + bubbleHeight + 6);
    ctx.fill();

    // Text
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(bubble.text, screenX, bubbleY + 18); // manual vertical alignment

    ctx.restore();
  }
}
