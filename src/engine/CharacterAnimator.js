import * as THREE from 'three';

export class CharacterAnimator {
  constructor(parts) {
    this.parts = parts;
    this.currentState = 'idle';
    this.targetState = 'idle';
    this.animTime = 0;
    this.blendWeight = 0.15; // Smooth crossfade speed

    // Target rotations per limb [rotX, rotY, rotZ]
    this.targetRotations = {
      head: [0, 0, 0],
      leftArm: [0, 0, 0],
      rightArm: [0, 0, 0],
      leftLeg: [0, 0, 0],
      rightLeg: [0, 0, 0]
    };
  }

  setState(state) {
    if (this.targetState !== state) {
      this.targetState = state;
    }
  }

  update(dt) {
    this.animTime += dt * 10;
    const time = this.animTime;

    // Calculate raw target poses per state
    if (this.targetState === 'walk') {
      const swing = Math.sin(time);
      this.targetRotations.head = [0, Math.sin(time * 0.5) * 0.05, 0];
      this.targetRotations.leftArm = [swing * 0.7, 0, 0];
      this.targetRotations.rightArm = [-swing * 0.7, 0, 0];
      this.targetRotations.leftLeg = [-swing * 0.7, 0, 0];
      this.targetRotations.rightLeg = [swing * 0.7, 0, 0];
    } else if (this.targetState === 'climb') {
      const swing = Math.sin(time * 0.8);
      this.targetRotations.head = [-0.2, 0, 0];
      this.targetRotations.leftArm = [-Math.PI + swing * 0.5, 0, 0];
      this.targetRotations.rightArm = [-Math.PI - swing * 0.5, 0, 0];
      this.targetRotations.leftLeg = [swing * 0.4, 0, 0];
      this.targetRotations.rightLeg = [-swing * 0.4, 0, 0];
    } else if (this.targetState === 'jump') {
      this.targetRotations.head = [-0.15, 0, 0];
      this.targetRotations.leftArm = [-2.2, 0, -0.3];
      this.targetRotations.rightArm = [-2.2, 0, 0.3];
      this.targetRotations.leftLeg = [0.4, 0, 0];
      this.targetRotations.rightLeg = [-0.4, 0, 0];
    } else if (this.targetState === 'fall') {
      const flail = Math.sin(time * 2) * 0.2;
      this.targetRotations.head = [0.1, 0, 0];
      this.targetRotations.leftArm = [-1.5 + flail, 0, -0.8];
      this.targetRotations.rightArm = [-1.5 - flail, 0, 0.8];
      this.targetRotations.leftLeg = [0.3, 0, 0];
      this.targetRotations.rightLeg = [-0.3, 0, 0];
    } else if (this.targetState === 'dance') {
      const side = Math.sin(time * 1.2);
      this.targetRotations.head = [0, side * 0.3, Math.cos(time * 1.2) * 0.1];
      this.targetRotations.leftArm = [-1.2 + side * 0.4, 0, -0.4];
      this.targetRotations.rightArm = [-1.2 - side * 0.4, 0, 0.4];
      this.targetRotations.leftLeg = [side * 0.2, 0, 0];
      this.targetRotations.rightLeg = [-side * 0.2, 0, 0];
    } else if (this.targetState === 'wave') {
      const wave = Math.sin(time * 2) * 0.3;
      this.targetRotations.head = [0, 0.2, 0];
      this.targetRotations.leftArm = [Math.sin(time * 0.2) * 0.05, 0, 0];
      this.targetRotations.rightArm = [-2.5, wave, 0.4];
      this.targetRotations.leftLeg = [0, 0, 0];
      this.targetRotations.rightLeg = [0, 0, 0];
    } else if (this.targetState === 'cheer') {
      const cheerJump = Math.sin(time * 1.5) * 0.2;
      this.targetRotations.head = [-0.3, 0, 0];
      this.targetRotations.leftArm = [-2.8, 0, -0.4];
      this.targetRotations.rightArm = [-2.8, 0, 0.4];
      this.targetRotations.leftLeg = [cheerJump, 0, 0];
      this.targetRotations.rightLeg = [-cheerJump, 0, 0];
    } else {
      // Idle Breathing
      const breath = Math.sin(time * 0.2) * 0.05;
      this.targetRotations.head = [breath * 0.5, 0, 0];
      this.targetRotations.leftArm = [breath, 0, 0];
      this.targetRotations.rightArm = [-breath, 0, 0];
      this.targetRotations.leftLeg = [0, 0, 0];
      this.targetRotations.rightLeg = [0, 0, 0];
    }

    // Smooth Crossfade Blending using Lerp
    this.blendLimb('head', this.parts.head);
    this.blendLimb('leftArm', this.parts.leftArm);
    this.blendLimb('rightArm', this.parts.rightArm);
    this.blendLimb('leftLeg', this.parts.leftLeg);
    this.blendLimb('rightLeg', this.parts.rightLeg);
  }

  blendLimb(limbName, mesh) {
    if (!mesh) return;
    const target = this.targetRotations[limbName];
    mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, target[0], this.blendWeight);
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, target[1], this.blendWeight);
    mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, target[2], this.blendWeight);
  }
}
