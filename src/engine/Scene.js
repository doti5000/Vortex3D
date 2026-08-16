import { Entity } from './ECS.js';
import { FolderNode, deserializeNode, VFSNode } from './VFSNode.js';

export class Scene {
  constructor(name = 'Default Scene') {
    this.name = name;
    
    // Flat map of ALL nodes (Folders, Scripts, Entities) for fast lookup by ID
    this.nodes = new Map();
    
    // The master Workspace tree
    this.root = new FolderNode('Workspace');
    this.nodes.set(this.root.id, this.root);

    // Maintain a map of strictly 3D entities for backwards compatibility with systems
    // that iterate over scene.entities.values()
    this.entities = new Map();
    
    this.selectedEntityId = null;
    this.onSelectionChange = null;
    this.onSceneChange = null;

    this.clipboard = {
      mode: null, // 'copy' or 'cut'
      nodeId: null, // ID of the node cut/copied
      data: null // Cloned node data for paste (if copy)
    };
  }

  addNode(node, parentNode = null) {
    if (!parentNode) parentNode = this.root;
    
    parentNode.addChild(node);
    
    // Recursively register nodes
    const register = (n) => {
      this.nodes.set(n.id, n);
      if (n.type === 'Entity' || n instanceof Entity) {
        this.entities.set(n.id, n);
      }
      for (const child of n.children) register(child);
    };
    register(node);

    this.notifyChange();
    return node;
  }

  // Backwards compatibility
  addEntity(entity) {
    return this.addNode(entity, this.root);
  }

  createEntity(name = 'Cube') {
    const ent = new Entity(name);
    return this.addEntity(ent);
  }

  removeNode(id) {
    if (id === this.root.id) return; // Cannot delete workspace
    
    const node = this.nodes.get(id);
    if (!node) return;

    if (node.parent) {
      node.parent.removeChild(node);
    }

    // Recursively unregister
    const unregister = (n) => {
      this.nodes.delete(n.id);
      if (n.type === 'Entity' || n instanceof Entity) {
        this.entities.delete(n.id);
      }
      for (const child of [...n.children]) unregister(child);
    };
    unregister(node);

    if (this.selectedEntityId === id) {
      this.selectEntity(null);
    }

    if (this.clipboard.nodeId === id) {
      this.clipboard.mode = null;
      this.clipboard.nodeId = null;
      this.clipboard.data = null;
    }

    this.notifyChange();
  }

  // Backwards comp
  removeEntity(id) {
    this.removeNode(id);
  }

  getEntity(id) {
    return this.entities.get(id);
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  duplicateNode(id) {
    if (id === this.root.id) return null;
    const node = this.getNode(id);
    if (!node) return null;

    const clone = node.clone();
    
    // Auto rename duplicate
    const match = clone.name.match(/^(.*?)(?: \((\d+)\))?$/);
    const baseName = match[1];
    let count = match[2] ? parseInt(match[2], 10) + 1 : 2;
    
    // Check siblings to avoid exact same name
    const siblings = node.parent ? node.parent.children : [];
    while (siblings.some(s => s.name === `${baseName} (${count})`)) {
      count++;
    }
    clone.name = `${baseName} (${count})`;

    return this.addNode(clone, node.parent);
  }

  renameNode(id, newName) {
    if (id === this.root.id) return;
    const node = this.getNode(id);
    if (!node) return;
    node.name = newName;
    this.notifyChange();
  }

  moveNode(id, newParentId) {
    if (id === this.root.id) return; // Cannot move root
    const node = this.getNode(id);
    const newParent = this.getNode(newParentId);
    
    if (!node || !newParent) return;

    // Prevent moving node into itself or its descendants
    let check = newParent;
    while (check) {
      if (check.id === node.id) return;
      check = check.parent;
    }

    node.parent.removeChild(node);
    newParent.addChild(node);
    this.notifyChange();
  }

  copyNode(id) {
    if (id === this.root.id) return;
    const node = this.getNode(id);
    if (!node) return;
    
    this.clipboard.mode = 'copy';
    this.clipboard.nodeId = id;
    this.clipboard.data = node.clone();
  }

  cutNode(id) {
    if (id === this.root.id) return;
    const node = this.getNode(id);
    if (!node) return;

    this.clipboard.mode = 'cut';
    this.clipboard.nodeId = id;
    this.clipboard.data = null;
  }

  pasteNode(targetParentId) {
    if (!this.clipboard.mode) return;
    const targetParent = this.getNode(targetParentId) || this.root;

    if (this.clipboard.mode === 'copy') {
      if (!this.clipboard.data) return;
      const clone = this.clipboard.data.clone(); // Re-clone for multiple pastes
      
      // Handle naming collision
      if (targetParent.children.some(c => c.name === clone.name)) {
         clone.name = `${clone.name} (Copy)`;
      }

      this.addNode(clone, targetParent);
    } else if (this.clipboard.mode === 'cut') {
      if (!this.clipboard.nodeId) return;
      
      const nodeToMove = this.getNode(this.clipboard.nodeId);
      if (!nodeToMove) return;

      // Handle user condition: prompt UI usually handles UI side, but here if same name exists, we append Cut
      if (targetParent.children.some(c => c.name === nodeToMove.name && c.id !== nodeToMove.id)) {
        // Renaming is handled by UI before triggering, or we can auto-rename. 
        // Based on user feedback: "if same parent then the user will be prompted".
        // The UI will handle the prompt. Here we just perform the move.
      }
      
      this.moveNode(this.clipboard.nodeId, targetParent.id);

      // Clear clipboard after cut paste
      this.clipboard.mode = null;
      this.clipboard.nodeId = null;
      this.clipboard.data = null;
    }
  }

  selectEntity(id) {
    this.selectedEntityId = id;
    if (this.onSelectionChange) this.onSelectionChange(id);
  }

  clear() {
    this.nodes.clear();
    this.entities.clear();
    this.root = new FolderNode('Workspace');
    this.nodes.set(this.root.id, this.root);
    this.selectedEntityId = null;
    this.notifyChange();
  }

  serialize() {
    return JSON.stringify({
      name: this.name,
      workspace: this.root.serialize()
    }, null, 2);
  }

  deserialize(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.clear();
      this.name = data.name || 'Imported Scene';

      if (data.workspace) {
        // Full VFS tree
        const importedRoot = deserializeNode(data.workspace);
        importedRoot.name = 'Workspace'; // Enforce name
        
        // Register all nodes from imported root
        this.root = importedRoot;
        const register = (n) => {
          this.nodes.set(n.id, n);
          if (n.type === 'Entity' || n instanceof Entity) {
            this.entities.set(n.id, n);
          }
          for (const child of n.children) register(child);
        };
        register(this.root);
      } else if (data.entities && Array.isArray(data.entities)) {
        // Legacy flat entity list
        for (const item of data.entities) {
          const ent = new Entity(item.name);
          Object.assign(ent, item);
          this.addEntity(ent);
        }
      }
      
      this.notifyChange();
    } catch (err) {
      console.error('Failed to parse scene JSON:', err);
    }
  }

  notifyChange() {
    if (this.onSceneChange) this.onSceneChange(this);
  }
}
