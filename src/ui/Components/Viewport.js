export function createViewport({ onGizmoModeChange, onToggleDebugWireframe }) {
  const container = document.createElement('div');
  container.className = 'viewport-container';
  container.id = '3d-viewport';

  const toolbar = document.createElement('div');
  toolbar.className = 'viewport-toolbar';
  toolbar.innerHTML = `
    <button class="gizmo-btn active" data-mode="translate" title="Translate (W)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
    </button>
    <button class="gizmo-btn" data-mode="rotate" title="Rotate (E)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
    </button>
    <button class="gizmo-btn" data-mode="scale" title="Scale (R)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
    </button>
    <div style="width: 1px; background: var(--border-color); margin: 0 4px;"></div>
    <button class="gizmo-btn active" id="btn-toggle-wireframe" title="Toggle Physics Wireframes">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
    </button>
  `;

  let isWireframeActive = true;
  toolbar.querySelectorAll('.gizmo-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      toolbar.querySelectorAll('.gizmo-btn[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onGizmoModeChange(btn.dataset.mode);
    });
  });

  const wireframeBtn = toolbar.querySelector('#btn-toggle-wireframe');
  wireframeBtn.addEventListener('click', () => {
    isWireframeActive = !isWireframeActive;
    wireframeBtn.classList.toggle('active', isWireframeActive);
    onToggleDebugWireframe(isWireframeActive);
  });

  container.appendChild(toolbar);
  return container;
}
