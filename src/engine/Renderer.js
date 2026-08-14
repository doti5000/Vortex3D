import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class Renderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a0d14');

    this.camera = new THREE.PerspectiveCamera(60, containerElement.clientWidth / containerElement.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 10, 18);

    this.webglRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.webglRenderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webglRenderer.shadowMap.enabled = true;
    this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.webglRenderer.toneMappingExposure = 1.1;

    containerElement.appendChild(this.webglRenderer.domElement);

    this.controls = new OrbitControls(this.camera, this.webglRenderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 2, 0);

    this.meshMap = new Map(); // entityId -> THREE.Mesh
    this.lightMap = new Map(); // entityId -> THREE.Light

    this.setupLighting();
    this.setupGrid();
    this.setupPostProcessing();

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Directional Sun Light
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(20, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    // Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x1e293b, 0.5);
    this.scene.add(hemiLight);
  }

  setupGrid() {
    const grid = new THREE.GridHelper(100, 100, 0x4f46e5, 0x1e293b);
    grid.position.y = -0.01;
    this.scene.add(grid);
  }

  setupPostProcessing() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.composer = new EffectComposer(this.webglRenderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Subtle Unreal Bloom for Glowing WASM VFX & Neon Lights
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.35, // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  followAvatar(avatarPosition) {
    if (!avatarPosition) return;
    const targetVec = new THREE.Vector3(avatarPosition.x, avatarPosition.y + 1.5, avatarPosition.z);
    this.controls.target.lerp(targetVec, 0.1);

    const desiredCamPos = new THREE.Vector3(
      avatarPosition.x,
      avatarPosition.y + 6.0,
      avatarPosition.z + 14.0
    );
    this.camera.position.lerp(desiredCamPos, 0.05);
  }

  createOrUpdateEntityMesh(entity) {
    if (!entity.meshRenderer || !entity.meshRenderer.enabled) {
      if (this.meshMap.has(entity.id)) {
        this.scene.remove(this.meshMap.get(entity.id));
        this.meshMap.delete(entity.id);
      }
      return;
    }

    let mesh = this.meshMap.get(entity.id);
    let geometry;

    if (entity.meshRenderer.geometryType === 'sphere') {
      geometry = new THREE.SphereGeometry(entity.collider ? entity.collider.radius : 1, 32, 32);
    } else if (entity.meshRenderer.geometryType === 'plane') {
      geometry = new THREE.PlaneGeometry(entity.collider.extents[0], entity.collider.extents[2]);
    } else {
      geometry = new THREE.BoxGeometry(entity.collider.extents[0], entity.collider.extents[1], entity.collider.extents[2]);
    }

    const material = new THREE.MeshStandardMaterial({
      color: entity.meshRenderer.color || '#3b82f6',
      roughness: entity.meshRenderer.roughness !== undefined ? entity.meshRenderer.roughness : 0.4,
      metalness: entity.meshRenderer.metalness !== undefined ? entity.meshRenderer.metalness : 0.1
    });

    if (!mesh) {
      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.meshMap.set(entity.id, mesh);
    } else {
      mesh.geometry.dispose();
      mesh.geometry = geometry;
      mesh.material.dispose();
      mesh.material = material;
    }

    mesh.position.set(...entity.transform.position);
    mesh.rotation.set(...entity.transform.rotation);
    mesh.scale.set(...entity.transform.scale);
  }

  removeEntityMesh(entityId) {
    if (this.meshMap.has(entityId)) {
      const mesh = this.meshMap.get(entityId);
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      this.meshMap.delete(entityId);
    }
  }

  syncMeshTransform(entityId, position, rotationEuler) {
    const mesh = this.meshMap.get(entityId);
    if (mesh) {
      mesh.position.set(position[0], position[1], position[2]);
      if (rotationEuler) {
        mesh.rotation.set(rotationEuler[0], rotationEuler[1], rotationEuler[2]);
      }
    }
  }

  render() {
    this.controls.update();
    if (this.composer) {
      this.composer.render();
    } else {
      this.webglRenderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.webglRenderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }
}
