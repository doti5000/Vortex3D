export function createInspector({ sceneManager, onEntityUpdate, physicsManager, getPlayerCharacter }) {
  const panel = document.createElement('div');
  panel.className = 'panel-body';

  function renderInspector() {
    const playerChar = getPlayerCharacter ? getPlayerCharacter() : null;
    const selectedId = sceneManager.selectedEntityId;
    const entity = selectedId ? sceneManager.getEntity(selectedId) : null;

    panel.innerHTML = `
      <!-- GLOBAL PHYSICS CONFIGS -->
      <div class="form-section">
        <div class="form-section-title" style="color: #10b981;">GLOBAL PHYSICS CONFIGS</div>
        <div class="form-row">
          <label>Gravity (m/s²)</label>
          <input type="range" min="-30" max="10" step="0.5" id="inp-gravity" value="-9.81">
          <span id="lbl-gravity" style="font-family: var(--font-mono); font-size: 0.75rem; width: 40px;">-9.81</span>
        </div>
      </div>



      <!-- PLAYER CONTROLS & DEBUG -->
      <div class="form-section">
        <div class="form-section-title" style="color: #8b5cf6;">PLAYER CONTROLS & DEBUG</div>
          <label>Walk Speed</label>
          <input type="range" min="5" max="60" step="1" id="inp-speed" value="${playerChar ? playerChar.humanoid.walkSpeed : 18}">
          <span id="lbl-speed" style="font-family: var(--font-mono); font-size: 0.75rem; width: 35px;">${playerChar ? playerChar.humanoid.walkSpeed : 18}</span>
        </div>
        <div class="form-row">
          <label>Avatar Size</label>
          <input type="range" min="0.5" max="2.5" step="0.1" id="inp-size" value="${playerChar ? playerChar.humanoid.sizeScale : 1.0}">
          <span id="lbl-size" style="font-family: var(--font-mono); font-size: 0.75rem; width: 35px;">${playerChar ? playerChar.humanoid.sizeScale : 1.0}x</span>
        </div>

        <div class="form-row">
          <label>Animation & Emotes</label>
          <select id="inp-anim">
            <option value="idle" ${playerChar && playerChar.humanoid.state === 'idle' ? 'selected' : ''}>Idle Pose</option>
            <option value="walk" ${playerChar && playerChar.humanoid.state === 'walk' ? 'selected' : ''}>Walk Cycle</option>
            <option value="climb" ${playerChar && playerChar.humanoid.state === 'climb' ? 'selected' : ''}>Climb Ladder</option>
            <option value="jump" ${playerChar && playerChar.humanoid.state === 'jump' ? 'selected' : ''}>Jump Pose</option>
            <option value="fall" ${playerChar && playerChar.humanoid.state === 'fall' ? 'selected' : ''}>Freefall Pose</option>
            <option value="dance" ${playerChar && playerChar.humanoid.state === 'dance' ? 'selected' : ''}>🕺 /dance Emote</option>
            <option value="wave" ${playerChar && playerChar.humanoid.state === 'wave' ? 'selected' : ''}>👋 /wave Emote</option>
            <option value="cheer" ${playerChar && playerChar.humanoid.state === 'cheer' ? 'selected' : ''}>🎉 /cheer Emote</option>
          </select>
        </div>

        <div style="margin-top: 12px;">
          <button id="btn-ragdoll" class="btn btn-secondary" style="width: 100%; font-size: 0.75rem; background: #ef4444; color: white;">💥 TRIGGER WASM RAGDOLL</button>
        </div>
      </div>

      ${!entity ? `<div style="color: var(--text-dim); text-align: center; margin-top: 16px; font-size: 0.8rem;">Select an Entity in Hierarchy to inspect entity properties.</div>` : `
      <!-- ENTITY TRANSFORM -->
      <div class="form-section">
        <div class="form-section-title">Transform: ${entity.name}</div>
        <div class="form-row">
          <label>Position</label>
          <div class="vec3-inputs">
            <input type="number" step="0.1" id="pos-x" value="${entity.transform.position[0]}">
            <input type="number" step="0.1" id="pos-y" value="${entity.transform.position[1]}">
            <input type="number" step="0.1" id="pos-z" value="${entity.transform.position[2]}">
          </div>
        </div>
        <div class="form-row">
          <label>Rotation</label>
          <div class="vec3-inputs">
            <input type="number" step="1" id="rot-x" value="${entity.transform.rotation[0]}">
            <input type="number" step="1" id="rot-y" value="${entity.transform.rotation[1]}">
            <input type="number" step="1" id="rot-z" value="${entity.transform.rotation[2]}">
          </div>
        </div>
        <div class="form-row">
          <label>Scale</label>
          <div class="vec3-inputs">
            <input type="number" step="0.1" id="scl-x" value="${entity.transform.scale[0]}">
            <input type="number" step="0.1" id="scl-y" value="${entity.transform.scale[1]}">
            <input type="number" step="0.1" id="scl-z" value="${entity.transform.scale[2]}">
          </div>
        </div>
      </div>

      <!-- MESH & MATERIAL -->
      <div class="form-section">
        <div class="form-section-title">Mesh & Material</div>
        <div class="form-row">
          <label>Color</label>
          <input type="color" id="inp-color" value="${entity.meshRenderer.color}">
        </div>
        <div class="form-row">
          <label>Roughness</label>
          <input type="range" min="0" max="1" step="0.05" id="inp-roughness" value="${entity.meshRenderer.roughness}">
        </div>
        <div class="form-row">
          <label>Metalness</label>
          <input type="range" min="0" max="1" step="0.05" id="inp-metalness" value="${entity.meshRenderer.metalness}">
        </div>
      </div>

      <!-- WASM RIGIDBODY PHYSICS -->
      <div class="form-section">
        <div class="form-section-title">WASM RigidBody Physics</div>
        <div class="form-row">
          <label>Body Type</label>
          <select id="inp-body-type">
            <option value="0" ${entity.rigidBody.bodyType === 0 ? 'selected' : ''}>Static (Fixed)</option>
            <option value="1" ${entity.rigidBody.bodyType === 1 ? 'selected' : ''}>Dynamic (Physics)</option>
            <option value="2" ${entity.rigidBody.bodyType === 2 ? 'selected' : ''}>Kinematic</option>
          </select>
        </div>
        <div class="form-row">
          <label>Mass (kg)</label>
          <input type="number" step="0.1" id="inp-mass" value="${entity.rigidBody.mass}">
        </div>
        <div class="form-row">
          <label>Bounciness</label>
          <input type="range" min="0" max="1" step="0.05" id="inp-restitution" value="${entity.rigidBody.restitution}">
        </div>
        <div class="form-row">
          <label>Friction</label>
          <input type="range" min="0" max="1" step="0.05" id="inp-friction" value="${entity.rigidBody.friction}">
        </div>
      </div>
      `}
    `;

    // Global Physics Gravity Event
    panel.querySelector('#inp-gravity').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      panel.querySelector('#lbl-gravity').textContent = val.toFixed(2);
      if (physicsManager) physicsManager.setGravity(0, val, 0);
    });

    // Multi-Color Body Part Skin Events


    panel.querySelector('#inp-speed').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      panel.querySelector('#lbl-speed').textContent = val.toString();
      const p = getPlayerCharacter ? getPlayerCharacter() : null;
      if (p) p.setWalkSpeed(val);
    });

    panel.querySelector('#inp-size').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      panel.querySelector('#lbl-size').textContent = `${val.toFixed(1)}x`;
      const p = getPlayerCharacter ? getPlayerCharacter() : null;
      if (p) p.setSizeScale(val);
    });



    panel.querySelector('#inp-anim').addEventListener('change', (e) => {
      const p = getPlayerCharacter ? getPlayerCharacter() : null;
      if (p) p.humanoid.state = e.target.value;
    });

    panel.querySelector('#btn-ragdoll').addEventListener('click', () => {
      const p = getPlayerCharacter ? getPlayerCharacter() : null;
      if (p) p.triggerRagdoll();
    });

    // Entity Properties Events
    if (entity) {
      const updateTransform = () => {
        entity.transform.position = [
          parseFloat(panel.querySelector('#pos-x').value) || 0,
          parseFloat(panel.querySelector('#pos-y').value) || 0,
          parseFloat(panel.querySelector('#pos-z').value) || 0
        ];
        entity.transform.rotation = [
          parseFloat(panel.querySelector('#rot-x').value) || 0,
          parseFloat(panel.querySelector('#rot-y').value) || 0,
          parseFloat(panel.querySelector('#rot-z').value) || 0
        ];
        entity.transform.scale = [
          parseFloat(panel.querySelector('#scl-x').value) || 1,
          parseFloat(panel.querySelector('#scl-y').value) || 1,
          parseFloat(panel.querySelector('#scl-z').value) || 1
        ];
        onEntityUpdate(entity);
      };

      ['pos-x', 'pos-y', 'pos-z', 'rot-x', 'rot-y', 'rot-z', 'scl-x', 'scl-y', 'scl-z'].forEach(id => {
        const el = panel.querySelector(`#${id}`);
        if (el) el.addEventListener('change', updateTransform);
      });

      const colorEl = panel.querySelector('#inp-color');
      if (colorEl) {
        colorEl.addEventListener('input', (e) => {
          entity.meshRenderer.color = e.target.value;
          onEntityUpdate(entity);
        });
      }

      const bodyTypeEl = panel.querySelector('#inp-body-type');
      if (bodyTypeEl) {
        bodyTypeEl.addEventListener('change', (e) => {
          entity.rigidBody.bodyType = parseInt(e.target.value, 10);
          onEntityUpdate(entity);
        });
      }
    }
  }

  sceneManager.onSelectionChange = () => renderInspector();
  renderInspector();
  return panel;
}
