import * as THREE from 'three';

export class SpatialAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.listener = null;
    this.soundMap = new Map();
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.isInitialized = true;
        console.log('3D Spatial Audio Engine initialized.');
      }
    } catch (err) {
      console.warn('Web Audio API not supported:', err);
    }
  }

  updateListenerPosition(cameraPosition, cameraRotation) {
    if (!this.isInitialized || !this.audioCtx) return;
    const listener = this.audioCtx.listener;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(cameraPosition.x, this.audioCtx.currentTime);
      listener.positionY.setValueAtTime(cameraPosition.y, this.audioCtx.currentTime);
      listener.positionZ.setValueAtTime(cameraPosition.z, this.audioCtx.currentTime);
    } else if (listener.setPosition) {
      listener.setPosition(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    }
  }

  playSpatialBeep(position = [0, 0, 0], frequency = 440, duration = 0.2) {
    this.init();
    if (!this.isInitialized || !this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const panner = this.audioCtx.createPanner();

    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 1000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(position[0], this.audioCtx.currentTime);
      panner.positionY.setValueAtTime(position[1], this.audioCtx.currentTime);
      panner.positionZ.setValueAtTime(position[2], this.audioCtx.currentTime);
    } else if (panner.setPosition) {
      panner.setPosition(position[0], position[1], position[2]);
    }

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(panner);
    panner.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }
}
