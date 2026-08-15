import { createAuthModal } from './AuthModal.js';

export function createHeader({ onPlay, onPause, onStep, getIsPlaying, onBackendChange, activeBackend, onPresetChange, onExportScene, onImportScene, onOpenPublishModal, onSwitchFace, onModeToggle, activeMode = 'studio', onRecordToggle }) {
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
      const isPhryco = currentUser.provider || currentUser.username.includes('Phryco');
      userContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="user-badge" style="display: flex; align-items: center; gap: 6px; background: #070b19; border: 1px solid ${isPhryco ? '#1a73e8' : '#334155'}; padding: 4px 10px; border-radius: 20px; font-size: 13px; color: ${isPhryco ? '#60a5fa' : '#38bdf8'};">
            <span>${isPhryco ? '🌐' : '👤'} ${currentUser.username}</span>
            <button id="btn-logout" title="Sign Out" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 12px; margin-left: 4px;">✕</button>
          </div>
          <div style="background: rgba(251, 191, 36, 0.15); border: 1px solid #fbbf24; color: #fbbf24; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
            <span>🪙</span> 500
          </div>
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
        <button id="btn-open-auth" class="btn" style="background: #1a73e8; color: white; border: none; font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <span>🌐</span> Phryco SSO / Auth
        </button>
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
      <div class="brand" style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 900; letter-spacing: -0.5px;">Vortex3D</span>
        <span class="brand-badge" style="background: #3b82f6; font-weight: 700;">WASM</span>
        <span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 6px; border-radius: 4px; font-weight: 700;">Phryco LLC</span>
      </div>

      <div class="nav-mode-toggle">
        <button class="nav-mode-btn ${activeMode === 'studio' ? 'active' : ''}" id="nav-btn-studio">🛠️ Studio</button>
        <button class="nav-mode-btn ${activeMode === 'portal' ? 'active' : ''}" id="nav-btn-portal">🎮 Discover</button>
      </div>
    </div>

    <!-- Center: Simulation Controls & Presets -->
    <div class="header-center">
      <select id="preset-select" class="select-input" title="Select Preset Demo Scene" aria-label="Select Preset Demo Scene">
        <option value="avatar">Avatar Demo</option>
        <option value="sandbox">Physics Sandbox</option>
        <option value="vehicle">Vehicle Game</option>
        <option value="platformer">Platformer Game</option>
      </select>

      <button id="btn-play-pause" class="btn btn-primary" aria-label="Toggle Physics Simulation Play Pause">Play ►</button>
      <button id="btn-step" class="btn" aria-label="Single Step Physics Simulation">Step ➔</button>
    </div>

    <!-- Right: Auth, Engine, Face, Publish & Tools -->
    <div class="header-right">
      <div id="header-auth-container"></div>

      <select id="face-select" class="select-input" title="Switch Face Decal" aria-label="Switch Avatar Face Decal">
        <option value="/textures/classic-face-texture.png">🎭 Smile</option>
        <option value="/textures/classic-happy-face-texture.png">🎭 Happy</option>
      </select>

      <select id="backend-select" class="select-input" title="Switch WASM Physics Engine Backend" aria-label="Switch WASM Physics Engine Backend">
        <option value="custom" ${activeBackend === 'custom' ? 'selected' : ''}>⚡ VortexWASM</option>
        <option value="rapier" ${activeBackend === 'rapier' ? 'selected' : ''}>⚡ Rapier3D</option>
      </select>

      <button id="btn-record-canvas" class="btn btn-warning" title="Record 60 FPS Canvas Video" aria-label="Record 60 FPS Canvas Video">📹 Record</button>
      <button id="btn-publish-game" class="btn btn-success" title="Publish Game Online" aria-label="Publish Game Online">🚀 Publish</button>
      <button id="btn-export" class="btn" title="Export Scene JSON" aria-label="Export Scene JSON">📤 Export</button>
      <button id="btn-import" class="btn" title="Import Scene JSON" aria-label="Import Scene JSON">📥 Import</button>
      <input type="file" id="file-import" accept=".json" style="display: none;" aria-label="Upload Scene JSON File">
    </div>
  `;

  renderRightAuthSection();

  const playPauseBtn = header.querySelector('#btn-play-pause');
  const stepBtn = header.querySelector('#btn-step');
  const backendSelect = header.querySelector('#backend-select');
  const presetSelect = header.querySelector('#preset-select');
  const faceSelect = header.querySelector('#face-select');
  const publishBtn = header.querySelector('#btn-publish-game');
  const exportBtn = header.querySelector('#btn-export');
  const importBtn = header.querySelector('#btn-import');
  const importInput = header.querySelector('#file-import');

  const navStudioBtn = header.querySelector('#nav-btn-studio');
  const navPortalBtn = header.querySelector('#nav-btn-portal');

  navStudioBtn.addEventListener('click', () => onModeToggle && onModeToggle('studio'));
  navPortalBtn.addEventListener('click', () => onModeToggle && onModeToggle('portal'));

  playPauseBtn.addEventListener('click', () => {
    if (getIsPlaying()) {
      onPause();
    } else {
      onPlay();
    }
  });

  stepBtn.addEventListener('click', () => onStep());
  backendSelect.addEventListener('change', (e) => onBackendChange(e.target.value));
  presetSelect.addEventListener('change', (e) => onPresetChange(e.target.value));
  faceSelect.addEventListener('change', (e) => onSwitchFace && onSwitchFace(e.target.value));
  publishBtn.addEventListener('click', () => onOpenPublishModal && onOpenPublishModal());
  exportBtn.addEventListener('click', () => onExportScene && onExportScene());

  const recordBtn = header.querySelector('#btn-record-canvas');
  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      if (onRecordToggle) onRecordToggle();
    });
  }

  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => onImportScene && onImportScene(evt.target.result);
      reader.readAsText(file);
    }
  });

  return {
    header,
    updatePlayButtonUI: () => {
      if (getIsPlaying()) {
        playPauseBtn.textContent = 'Pause ❚❚';
        playPauseBtn.classList.remove('btn-primary');
        playPauseBtn.classList.add('btn-warning');
      } else {
        playPauseBtn.textContent = 'Play ►';
        playPauseBtn.classList.remove('btn-warning');
        playPauseBtn.classList.add('btn-primary');
      }
    },
    updateRecordButtonUI: (isRecording) => {
      if (recordBtn) {
        if (isRecording) {
          recordBtn.textContent = '🔴 Recording...';
          recordBtn.style.animation = 'pulse 1s infinite';
        } else {
          recordBtn.textContent = '📹 Record';
          recordBtn.style.animation = 'none';
        }
      }
    }
  };
}
