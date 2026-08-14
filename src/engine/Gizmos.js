import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

export class Gizmos {
  constructor(renderer, sceneManager) {
    this.renderer = renderer;
    this.sceneManager = sceneManager;
    this.transformControls = new TransformControls(renderer.camera, renderer.webglRenderer.domElement);

    this.transformControls.size = 0.75;
    this.transformControls.space = 'world'; // 'world' | 'local'

    renderer.scene.add(this.transformControls.getHelper());

    // Disable OrbitControls while dragging Gizmo handles
    this.transformControls.addEventListener('dragging-changed', (event) => {
      renderer.controls.enabled = !event.value;
    });

    // Update entity properties when Gizmo is moved/rotated/scaled
    this.transformControls.addEventListener('objectChange', () => {
      const selectedId = sceneManager.selectedEntityId;
      if (!selectedId) return;

      const entity = sceneManager.getEntity(selectedId);
      const mesh = renderer.meshMap.get(selectedId);

      if (entity && mesh) {
        entity.transform.position = [mesh.position.x, mesh.position.y, mesh.position.z];
        entity.transform.rotation = [
          mesh.rotation.x * (180 / Math.PI),
          mesh.rotation.y * (180 / Math.PI),
          mesh.rotation.z * (180 / Math.PI)
        ];
        entity.transform.scale = [mesh.scale.x, mesh.scale.y, mesh.scale.z];

        if (sceneManager.onSceneChange) sceneManager.onSceneChange(sceneManager);
      }
    });

    sceneManager.onSelectionChange = (id) => this.attachToEntity(id);
  }

  setMode(mode) { // 'translate' | 'rotate' | 'scale'
    this.transformControls.setMode(mode);
  }

  attachToEntity(entityId) {
    if (!entityId) {
      this.transformControls.detach();
      return;
    }
    const mesh = this.renderer.meshMap.get(entityId);
    if (mesh) {
      this.transformControls.attach(mesh);
    } else {
      this.transformControls.detach();
    }
  }
}
