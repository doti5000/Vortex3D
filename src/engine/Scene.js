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
