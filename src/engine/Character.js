import * as THREE from 'three';
import { AvatarTextureManager } from './AvatarTextureManager.js';
import { HatMeshManager } from './HatMeshManager.js';
import { CharacterAnimator } from './CharacterAnimator.js';
import { CharacterIK } from './CharacterIK.js';
import { CharacterRagdoll } from './CharacterRagdoll.js';

export class Character {
  constructor({
    id,
    name = 'Player',
    position = [0, 5, 0],
    skinColors = {
      head: '#fde047',
      torso: '#3b82f6',
      leftArm: '#fde047',
      rightArm: '#fde047',
      leftLeg: '#4ade80',
      rightLeg: '#4ade80'
    },
    avatarConfig = {},
    hatType = 'fedora',
    scene,
    physicsManager,
    isLocalPlayer = true
  }) {
    this.id = id || 'char_' + Math.random().toString(36).substring(2, 9);
    this.name = name;
    this.skinColors = skinColors;
    this.avatarConfig = avatarConfig;
    this.hatType = hatType;
    this.scene = scene;
    this.physicsManager = physicsManager;
    this.isLocalPlayer = isLocalPlayer;

    this.group = new THREE.Group();
    this.rigidBodyId = null;

    this.humanoid = {
      walkSpeed: 18,
      jumpPower: 160,
      health: 100,
      maxHealth: 100,
      state: 'idle',
      sizeScale: 1.0
    };

    this.faceTexturePath = this.avatarConfig.face || '/textures/classic-face-texture.png';
    this.shirtTexturePath = this.avatarConfig.shirt || null;
    this.pantsTexturePath = this.avatarConfig.pants || null;
    this.tshirtDecalPath = this.avatarConfig.tshirt || null;

    // Key states
    this.keys = { w: false, a: false, s: false, d: false, space: false, c: false };

    this.parts = {};
    this.hatGroup = null;
    this.animator = null;
    this.ik = null;
    this.ragdoll = null;

    this.initMesh();
    this.initPhysics(position);

    if (this.isLocalPlayer) {
      this.setupControls();
    }
  }

