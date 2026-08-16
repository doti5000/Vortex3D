import { ObjectRegistry } from '../../engine/ObjectRegistry.js';

export function createExplorer({ sceneManager, onAddNode, onDeleteNode, onNodeDoubleClick }) {
  const panel = document.createElement('div');
  panel.className = 'panel panel-explorer';

  let objectMenuHtml = '';
  for (const item of ObjectRegistry.getTypes()) {
    objectMenuHtml += `<div class="menu-item" data-action="add-obj-${item.id}">${item.icon} ${item.name}</div>`;
  }

  panel.innerHTML = `
    <div class="panel-header" style="justify-content: space-between;">
      <span>Explorer</span>
    </div>
    <div class="panel-body">
      <div id="explorer-tree" class="explorer-tree"></div>
    </div>
    
    <!-- Context Menu -->
    <div id="explorer-context-menu" class="context-menu" style="display: none; position: absolute; z-index: 100; background: #1f2937; border: 1px solid #374151; padding: 4px; border-radius: 4px; min-width: 140px;">
      <div class="menu-item" data-action="rename">Rename</div>
      <div style="height: 1px; background: #374151; margin: 4px 0;"></div>
      <div class="menu-item" data-action="cut">Cut</div>
      <div class="menu-item" data-action="copy">Copy</div>
      <div class="menu-item" data-action="paste">Paste Into</div>
      <div class="menu-item" data-action="duplicate">Duplicate</div>
      <div style="height: 1px; background: #374151; margin: 4px 0;"></div>
      <div class="menu-item" data-action="add-folder">📁 Add Folder</div>
      <div class="menu-item" data-action="add-server-script">📜 Add Server Script</div>
      <div class="menu-item" data-action="add-client-script">📝 Add Client Script</div>
      <div style="height: 1px; background: #374151; margin: 4px 0;"></div>
      <div style="padding: 4px 8px; font-size: 0.7rem; color: #9ca3af; text-transform: uppercase;">Insert Object</div>
      ${objectMenuHtml}
      <div style="height: 1px; background: #374151; margin: 4px 0;"></div>
      <div class="menu-item" data-action="delete" style="color: #ef4444;">Delete</div>
    </div>
  `;

  const treeContainer = panel.querySelector('#explorer-tree');
  const contextMenu = panel.querySelector('#explorer-context-menu');
  let contextNodeId = null;

  // Close context menu on click outside
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });

  contextMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    
    contextMenu.style.display = 'none';
    
    if (action === 'delete' && contextNodeId) {
      onDeleteNode(contextNodeId);
      return;
    }

    if (action === 'rename' && contextNodeId) {
      const node = sceneManager.getNode(contextNodeId);
      if (node && node.id !== sceneManager.root.id) {
        const newName = prompt('Enter new name:', node.name);
        if (newName !== null && newName.trim() !== '') {
          sceneManager.renameNode(contextNodeId, newName.trim());
        }
      }
      return;
    }

    if (action === 'cut' && contextNodeId) sceneManager.cutNode(contextNodeId);
    else if (action === 'copy' && contextNodeId) sceneManager.copyNode(contextNodeId);
    else if (action === 'paste' && contextNodeId) sceneManager.pasteNode(contextNodeId);
    else if (action === 'duplicate' && contextNodeId) sceneManager.duplicateNode(contextNodeId);
    else if (action === 'add-folder') onAddNode('Folder', contextNodeId);
    else if (action === 'add-server-script') onAddNode('ServerScript', contextNodeId);
    else if (action === 'add-client-script') onAddNode('ClientScript', contextNodeId);
    else if (action.startsWith('add-obj-')) {
      const objId = action.replace('add-obj-', '');
      const ent = ObjectRegistry.spawn(objId);
      if (ent) sceneManager.addNode(ent, sceneManager.getNode(contextNodeId) || sceneManager.root);
    }
  });

  function renderNode(node, depth = 0) {
    const item = document.createElement('div');
    item.className = `explorer-item ${sceneManager.selectedEntityId === node.id ? 'selected' : ''}`;
    item.style.paddingLeft = `${depth * 12}px`;
    item.dataset.id = node.id;

    let icon = '📦';
    if (node.type === 'Folder') icon = '📁';
    else if (node.type === 'ServerScript') icon = '📜';
    else if (node.type === 'ClientScript') icon = '📝';
    else if (node.name === 'Workspace') icon = '🌐';

    item.innerHTML = `
      <span style="user-select: none; pointer-events: none;">${icon} ${node.name}</span>
    `;

    // Make everything draggable except root
    if (node.id !== sceneManager.root.id) {
      item.draggable = true;
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', node.id);
        e.stopPropagation();
      });
    }

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.style.border = '1px dashed #60a5fa';
    });

    item.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.style.border = 'none';
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.style.border = 'none';
      const sourceId = e.dataTransfer.getData('text/plain');
      if (sourceId && sourceId !== node.id) {
        sceneManager.moveNode(sourceId, node.id);
      }
    });

    item.addEventListener('click', (e) => {
      sceneManager.selectEntity(node.id);
    });

    item.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (onNodeDoubleClick) onNodeDoubleClick(node);
    });

    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      contextNodeId = node.id;
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.style.top = `${e.pageY}px`;
      contextMenu.style.display = 'block';
    });

    treeContainer.appendChild(item);

    if (node.children) {
      for (const child of node.children) {
        renderNode(child, depth + 1);
      }
    }
  }

  function renderTree() {
    treeContainer.innerHTML = '';
    renderNode(sceneManager.root, 0);
  }

  sceneManager.onSceneChange = () => renderTree();
  sceneManager.onSelectionChange = () => renderTree();

  renderTree();
  return panel;
}
