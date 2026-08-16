import * as monaco from 'monaco-editor/editor/editor.api.js';
import 'monaco-editor/basic-languages/lua/lua.contribution.js';

export function createMultiTabEditor({ sceneManager, viewportEl }) {
  const container = document.createElement('div');
  container.className = 'multi-tab-editor';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.height = '100%';
  container.style.width = '100%';
  container.style.backgroundColor = '#000';

  const tabBar = document.createElement('div');
  tabBar.className = 'editor-tabs';
  tabBar.style.display = 'flex';
  tabBar.style.backgroundColor = '#111827';
  tabBar.style.borderBottom = '1px solid #374151';
  tabBar.style.overflowX = 'auto';

  const viewContainer = document.createElement('div');
  viewContainer.style.flex = '1';
  viewContainer.style.position = 'relative';

  const editorContainer = document.createElement('div');
  editorContainer.style.position = 'absolute';
  editorContainer.style.inset = '0';
  editorContainer.style.display = 'none'; // Hidden when Scene tab is active

  if (viewportEl) {
    viewportEl.style.position = 'absolute';
    viewportEl.style.inset = '0';
    viewContainer.appendChild(viewportEl);
  }
  
  viewContainer.appendChild(editorContainer);

  container.appendChild(tabBar);
  container.appendChild(viewContainer);

  let editorInstance = null;
  const openTabs = new Map(); // id -> { node, model, tabEl, isViewport }
  let activeTabId = null;

  // Add the permanent Scene/Viewport tab
  const sceneTabId = 'viewport-scene-tab';
  const sceneTabEl = document.createElement('div');
  sceneTabEl.style.padding = '8px 16px';
  sceneTabEl.style.cursor = 'pointer';
  sceneTabEl.style.borderRight = '1px solid #374151';
  sceneTabEl.style.userSelect = 'none';
  sceneTabEl.textContent = '🌐 Scene';
  
  sceneTabEl.addEventListener('click', () => switchTab(sceneTabId));
  tabBar.appendChild(sceneTabEl);

  openTabs.set(sceneTabId, {
    isViewport: true,
    tabEl: sceneTabEl
  });

  // Initialize Monaco after it's in the DOM
  setTimeout(() => {
    editorInstance = monaco.editor.create(editorContainer, {
      theme: 'vs-dark',
      language: 'lua',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14
    });

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveTab();
    });

    // Save on model change
    editorInstance.onDidChangeModelContent(() => {
      if (activeTabId && openTabs.has(activeTabId)) {
        const tab = openTabs.get(activeTabId);
        tab.tabEl.style.fontStyle = 'italic'; // Unsaved indicator
      }
    });

  }, 100);

  function saveActiveTab() {
    if (!activeTabId || !editorInstance) return;
    const tab = openTabs.get(activeTabId);
    if (tab && tab.node) {
      tab.node.content = editorInstance.getValue();
      tab.tabEl.style.fontStyle = 'normal';
      sceneManager.notifyChange(); // update scene state
      console.log(`Saved ${tab.node.name}`);
    }
  }

  function switchTab(id) {
    if (!openTabs.has(id)) return;
    
    if (activeTabId && openTabs.has(activeTabId)) {
      openTabs.get(activeTabId).tabEl.style.backgroundColor = 'transparent';
    }

    activeTabId = id;
    const tab = openTabs.get(id);
    tab.tabEl.style.backgroundColor = '#1f2937';

    if (tab.isViewport) {
      if (viewportEl) viewportEl.style.display = 'block';
      editorContainer.style.display = 'none';
    } else {
      if (viewportEl) viewportEl.style.display = 'none';
      editorContainer.style.display = 'block';
      if (editorInstance) {
        editorInstance.setModel(tab.model);
      }
    }
  }

  function closeTab(id) {
    if (!openTabs.has(id)) return;
    const tab = openTabs.get(id);
    if (tab.isViewport) return; // Cannot close scene tab
    
    tab.tabEl.remove();
    openTabs.delete(id);

    if (activeTabId === id) {
      activeTabId = null;
      if (editorInstance) editorInstance.setModel(null);
      // Switch to first available (will always hit Scene tab at least)
      if (openTabs.size > 0) {
        switchTab(Array.from(openTabs.keys())[0]);
      }
    }
  }

  container.openScript = (scriptNode) => {
    if (openTabs.has(scriptNode.id)) {
      switchTab(scriptNode.id);
      return;
    }

    const model = monaco.editor.createModel(scriptNode.content || '', 'lua');
    
    const tabEl = document.createElement('div');
    tabEl.style.padding = '8px 16px';
    tabEl.style.cursor = 'pointer';
    tabEl.style.borderRight = '1px solid #374151';
    tabEl.style.display = 'flex';
    tabEl.style.alignItems = 'center';
    tabEl.style.gap = '8px';
    tabEl.style.userSelect = 'none';
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = scriptNode.name;
    
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.color = '#ef4444';
    closeBtn.style.fontSize = '1.2rem';
    closeBtn.style.lineHeight = '1';
    
    tabEl.appendChild(titleSpan);
    tabEl.appendChild(closeBtn);

    tabEl.addEventListener('click', () => switchTab(scriptNode.id));
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(scriptNode.id);
    });

    tabBar.appendChild(tabEl);

    openTabs.set(scriptNode.id, {
      isViewport: false,
      node: scriptNode,
      model: model,
      tabEl: tabEl
    });

    switchTab(scriptNode.id);
  };

  // Initially activate scene
  switchTab(sceneTabId);

  return container;
}