  async initMesh() {
    const headSkinMat = new THREE.MeshStandardMaterial({ color: this.skinColors.head, roughness: 0.4 });
    const torsoSkinMat = new THREE.MeshStandardMaterial({ color: this.skinColors.torso, roughness: 0.5 });
    const armSkinMat = new THREE.MeshStandardMaterial({ color: this.skinColors.leftArm, roughness: 0.4 });
    const legSkinMat = new THREE.MeshStandardMaterial({ color: this.skinColors.leftLeg, roughness: 0.5 });

    // Load single-pass multi-layer clothing materials
    const multiLayer = await AvatarTextureManager.loadMultiLayerMaterials({
      skinColorHex: this.skinColors.torso,
      skinColors: this.skinColors,
      shirtUrl: this.shirtTexturePath,
      pantsUrl: this.pantsTexturePath,
      tshirtDecalUrl: this.tshirtDecalPath
    });

    // 1. Head (1.2 x 1.2 x 1.2)
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const faceTex = await AvatarTextureManager.loadFaceTextureForSkin(this.faceTexturePath, this.skinColors.head);

    const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.4 });
    const headMaterials = [headSkinMat, headSkinMat, headSkinMat, headSkinMat, faceMat, headSkinMat];

    const headMesh = new THREE.Mesh(headGeo, headMaterials);
    headMesh.position.set(0, 2.1, 0);
    headMesh.castShadow = true;
    this.group.add(headMesh);
    this.parts.head = headMesh;
    this.parts.faceMat = faceMat;
    this.parts.skinMat = headSkinMat;

    // Attach 3D Hat Mesh
    this.setHat(this.hatType);

    // 2. Torso (2.0 x 2.0 x 1.0)
    const torsoGeo = new THREE.BoxGeometry(2.0, 2.0, 1.0);
    const torsoMaterial = (multiLayer && multiLayer.torso) ? multiLayer.torso : torsoSkinMat;
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMaterial);
    torsoMesh.position.set(0, 0.5, 0);
    torsoMesh.castShadow = true;
    this.group.add(torsoMesh);
    this.parts.torso = torsoMesh;

    // 3. Left Arm (1.0 x 2.0 x 1.0)
    const armGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
    const leftArmMaterial = (multiLayer && multiLayer.leftArm) ? multiLayer.leftArm : armSkinMat;
    const leftArmMesh = new THREE.Mesh(armGeo, leftArmMaterial);
    leftArmMesh.position.set(-1.5, 0.5, 0);
    leftArmMesh.castShadow = true;
    this.group.add(leftArmMesh);
    this.parts.leftArm = leftArmMesh;

    // 4. Right Arm (1.0 x 2.0 x 1.0)
    const rightArmMaterial = (multiLayer && multiLayer.rightArm) ? multiLayer.rightArm : armSkinMat;
    const rightArmMesh = new THREE.Mesh(armGeo, rightArmMaterial);
    rightArmMesh.position.set(1.5, 0.5, 0);
    rightArmMesh.castShadow = true;
    this.group.add(rightArmMesh);
    this.parts.rightArm = rightArmMesh;

    // 5. Left Leg (1.0 x 2.0 x 1.0)
    const legGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
    const leftLegMaterial = (multiLayer && multiLayer.leftLeg) ? multiLayer.leftLeg : legSkinMat;
    const leftLegMesh = new THREE.Mesh(legGeo, leftLegMaterial);
    leftLegMesh.position.set(-0.5, -1.5, 0);
    leftLegMesh.castShadow = true;
    this.group.add(leftLegMesh);
    this.parts.leftLeg = leftLegMesh;

    // 6. Right Leg (1.0 x 2.0 x 1.0)
    const rightLegMaterial = (multiLayer && multiLayer.rightLeg) ? multiLayer.rightLeg : legSkinMat;
    const rightLegMesh = new THREE.Mesh(legGeo, rightLegMaterial);
    rightLegMesh.position.set(0.5, -1.5, 0);
    rightLegMesh.castShadow = true;
    this.group.add(rightLegMesh);
    this.parts.rightLeg = rightLegMesh;

    // Initialize Animator, IK & Ragdoll Systems
    this.animator = new CharacterAnimator(this.parts);
    this.ik = new CharacterIK(this, this.scene);
    this.ragdoll = new CharacterRagdoll(this, this.physicsManager);

    this.scene.scene.add(this.group);
  }

  initPhysics(position) {
    this.rigidBodyId = this.physicsManager.createRigidBody({
      entityId: this.id,
      bodyType: 1, // Dynamic
      shapeType: 0, // Box
      position: position,
      extents: [2.0 * this.humanoid.sizeScale, 5.2 * this.humanoid.sizeScale, 1.2 * this.humanoid.sizeScale],
      radius: 0.0,
      mass: 5.0,
      restitution: 0.1,
      friction: 0.8
    });
  }

  setHat(hatType) {
    this.hatType = hatType;
    if (this.hatGroup) {
      this.parts.head.remove(this.hatGroup);
      this.hatGroup = null;
    }
    if (hatType && hatType !== 'none') {
      this.hatGroup = HatMeshManager.createHat(hatType);
      this.parts.head.add(this.hatGroup);
    }
  }

  async setBodyPartColor(partName, colorHex) {
    this.skinColors[partName] = colorHex;
    if (partName === 'head' && this.parts.skinMat) {
      this.parts.skinMat.color.set(colorHex);
      await this.setFaceTexture(this.faceTexturePath);
    }
    await this.refreshClothingLayers();
  }

  async refreshClothingLayers() {
    const multiLayer = await AvatarTextureManager.loadMultiLayerMaterials({
      skinColorHex: this.skinColors.torso,
      skinColors: this.skinColors,
      shirtUrl: this.shirtTexturePath,
      pantsUrl: this.pantsTexturePath,
      tshirtDecalUrl: this.tshirtDecalPath
    });

    if (multiLayer) {
      if (this.parts.torso) this.parts.torso.material = multiLayer.torso;
      if (this.parts.leftArm) this.parts.leftArm.material = multiLayer.leftArm;
      if (this.parts.rightArm) this.parts.rightArm.material = multiLayer.rightArm;
      if (this.parts.leftLeg) this.parts.leftLeg.material = multiLayer.leftLeg;
      if (this.parts.rightLeg) this.parts.rightLeg.material = multiLayer.rightLeg;
    }
  }

  async setFaceTexture(texturePath) {
    this.faceTexturePath = texturePath;
    const tex = await AvatarTextureManager.loadFaceTextureForSkin(texturePath, this.skinColors.head);
    if (this.parts.faceMat && tex) {
      this.parts.faceMat.map = tex;
      this.parts.faceMat.needsUpdate = true;
    }
  }

  async setShirtTexture(texturePath) {
    this.shirtTexturePath = texturePath;
    await this.refreshClothingLayers();
  }

  async setPantsTexture(texturePath) {
    this.pantsTexturePath = texturePath;
    await this.refreshClothingLayers();
  }

  async setTShirtDecal(decalDataUrl) {
    this.tshirtDecalPath = decalDataUrl;
    await this.refreshClothingLayers();
  }

  setSizeScale(scale) {
    this.humanoid.sizeScale = Math.max(0.5, Math.min(3.0, scale));
    this.group.scale.set(this.humanoid.sizeScale, this.humanoid.sizeScale, this.humanoid.sizeScale);
  }

  setWalkSpeed(speed) {
    this.humanoid.walkSpeed = speed;
  }

  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.keys.w = true;
      if (k === 'a' || k === 'arrowleft') this.keys.a = true;
      if (k === 's' || k === 'arrowdown') this.keys.s = true;
      if (k === 'd' || k === 'arrowright') this.keys.d = true;
      if (k === 'c') this.keys.c = !this.keys.c;

      if (k === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.keys.space = true;
        this.jump();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.keys.w = false;
      if (k === 'a' || k === 'arrowleft') this.keys.a = false;
      if (k === 's' || k === 'arrowdown') this.keys.s = false;
      if (k === 'd' || k === 'arrowright') this.keys.d = false;
      if (k === ' ' || e.code === 'Space') this.keys.space = false;
    });
  }

  jump() {
    if (!this.rigidBodyId) return;
    const currentVel = this.physicsManager.getVelocity(this.rigidBodyId);
    if (Math.abs(currentVel[1]) < 2.0) {
      this.physicsManager.applyImpulse(this.rigidBodyId, 0, this.humanoid.jumpPower, 0);
      this.humanoid.state = 'jump';
    }
  }

  triggerRagdoll(blastOrigin = null) {
    if (this.ragdoll) {
      this.ragdoll.activate(blastOrigin);
    }
  }

  takeDamage(amount) {
    if (this.humanoid.health <= 0) return;

    this.humanoid.health = Math.max(0, this.humanoid.health - amount);
    console.log(`${this.name} took ${amount} damage! Remaining HP: ${this.humanoid.health}`);

    if (this.humanoid.health <= 0) {
      this.triggerRagdoll();
      setTimeout(() => this.respawn(), 2000);
    }
  }

  respawn(spawnPos = [0, 5, 0]) {
    if (this.ragdoll && this.ragdoll.active) {
      this.ragdoll.deactivate();
    }
    this.humanoid.health = this.humanoid.maxHealth;
    this.humanoid.state = 'idle';

    if (this.rigidBodyId) {
      this.physicsManager.setPosition(this.rigidBodyId, ...spawnPos);
      this.physicsManager.setVelocity(this.rigidBodyId, 0, 0, 0);
    }
    this.group.position.set(...spawnPos);
  }

  update() {
    if (this.ragdoll && this.ragdoll.active) {
      this.ragdoll.update();
      return;
    }

    if (!this.rigidBodyId) return;

    if (this.isLocalPlayer) {
      let moveX = 0;
      let moveZ = 0;

      if (this.keys.w) moveZ -= 1;
      if (this.keys.s) moveZ += 1;
      if (this.keys.a) moveX -= 1;
      if (this.keys.d) moveX += 1;

      const currentVel = this.physicsManager.getVelocity(this.rigidBodyId);

      if (this.keys.c) {
        this.humanoid.state = 'climb';
        this.physicsManager.setVelocity(this.rigidBodyId, 0, 10, 0);
      } else if (currentVel[1] < -4.0) {
        this.humanoid.state = 'fall';
      } else if (Math.abs(currentVel[1]) > 3.0) {
        this.humanoid.state = 'jump';
      } else if (moveX !== 0 || moveZ !== 0) {
        this.humanoid.state = 'walk';
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const vx = (moveX / len) * this.humanoid.walkSpeed;
        const vz = (moveZ / len) * this.humanoid.walkSpeed;

        this.physicsManager.setVelocity(this.rigidBodyId, vx, currentVel[1], vz);
        const angle = Math.atan2(moveX, moveZ);
        this.group.rotation.y = angle;
      } else if (['dance', 'wave', 'cheer'].indexOf(this.humanoid.state) === -1) {
        this.humanoid.state = 'idle';
      }
    }

    // Step Animation State Machine Blending
    if (this.animator) {
      this.animator.setState(this.humanoid.state);
      this.animator.update(0.016);
    }

    // Step Procedural Foot IK
    if (this.ik && this.humanoid.state === 'walk') {
      this.ik.update();
    }

    const pos = this.physicsManager.getPosition(this.rigidBodyId);
    this.group.position.set(pos[0], pos[1], pos[2]);

    // Void Death (-100% HP below y < -30)
    if (pos[1] < -30 && this.humanoid.health > 0) {
      console.log(`${this.name} fell into the void! (-100% HP)`);
      this.takeDamage(100);
    }
  }

  destroy() {
    if (this.rigidBodyId) {
      this.physicsManager.removeRigidBody(this.rigidBodyId);
    }
    this.scene.scene.remove(this.group);
  }
}
