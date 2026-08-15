import { Entity } from '../ECS.js';

export class World {
  constructor() {
    this.entities = new Map();
    this.systems = [];
  }

  createEntity(name = "New Entity") {
    const entity = new Entity(name);
    this.entities.set(entity.id, entity);
    return entity;
  }

  removeEntity(id) {
    this.entities.delete(id);
  }

  getEntity(id) {
    return this.entities.get(id);
  }

  registerSystem(system) {
    this.systems.push(system);
  }

  update(dt) {
    for (const system of this.systems) {
      if (system.update) {
        system.update(this.entities, dt);
      }
    }
  }
}
