import * as THREE from 'three';

export class HatMeshManager {
  /**
   * Creates a 3D Hat mesh attached to head group
   */
  static createHat(hatType) {
    const hatGroup = new THREE.Group();

    if (hatType === 'fedora') {
      // Classic Fedora Hat
      const brimGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.08, 24);
      const brimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
      const brim = new THREE.Mesh(brimGeo, brimMat);
      brim.position.y = 0.65;
      brim.castShadow = true;
      hatGroup.add(brim);

      const crownGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.7, 24);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 0.98;
      crown.castShadow = true;
      hatGroup.add(crown);

      // Red hat band
      const bandGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.15, 24);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.72;
      hatGroup.add(band);
    } else if (hatType === 'shades') {
      // Cool 3D Black Sunglasses
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.0, transmission: 0.5, thickness: 0.1 });
      
      const lensGeo = new THREE.BoxGeometry(0.5, 0.3, 0.05);
      
      const leftLens = new THREE.Mesh(lensGeo, glassMat);
      leftLens.position.set(-0.3, 0.2, 0.62);
      hatGroup.add(leftLens);

      const rightLens = new THREE.Mesh(lensGeo, glassMat);
      rightLens.position.set(0.3, 0.2, 0.62);
      hatGroup.add(rightLens);

      const bridgeGeo = new THREE.BoxGeometry(0.2, 0.05, 0.05);
      const bridge = new THREE.Mesh(bridgeGeo, frameMat);
      bridge.position.set(0, 0.25, 0.62);
      hatGroup.add(bridge);

      const sideGeo = new THREE.BoxGeometry(0.05, 0.05, 0.7);
      const leftSide = new THREE.Mesh(sideGeo, frameMat);
      leftSide.position.set(-0.55, 0.25, 0.3);
      hatGroup.add(leftSide);

      const rightSide = new THREE.Mesh(sideGeo, frameMat);
      rightSide.position.set(0.55, 0.25, 0.3);
      hatGroup.add(rightSide);
    } else if (hatType === 'wizard') {
      // Wizard Hat
      const brimGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.08, 24);
      const brimMat = new THREE.MeshStandardMaterial({ color: 0x4338ca, roughness: 0.6 });
      const brim = new THREE.Mesh(brimGeo, brimMat);
      brim.position.y = 0.65;
      brim.castShadow = true;
      hatGroup.add(brim);

      const coneGeo = new THREE.ConeGeometry(0.8, 1.8, 24);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x3730a3, roughness: 0.6 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 1.5;
      cone.rotation.z = -0.1;
      cone.castShadow = true;
      hatGroup.add(cone);
    } else if (hatType === 'crown') {
      // Golden Royal Crown
      const crownGeo = new THREE.CylinderGeometry(0.75, 0.7, 0.5, 8);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
      const crown = new THREE.Mesh(crownGeo, crownMat);
      crown.position.y = 0.9;
      crown.castShadow = true;
      hatGroup.add(crown);
    } else if (hatType === 'cap') {
      // Baseball Cap
      const domeGeo = new THREE.SphereGeometry(0.72, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
      const dome = new THREE.Mesh(domeGeo, capMat);
      dome.position.y = 0.65;
      dome.castShadow = true;
      hatGroup.add(dome);

      const visorGeo = new THREE.BoxGeometry(0.8, 0.05, 0.6);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 0.68, 0.7);
      visor.rotation.x = 0.15;
      visor.castShadow = true;
      hatGroup.add(visor);
    }

    return hatGroup;
  }
}
