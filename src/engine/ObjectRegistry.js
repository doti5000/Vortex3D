import { Entity } from './ECS.js';

export const ObjectRegistry = {
  items: [
    {
      id: 'basic_cube',
      name: 'Cube',
      category: 'Primitives',
      icon: '🧊',
      create: () => {
        const ent = new Entity('Cube');
        ent.meshRenderer.geometryType = 'box';
        ent.collider.shapeType = 0;
        return ent;
      }
    },
    {
      id: 'basic_sphere',
      name: 'Sphere',
      category: 'Primitives',
      icon: '⚽',
      create: () => {
        const ent = new Entity('Sphere');
        ent.meshRenderer.geometryType = 'sphere';
        ent.collider.shapeType = 1;
        return ent;
      }
    },
    {
      id: 'damage_brick',
      name: 'Lava Brick',
      category: 'Gameplay',
      icon: '🔥',
      create: () => {
        const ent = new Entity('Lava Brick');
        ent.meshRenderer.geometryType = 'box';
        ent.meshRenderer.color = '#ef4444';
        ent.luauScript.source = `-- Damage Script
local parent = script.Parent
local damage = 25

-- Connect to touch event (mocked)
print(parent.Name .. " will deal " .. damage .. " damage on touch.")
`;
        return ent;
      }
    },
    {
      id: 'spawn_point',
      name: 'Spawn Point',
      category: 'Gameplay',
      icon: '⭐',
      create: () => {
        const ent = new Entity('SpawnLocation');
        ent.meshRenderer.geometryType = 'plane';
        ent.meshRenderer.color = '#10b981';
        ent.transform.scale = [4, 0.1, 4];
        return ent;
      }
    }
  ],

  getTypes() {
    return this.items;
  },

  spawn(id) {
    const item = this.items.find(i => i.id === id);
    if (item) return item.create();
    return null;
  }
};
