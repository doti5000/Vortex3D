import * as THREE from 'three';

export class EnvironmentManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.timeOfDay = 12.0; // 0 to 24 hours
    this.cycleSpeed = 0.05; // hours per sec
    this.weather = 'clear'; // 'clear' | 'rain' | 'fog'
    this.sunLight = null;

    // Find directional sun light
    this.renderer.scene.traverse((obj) => {
      if (obj.isDirectionalLight) {
        this.sunLight = obj;
      }
    });
  }

  setWeather(weatherType) {
    this.weather = weatherType;
    if (weatherType === 'fog') {
      this.renderer.scene.fog = new THREE.FogExp2(0x0f172a, 0.02);
    } else {
      this.renderer.scene.fog = null;
    }
  }

  update(dt = 0.016) {
    // 1. Advance Time of Day
    this.timeOfDay = (this.timeOfDay + this.cycleSpeed * dt) % 24.0;

    // 2. Calculate Sun Position Angle
    const sunAngle = (this.timeOfDay / 24.0) * Math.PI * 2 - Math.PI / 2;
    const sunX = Math.cos(sunAngle) * 40;
    const sunY = Math.sin(sunAngle) * 40;

    if (this.sunLight) {
      this.sunLight.position.set(sunX, Math.max(-5, sunY), 20);

      // Night / Sunset / Day Light Color Transitions
      if (sunY < 0) { // Night
        this.sunLight.intensity = 0.1;
        this.sunLight.color.setHex(0x38bdf8);
        this.renderer.scene.background.setHex(0x05070a);
      } else if (sunY < 8) { // Sunset / Sunrise
        this.sunLight.intensity = 0.8;
        this.sunLight.color.setHex(0xf97316);
        this.renderer.scene.background.setHex(0x1e1b4b);
      } else { // Midday
        this.sunLight.intensity = 1.4;
        this.sunLight.color.setHex(0xffffff);
        this.renderer.scene.background.setHex(0x0a0d14);
      }
    }
  }
}
