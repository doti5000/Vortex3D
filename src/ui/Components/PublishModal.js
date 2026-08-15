export function createPublishModal({ onPublish, onClose, initialData = {} }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <span>🚀 Publish 3D Game to Public Tunnel</span>
        <button id="modal-close" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem;">✕</button>
      </div>

      <div class="form-row" style="flex-direction: column; align-items: stretch;">
        <label style="width: 100%; margin-bottom: 4px;">Game Title</label>
        <input type="text" id="pub-title" value="${initialData.title || 'My Classic Luau WASM Game'}" placeholder="Enter game title...">
      </div>

      <div class="form-row" style="flex-direction: column; align-items: stretch;">
        <label style="width: 100%; margin-bottom: 4px;">Description</label>
        <textarea id="pub-desc" class="luau-code-area" style="height: 70px; min-height: 70px;" placeholder="Describe game controls and features...">${initialData.description || 'Explore 3D platforms, collect items, and play with classic blocky avatars powered by WASM physics and Luau scripts!'}</textarea>
      </div>

      <div class="form-row">
        <label>Category</label>
        <select id="pub-category">
          <option value="Avatar Playground">Classic R6 Avatar Playground</option>
          <option value="Physics Sandbox">Physics Sandbox & Destruction</option>
          <option value="Vehicle Simulator">3D Vehicle Simulator</option>
          <option value="3D Platformer">3D Luau Platformer</option>
        </select>
      </div>

      <div class="form-row">
        <label>Max Players</label>
        <input type="number" id="pub-max-players" value="8" min="2" max="32">
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px;">
        <button id="btn-cancel" class="btn">Cancel</button>
        <button id="btn-publish-submit" class="btn btn-primary">🚀 Launch & Publish Online</button>
      </div>
    </div>
  `;

  overlay.querySelector('#modal-close').addEventListener('click', () => {
    overlay.remove();
    if (onClose) onClose();
  });

  overlay.querySelector('#btn-cancel').addEventListener('click', () => {
    overlay.remove();
    if (onClose) onClose();
  });

  overlay.querySelector('#btn-publish-submit').addEventListener('click', () => {
    const title = overlay.querySelector('#pub-title').value || 'My 3D Game';
    const description = overlay.querySelector('#pub-desc').value || 'Vortex3D Game';
    const category = overlay.querySelector('#pub-category').value;
    const maxPlayers = parseInt(overlay.querySelector('#pub-max-players').value, 10) || 8;

    onPublish({ title, description, category, maxPlayers });
    overlay.remove();
  });

  document.body.appendChild(overlay);
}
