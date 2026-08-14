export function createPhysicsPanel({ physicsManager }) {
  const bar = document.createElement('div');
  bar.className = 'telemetry-bar';

  bar.innerHTML = `
    <div style="display: flex; gap: 20px; align-items: center;">
      <div class="telemetry-stat">
        <span>ENGINE:</span>
        <span id="tel-backend" class="telemetry-value" style="color: #8b5cf6;">VORTEXWASM</span>
      </div>
      <div class="telemetry-stat">
        <span>WASM STEP TIME:</span>
        <span id="tel-steptime" class="telemetry-value">0.00 ms</span>
      </div>
      <div class="telemetry-stat">
        <span>RIGID BODIES:</span>
        <span id="tel-bodies" class="telemetry-value">0</span>
      </div>
    </div>

    <div class="telemetry-stat">
      <span>FPS:</span>
      <span id="tel-fps" class="telemetry-value">60</span>
    </div>
  `;

  let frameCount = 0;
  let lastFpsTime = performance.now();

  physicsManager.onTelemetry((data) => {
    bar.querySelector('#tel-backend').textContent = data.backend.toUpperCase() === 'CUSTOM' ? 'VORTEXWASM (AS SIMD128)' : 'RAPIER3D WASM';
    bar.querySelector('#tel-steptime').textContent = `${data.stepTimeMs.toFixed(2)} ms`;
    bar.querySelector('#tel-bodies').textContent = data.bodyCount;
  });

  setInterval(() => {
    const now = performance.now();
    const fps = Math.round((frameCount * 1000) / (now - lastFpsTime));
    bar.querySelector('#tel-fps').textContent = fps || 60;
    frameCount = 0;
    lastFpsTime = now;
  }, 1000);

  window.addEventListener('requestAnimationFrame', () => frameCount++);

  return bar;
}
