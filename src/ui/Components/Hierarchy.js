export function createHierarchy({ sceneManager, onAddEntity, onDeleteEntity }) {
  const panel = document.createElement('div');
  panel.className = 'panel panel-hierarchy';

  panel.innerHTML = `
    <div class="panel-header">
      <span>Hierarchy</span>
      <div style="display: flex; gap: 4px;">
        <button id="btn-add-cube" class="btn" style="padding: 2px 8px; font-size: 0.75rem;">+ Cube</button>
        <button id="btn-add-sphere" class="btn" style="padding: 2px 8px; font-size: 0.75rem;">+ Sphere</button>
      </div>
    </div>
    <div class="panel-body">
      <div id="entity-tree" class="entity-tree"></div>
    </div>
  `;

  const treeContainer = panel.querySelector('#entity-tree');

  function renderTree() {
    treeContainer.innerHTML = '';
    for (const entity of sceneManager.entities.values()) {
      const item = document.createElement('div');
      item.className = `entity-item ${sceneManager.selectedEntityId === entity.id ? 'selected' : ''}`;
      item.innerHTML = `
        <span>${entity.name}</span>
        <button class="btn-delete" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem;">✕</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) return;
        sceneManager.selectEntity(entity.id);
      });

      item.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        onDeleteEntity(entity.id);
      });

      treeContainer.appendChild(item);
    }
  }

  panel.querySelector('#btn-add-cube').addEventListener('click', () => onAddEntity('Cube', 'box'));
  panel.querySelector('#btn-add-sphere').addEventListener('click', () => onAddEntity('Sphere', 'sphere'));

  sceneManager.onSceneChange = () => renderTree();
  sceneManager.onSelectionChange = () => renderTree();

  renderTree();
  return panel;
}
