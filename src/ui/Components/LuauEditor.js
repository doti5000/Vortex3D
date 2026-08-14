export function createLuauEditor({ sceneManager, luauVM }) {
  const panel = document.createElement('div');
  panel.className = 'panel-body';

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 0.8rem; font-weight: 600; color: var(--accent);">LUAU SCRIPT EDITOR</span>
      <select id="preset-script-select" class="select-input" style="padding: 2px 6px; font-size: 0.75rem;">
        <option value="">-- Load Luau Script Template --</option>
        <option value="impulse">Impulse Launcher Script</option>
        <option value="vehicle">Car Vehicle Driver Script</option>
        <option value="platformer">Character Platformer Controller</option>
        <option value="gravity">Anti-Gravity Trigger Zone</option>
      </select>
    </div>

    <textarea id="luau-textarea" class="luau-code-area" spellcheck="false"></textarea>

    <div style="display: flex; gap: 8px; margin: 8px 0;">
      <button id="btn-run-luau" class="btn btn-success" style="flex: 1;">Run Luau Script in WASM</button>
      <button id="btn-clear-console" class="btn">Clear Console</button>
    </div>

    <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;">WASM CONSOLE LOGS</div>
    <div id="console-output" class="console-output"></div>
  `;

  const codeArea = panel.querySelector('#luau-textarea');
  const consoleOutput = panel.querySelector('#console-output');

  function updateCodeFromSelection() {
    const selectedId = sceneManager.selectedEntityId;
    if (selectedId) {
      const entity = sceneManager.getEntity(selectedId);
      if (entity && entity.luauScript) {
        codeArea.value = entity.luauScript.source;
        return;
      }
    }
    codeArea.value = `-- Typed Luau Script\nlocal entityName: string = "World"\nprint("Luau Engine Ready on " .. entityName)\n`;
  }

  codeArea.addEventListener('input', () => {
    const selectedId = sceneManager.selectedEntityId;
    if (selectedId) {
      const entity = sceneManager.getEntity(selectedId);
      if (entity && entity.luauScript) {
        entity.luauScript.source = codeArea.value;
      }
    }
  });

  panel.querySelector('#preset-script-select').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'impulse') {
      codeArea.value = `-- Typed Luau Impulse Launcher\nlocal parent = script.Parent\nlocal force: Vector3 = Vector3.new(0, 350, 0)\n\nprint("Applying impulse launch to " .. parent.Name)\nparent:ApplyImpulse(force)\n`;
    } else if (val === 'vehicle') {
      codeArea.value = `-- Typed Luau Vehicle Driver\nlocal car = script.Parent\nlocal speed: number = 50\n\nprint("Vehicle engine started!")\ncar:SetVelocity(Vector3.new(speed, 0, 0))\n`;
    } else if (val === 'platformer') {
      codeArea.value = `-- Typed Luau Character Controller\nlocal player = script.Parent\nlocal jumpHeight: number = 25\n\nprint("Player spawned!")\nplayer:ApplyImpulse(Vector3.new(0, jumpHeight, 0))\n`;
    } else if (val === 'gravity') {
      codeArea.value = `-- Typed Luau Anti-Gravity Field\nworkspace.Gravity = -2.0\nprint("Workspace gravity updated via Luau!")\n`;
    }

    const selectedId = sceneManager.selectedEntityId;
    if (selectedId) {
      const entity = sceneManager.getEntity(selectedId);
      if (entity && entity.luauScript) entity.luauScript.source = codeArea.value;
    }
  });

  panel.querySelector('#btn-run-luau').addEventListener('click', () => {
    const selectedId = sceneManager.selectedEntityId;
    if (selectedId) {
      const entity = sceneManager.getEntity(selectedId);
      if (entity) {
        luauVM.runEntityScript(entity, codeArea.value);
      }
    } else {
      luauVM.log('warn', 'No Entity selected in Hierarchy! Select an entity to run Luau script.');
    }
  });

  panel.querySelector('#btn-clear-console').addEventListener('click', () => {
    consoleOutput.innerHTML = '';
  });

  luauVM.onLog((entry) => {
    const div = document.createElement('div');
    div.className = `log-entry log-${entry.type}`;
    div.textContent = `[${entry.timestamp}] ${entry.text}`;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  });

  sceneManager.onSelectionChange = () => updateCodeFromSelection();
  updateCodeFromSelection();
  return panel;
}
