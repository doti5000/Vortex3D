import { createAuthModal } from './AuthModal.js';

export function createHeader({ onPlay, onPause, onStep, getIsPlaying, onBackendChange, activeBackend, onPresetChange, onExportScene, onImportScene, onOpenPublishModal, onSwitchFace, onModeToggle, activeMode = 'studio' }) {
  const header = document.createElement('header');
  header.className = 'studio-header';

  function getStoredUser() {
    try {
      const u = localStorage.getItem('vortex3d_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  let currentUser = getStoredUser();

  function renderRightAuthSection() {
    const userContainer = header.querySelector('#header-auth-container');
    if (!userContainer) return;

    if (currentUser) {
      userContainer.innerHTML = `
        <div class="user-badge" style="display: flex; align-items: center; gap: 6px; background: #1e293b; border: 1px solid #334155; padding: 4px 10px; border-radius: 20px; font-size: 13px; color: #38bdf8;">
          <span>👤 ${currentUser.username}</span>
          <button id="btn-logout" title="Sign Out" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 12px; margin-left: 4px;">✕</button>
        </div>
      `;
      userContainer.querySelector('#btn-logout').addEventListener('click', () => {
        localStorage.removeItem('vortex3d_token');
        localStorage.removeItem('vortex3d_user');
        currentUser = null;
        renderRightAuthSection();
      });
    } else {
      userContainer.innerHTML = `
        <button id="btn-open-auth" class="btn" style="background: #3b82f6; color: white; border: none; font-weight: 600;">🔐 Sign In / Register</button>
      `;
      userContainer.querySelector('#btn-open-auth').addEventListener('click', () => {
        createAuthModal({
          onAuthSuccess: (user) => {
            currentUser = user;
            renderRightAuthSection();
          }
        });
      });
    }
  }

  header.innerHTML = `
    <!-- Left: Brand & Mode Toggle -->
    <div class="header-left">
      <div class="brand">
        <span>Vortex3D</span>
        <span class="brand-badge">WASM</span>
      </div>

      <div class="nav-mode-toggle">
        <button class="nav-mode-btn ${activeMode === 'studio' ? 'active' : ''}" id="nav-btn-studio">🛠️ Studio</button>
        <button class="nav-mode-btn ${activeMode === 'portal' ? 'active' : ''}" id="nav-btn-portal">🎮 Discover</button>
      </div>
    </div>

    <!-- Center: Simulation Controls & Presets -->
    <div class="header-center">
      <select id="preset-select" class="select-input" title="Select Preset Demo Scene">
        <option value="avatar">Avatar Demo</option>
        <option value="sandbox">Physics Sandbox</option>
        <option value="vehicle">Vehicle Game</option>
        <option value="platformer">Platformer Game</option>
      </select>

      <button id="btn-play-pause" class="btn btn-primary">Play ►</button>
      <button id="btn-step" class="btn">Step ➔</button>
    </div>

    <!-- Right: Auth, Engine, Face, Publish & Tools -->
    <div class="header-right">
      <div id="header-auth-container"></div>

      <select id="face-select" class="select-input" title="Switch Face Decal">
        <option value="/textures/classic-face-texture.png">🎭 Smile</option>
        <option value="/textures/classic-happy-face-texture.png">🎭 Happy</option>
      </select>

      <select id="backend-select" class="select-input" title="Switch WASM Physics Engine Backend">
        <option value="custom" ${activeBackend === 'custom' ? 'selected' : ''}>⚡ Custom WASM</option>
        <option value="rapier" ${activeBackend === 'rapier' ? 'selected' : ''}>⚡ Rapier3D</option>
      </select>

      <button id="btn-publish-game" class="btn btn-success" title="Publish Game Online">🚀 Publish</button>
      <button id="btn-export" class="btn" title="Export Scene JSON">📤 Export</button>
      <button id="btn-import" class="btn" title="Import Scene JSON">📥 Import</button>
      <input type="file" id="file-import" accept=".json" style="display: none;">
    </div>
  `;

  renderRightAuthSection();

  const playPauseBtn = header.querySelector('#btn-play-pause');
  const stepBtn = header.querySelector('#btn-step');

  function updatePlayButtonUI() {
    const playing = getIsPlaying();
    if (playing) {
      playPauseBtn.textContent = 'Pause ❚❚';
      playPauseBtn.className = 'btn btn-danger';
    } else {
      playPauseBtn.textContent = 'Play ►';
      playPauseBtn.className = 'btn btn-primary';
    }
  }

  playPauseBtn.addEventListener('click', () => {
    if (getIsPlaying()) {
      onPause();
    } else {
      onPlay();
    }
    updatePlayButtonUI();
  });

  stepBtn.addEventListener('click', () => {
    onStep();
  });

  header.querySelector('#nav-btn-studio').addEventListener('click', () => {
    if (onModeToggle) onModeToggle('studio');
  });

  header.querySelector('#nav-btn-portal').addEventListener('click', () => {
    if (onModeToggle) onModeToggle('portal');
  });

  header.querySelector('#backend-select').addEventListener('change', (e) => {
    onBackendChange(e.target.value);
  });

  header.querySelector('#preset-select').addEventListener('change', (e) => {
    onPresetChange(e.target.value);
  });

  header.querySelector('#face-select').addEventListener('change', (e) => {
    if (onSwitchFace) onSwitchFace(e.target.value);
  });

  header.querySelector('#btn-publish-game').addEventListener('click', () => {
    const user = getStoredUser();
    if (!user) {
      alert('🔒 Account Sign In Required!\n\nPlease sign in or register a Vortex3D account to publish games online.');
      createAuthModal({
        onAuthSuccess: (u) => {
          currentUser = u;
          renderRightAuthSection();
          if (onOpenPublishModal) onOpenPublishModal();
        }
      });
      return;
    }
    if (onOpenPublishModal) onOpenPublishModal();
  });

  header.querySelector('#btn-export').addEventListener('click', () => onExportScene());

  const fileInput = header.querySelector('#file-import');
  header.querySelector('#btn-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onImportScene(event.target.result);
      reader.readAsText(file);
    }
  });

  return { header, updatePlayButtonUI };
}
