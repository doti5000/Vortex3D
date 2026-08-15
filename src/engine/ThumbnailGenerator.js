import * as THREE from 'three';
import { AvatarTextureManager } from './AvatarTextureManager.js';
import { HatMeshManager } from './HatMeshManager.js';

class ThumbnailGeneratorSystem {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(256, 256);
    this.renderer.setPixelRatio(1);
    
    this.cache = new Map();
  }

  async generateThumbnail(asset) {
    if (this.cache.has(asset.id)) {
      return this.cache.get(asset.id);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(2, 5, 3);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    const defaultSkin = '#e2e8f0'; // light gray for mannequin



    if (asset.type === 'shirt') {
      const torsoGeo = new THREE.BoxGeometry(2.0, 2.0, 1.0);
      const skinColors = { torso: defaultSkin, leftArm: defaultSkin, rightArm: defaultSkin };
      const multi = await AvatarTextureManager.loadMultiLayerMaterials({
        skinColorHex: defaultSkin,
        skinColors,
        shirtUrl: asset.textureUrl
      });
      const torso = new THREE.Mesh(torsoGeo, multi.torso || new THREE.MeshStandardMaterial({color: defaultSkin}));
      group.add(torso);
      camera.position.set(0, 0, 4);
      camera.lookAt(0, 0, 0);
      group.rotation.y = Math.PI / 6;
      group.rotation.x = Math.PI / 12;

    } else if (asset.type === 'pants') {
      const legGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
      const skinColors = { leftLeg: defaultSkin, rightLeg: defaultSkin };
      const multi = await AvatarTextureManager.loadMultiLayerMaterials({
        skinColorHex: defaultSkin,
        skinColors,
        pantsUrl: asset.textureUrl
      });
      const leftLeg = new THREE.Mesh(legGeo, multi.leftLeg || new THREE.MeshStandardMaterial({color: defaultSkin}));
      const rightLeg = new THREE.Mesh(legGeo, multi.rightLeg || new THREE.MeshStandardMaterial({color: defaultSkin}));
      
      leftLeg.position.set(-0.55, 0, 0);
      rightLeg.position.set(0.55, 0, 0);
      
      group.add(leftLeg);
      group.add(rightLeg);
      
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      group.rotation.y = Math.PI / 6;
      group.rotation.x = Math.PI / 12;

    } else if (asset.type === 'face') {
      const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const faceTex = await AvatarTextureManager.loadFaceTextureForSkin(asset.textureUrl, defaultSkin);
      const skinMat = new THREE.MeshStandardMaterial({color: defaultSkin});
      const faceMat = new THREE.MeshStandardMaterial({map: faceTex});
      const head = new THREE.Mesh(headGeo, [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat]);
      group.add(head);
      camera.position.set(0, 0, 3);
      camera.lookAt(0, 0, 0);
      group.rotation.y = Math.PI / 8;

    } else if (asset.type === 'hat') {
      const hat = HatMeshManager.createHat(asset.modelType);
      // Center the hat
      const box = new THREE.Box3().setFromObject(hat);
      const center = box.getCenter(new THREE.Vector3());
      hat.position.sub(center);
      group.add(hat);
      camera.position.set(0, 1, 4);
      camera.lookAt(0, 0, 0);
      group.rotation.y = Math.PI / 4;
      group.rotation.x = Math.PI / 8;

    } else {
      // generic fallback
      const geo = new THREE.BoxGeometry(1,1,1);
      const mat = new THREE.MeshStandardMaterial({color: 0xcccccc});
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);
      camera.position.set(0, 0, 3);
      camera.lookAt(0, 0, 0);
    }

    this.renderer.render(scene, camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    this.cache.set(asset.id, dataUrl);
    return dataUrl;
  }
}

export const ThumbnailGenerator = new ThumbnailGeneratorSystem();
