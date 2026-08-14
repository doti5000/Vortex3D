import { Entity } from './ECS.js';

export class Scene {
  constructor(name = 'Default Scene') {
    this.name = name;
    this.entities = new Map();
    this.rootEntityIds = [];
    this.selectedEntityId = null;
    this.onSelectionChange = null;
    this.onSceneChange = null;
  }

  addEntity(entity) {
    this.entities.set(entity.id, entity);
    if (!entity.parentId) {
      this.rootEntityIds.push(entity.id);
    } else {
      const parent = this.entities.get(entity.parentId);
      if (parent && !parent.children.includes(entity.id)) {
        parent.children.push(entity.id);
      }
    }
    this.notifyChange();
    return entity;
  }

  createEntity(name = 'Cube') {
    const ent = new Entity(name);
    return this.addEntity(ent);
  }

  removeEntity(id) {
    const ent = this.entities.get(id);
    if (!ent) return;

    // Recursively remove children
    for (const childId of [...ent.children]) {
      this.removeEntity(childId);
    }

    if (ent.parentId) {
      const parent = this.entities.get(ent.parentId);
      if (parent) parent.children = parent.children.filter(c => c !== id);
    } else {
      this.rootEntityIds = this.rootEntityIds.filter(r => r !== id);
    }

    this.entities.delete(id);
    if (this.selectedEntityId === id) {
      this.selectEntity(null);
    }
    this.notifyChange();
  }

  getEntity(id) {
    return this.entities.get(id);
  }

  selectEntity(id) {
    this.selectedEntityId = id;
    if (this.onSelectionChange) this.onSelectionChange(id);
  }

  clear() {
    this.entities.clear();
    this.rootEntityIds = [];
    this.selectedEntityId = null;
    this.notifyChange();
  }

  serialize() {
    return JSON.stringify({
      name: this.name,
      entities: Array.from(this.entities.values()).map(e => ({
        id: e.id,
        name: e.name,
        parentId: e.parentId,
        children: e.children,
        transform: e.transform,
        meshRenderer: e.meshRenderer,
        rigidBody: e.rigidBody,
        collider: e.collider,
        light: e.light,
        luauScript: e.luauScript
      }))
    }, null, 2);
  }

  deserialize(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.clear();
      this.name = data.name || 'Imported Scene';

      for (const item of data.entities) {
        const ent = new Entity(item.name);
        ent.id = item.id;
        ent.parentId = item.parentId;
        ent.children = item.children || [];
        ent.transform = item.transform;
        ent.meshRenderer = item.meshRenderer;
        ent.rigidBody = item.rigidBody;
        ent.collider = item.collider;
        ent.light = item.light;
        ent.luauScript = item.luauScript;
        this.addEntity(ent);
      }
    } catch (err) {
      console.error('Failed to parse scene JSON:', err);
    }
  }

  notifyChange() {
    if (this.onSceneChange) this.onSceneChange(this);
  }
}
