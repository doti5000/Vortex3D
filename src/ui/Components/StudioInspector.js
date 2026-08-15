export function createStudioInspector({ luauVM, sceneManager }) {
  const panel = document.createElement('div');
  panel.className = 'studio-inspector-panel glass-panel';
  panel.style.cssText = `
    position: absolute;
    bottom: 40px;
    right: 20px;
    width: 320px;
    max-height: 220px;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 8px;
    padding: 12px;
    font-family: 'Fira Code', monospace;
    font-size: 11px;
    color: #f8fafc;
    z-index: 99;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
      <span style="color: #6366f1; font-weight: 600;">📜 LUAU STUDIO DEBUGGER</span>
      <span id="inspector-status" style="color: #10b981;">● READY</span>
    </div>

    <div id="inspector-log" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; max-height: 140px; padding-right: 4px;">
      <div style="color: #94a3b8;">[Studio] Luau Environment initialized.</div>
      <div style="color: #38bdf8;">[LuauVM] Vector3, CFrame, Signal, TweenService loaded.</div>
    </div>
  `;

  // Intercept Luau print & error messages
  const originalLog = console.log;
  const originalError = console.error;
  const logContainer = panel.querySelector('#inspector-log');

  console.log = (...args) => {
    originalLog(...args);
    const msg = args.join(' ');
    if (msg.includes('Luau') || msg.includes('Classic R6')) {
      const line = document.createElement('div');
      line.style.color = '#38bdf8';
      line.textContent = `[Luau] ${msg}`;
      logContainer.appendChild(line);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  };

  console.error = (...args) => {
    originalError(...args);
    const msg = args.join(' ');
    const line = document.createElement('div');
    line.style.color = '#ef4444';
    line.textContent = `[Error] ${msg}`;
    logContainer.appendChild(line);
    logContainer.scrollTop = logContainer.scrollHeight;
  };

  return panel;
}
