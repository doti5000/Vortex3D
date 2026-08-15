export class ScriptSystem {
  constructor(luauVM) {
    this.luauVM = luauVM;
    this.initialized = new Set();
  }

  async update(entities, dt) {
    for (const entity of entities.values()) {
      if (entity.luauScript && entity.luauScript.enabled && entity.luauScript.source) {
        if (!this.initialized.has(entity.id)) {
          this.initialized.add(entity.id);
          // Run the script once (it can contain task.wait loops)
          await this.luauVM.runEntityScript(entity, entity.luauScript.source);
        }
      }
    }
  }

  stopAll() {
    this.initialized.clear();
    this.luauVM.stopAll();
  }
}
