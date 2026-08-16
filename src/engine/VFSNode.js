function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export class VFSNode {
  constructor(name, type) {
    this.id = generateId();
    this.name = name;
    this.type = type; // 'Folder', 'Entity', 'ServerScript', 'ClientScript'
    this.parent = null;
    this.children = [];
  }

  addChild(node) {
    if (node.parent) {
      node.parent.removeChild(node);
    }
    node.parent = this;
    this.children.push(node);
  }

  removeChild(node) {
    const idx = this.children.indexOf(node);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      node.parent = null;
    }
  }

  findNodeById(id) {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.findNodeById(id);
      if (found) return found;
    }
    return null;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      children: this.children.map(c => c.serialize())
    };
  }
}

export class FolderNode extends VFSNode {
  constructor(name) {
    super(name, 'Folder');
  }
}

export class ScriptNode extends VFSNode {
  constructor(name, isServer = false) {
    super(name, isServer ? 'ServerScript' : 'ClientScript');
    this.content = '-- Write your Luau/Lua code here\n';
    this.isRunning = false;
  }

  serialize() {
    const data = super.serialize();
    data.content = this.content;
    data.isRunning = this.isRunning;
    return data;
  }
}

export class ServerScriptNode extends ScriptNode {
  constructor(name) {
    super(name, true);
  }
}

export class ClientScriptNode extends ScriptNode {
  constructor(name) {
    super(name, false);
  }
}

import { Entity } from './ECS.js';

export function deserializeNode(data) {
  let node;
  if (data.type === 'Folder') {
    node = new FolderNode(data.name);
  } else if (data.type === 'ServerScript') {
    node = new ServerScriptNode(data.name);
    node.content = data.content || '';
    node.isRunning = !!data.isRunning;
  } else if (data.type === 'ClientScript') {
    node = new ClientScriptNode(data.name);
    node.content = data.content || '';
    node.isRunning = !!data.isRunning;
  } else if (data.type === 'Entity' || data.transform) {
    node = new Entity(data.name);
    Object.assign(node, data);
    node.type = 'Entity';
  } else {
    // Fallback base
    node = new VFSNode(data.name, data.type);
  }
  
  node.id = data.id || generateId();

  if (data.children && Array.isArray(data.children)) {
    // We clear children array which might have been populated by default
    node.children = [];
    for (const childData of data.children) {
      const child = deserializeNode(childData);
      node.addChild(child);
    }
  }

  return node;
}
