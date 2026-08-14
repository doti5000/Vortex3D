import * as THREE from 'three';

export class AvatarTextureManager {
  static textureCache = new Map();
  static normalMapCache = null;

  /**
   * Generates a procedural fabric & plastic mold normal map for classic clothes
   */
  static getFabricNormalMap() {
    if (AvatarTextureManager.normalMapCache) return AvatarTextureManager.normalMapCache;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(256, 256);
    const data = imgData.data;

    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const idx = (y * 256 + x) * 4;
        const nx = Math.sin(x * 0.4) * 0.15;
        const ny = Math.cos(y * 0.4) * 0.15;
        const nz = Math.sqrt(Math.max(0, 1.0 - nx * nx - ny * ny));

        data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    AvatarTextureManager.normalMapCache = texture;
    return texture;
  }

  /**
   * Classic Face texture processor with automatic Chroma-Key Background Transparency & Skin Color Alignment
   */
  static async loadFaceTextureForSkin(faceUrl, skinColorHex) {
    const key = `face_${faceUrl}_${skinColorHex}`;
    if (AvatarTextureManager.textureCache.has(key)) {
      return AvatarTextureManager.textureCache.get(key);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const w = img.width || 256;
        const h = img.height || 256;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        const tempColor = new THREE.Color(skinColorHex);
        const skinR = Math.floor(tempColor.r * 255);
        const skinG = Math.floor(tempColor.g * 255);
        const skinB = Math.floor(tempColor.b * 255);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          const colorDiff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
          if (a < 20 || colorDiff < 50) {
            data[i] = skinR;
            data[i + 1] = skinG;
            data[i + 2] = skinB;
            data[i + 3] = 255;
          }
        }

        ctx.putImageData(imgData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        AvatarTextureManager.textureCache.set(key, texture);
        resolve(texture);
      };

      img.onerror = () => resolve(null);
      img.src = faceUrl;
    });
  }

  /**
   * Single-Pass Multi-Layer Canvas Compositor: Torso & Arms draw Shirt ONLY, Legs draw Pants ONLY
   */
  static async loadMultiLayerMaterials({ skinColorHex, shirtUrl, pantsUrl, tshirtDecalUrl, skinColors = {} }) {
    const torsoSkin = skinColors.torso || skinColorHex || '#3b82f6';
    const larmSkin = skinColors.leftArm || skinColorHex || '#fde047';
    const rarmSkin = skinColors.rightArm || skinColorHex || '#fde047';
    const llegSkin = skinColors.leftLeg || skinColorHex || '#1e293b';
    const rlegSkin = skinColors.rightLeg || skinColorHex || '#1e293b';

    const key = `multilayer_v3_${torsoSkin}_${larmSkin}_${rarmSkin}_${llegSkin}_${rlegSkin}_${shirtUrl}_${pantsUrl}_${tshirtDecalUrl}`;
    if (AvatarTextureManager.textureCache.has(key)) {
      return AvatarTextureManager.textureCache.get(key);
    }

    const loadImage = (url) => new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

    const [shirtImg, pantsImg, decalImg] = await Promise.all([
      loadImage(shirtUrl),
      loadImage(pantsUrl),
      loadImage(tshirtDecalUrl)
    ]);

    // Roblox 585x559 Standard R6 Template Reference Grid
    const refW = 585.0;
    const refH = 559.0;

    const getScaledCoords = (img, normBox) => {
      if (!img || !normBox) return null;
      const [x, y, w, h] = normBox;
      return [
        (x / refW) * img.width,
        (y / refH) * img.height,
        (w / refW) * img.width,
        (h / refH) * img.height
      ];
    };

    const createSingleFaceMaterial = ({ shirtBox, pantsBox, skinColor, isFrontDecal = false }) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // 1. Fill 100% background with exact limb skin color
      ctx.fillStyle = skinColor;
      ctx.fillRect(0, 0, 512, 512);

      // 2. Draw Pants Sub-Panel ONLY if designated for pants (Legs)
      if (pantsImg && pantsBox) {
        const coords = getScaledCoords(pantsImg, pantsBox);
        if (coords) {
          ctx.drawImage(pantsImg, coords[0], coords[1], coords[2], coords[3], 0, 0, 512, 512);
        }
      }

      // 3. Draw Shirt Sub-Panel ONLY if designated for shirt (Torso & Arms)
      if (shirtImg && shirtBox) {
        const coords = getScaledCoords(shirtImg, shirtBox);
        if (coords) {
          ctx.drawImage(shirtImg, coords[0], coords[1], coords[2], coords[3], 0, 0, 512, 512);
        }
      }

      // 4. Center Front Graphic T-Shirt Decal Layer
      if (decalImg && isFrontDecal) {
        const decalW = 340;
        const decalH = 340;
        ctx.drawImage(decalImg, (512 - decalW) / 2, (512 - decalH) / 2, decalW, decalH);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      return new THREE.MeshStandardMaterial({
        map: texture,
        normalMap: AvatarTextureManager.getFabricNormalMap(),
        normalScale: new THREE.Vector2(0.15, 0.15),
        roughness: 0.5,
        metalness: 0.05
      });
    };

    // Exact Roblox 585x559 R6 Shirt Template Coordinates [x, y, w, h]
    const net = {
      // --- TORSO (Width 2.0, Height 2.0, Depth 1.0) ---
      torsoRight:  [131, 74, 64, 128],   // +X (Right side of torso)
      torsoLeft:   [325, 74, 64, 128],   // -X (Left side of torso)
      torsoTop:    [197, 10, 128, 64],   // +Y (Shoulders)
      torsoBottom: [329, 10, 128, 64],   // -Y (Bottom)
      torsoFront:  [197, 74, 128, 128],  // +Z (Chest Front)
      torsoBack:   [393, 74, 128, 128],  // -Z (Back)

      // --- RIGHT ARM ---
      rArmRight:   [2,   356, 64, 128],  // +X (Outer Right)
      rArmLeft:    [130, 356, 64, 128],  // -X (Inner Left)
      rArmTop:     [66,  292, 64, 64],   // +Y (Right Shoulder)
      rArmBottom:  [132, 292, 64, 64],   // -Y
      rArmFront:   [66,  356, 64, 128],  // +Z (Right Arm Front)
      rArmBack:    [194, 356, 64, 128],  // -Z (Right Arm Back)

      // --- LEFT ARM ---
      lArmRight:   [330, 356, 64, 128],  // +X (Inner Right)
      lArmLeft:    [458, 356, 64, 128],  // -X (Outer Left)
      lArmTop:     [394, 292, 64, 64],   // +Y (Left Shoulder)
      lArmBottom:  [460, 292, 64, 64],   // -Y
      lArmFront:   [394, 356, 64, 128],  // +Z (Left Arm Front)
      lArmBack:    [522, 356, 64, 128],  // -Z (Left Arm Back)

      // --- RIGHT LEG ---
      rLegRight:   [2,   356, 64, 128],
      rLegLeft:    [130, 356, 64, 128],
      rLegTop:     [66,  292, 64, 64],
      rLegBottom:  [132, 292, 64, 64],
      rLegFront:   [66,  356, 64, 128],
      rLegBack:    [194, 356, 64, 128],

      // --- LEFT LEG ---
      lLegRight:   [330, 356, 64, 128],
      lLegLeft:    [458, 356, 64, 128],
      lLegTop:     [394, 292, 64, 64],
      lLegBottom:  [460, 292, 64, 64],
      lLegFront:   [394, 356, 64, 128],
      lLegBack:    [522, 356, 64, 128]
    };

    // Three.js BoxGeometry face material order: [+X, -X, +Y, -Y, +Z, -Z]
    const materials = {
      // Torso: Shirt ONLY (no duplicate pants overlay)
      torso: [
        createSingleFaceMaterial({ shirtBox: net.torsoRight,  pantsBox: null, skinColor: torsoSkin }),
        createSingleFaceMaterial({ shirtBox: net.torsoLeft,   pantsBox: null, skinColor: torsoSkin }),
        createSingleFaceMaterial({ shirtBox: net.torsoTop,    pantsBox: null, skinColor: torsoSkin }),
        createSingleFaceMaterial({ shirtBox: net.torsoBottom, pantsBox: null, skinColor: torsoSkin }),
        createSingleFaceMaterial({ shirtBox: net.torsoFront,  pantsBox: null, skinColor: torsoSkin, isFrontDecal: true }),
        createSingleFaceMaterial({ shirtBox: net.torsoBack,   pantsBox: null, skinColor: torsoSkin })
      ],

      // Right Arm: Shirt ONLY
      rightArm: [
        createSingleFaceMaterial({ shirtBox: net.rArmRight,  pantsBox: null, skinColor: rarmSkin }),
        createSingleFaceMaterial({ shirtBox: net.rArmLeft,   pantsBox: null, skinColor: rarmSkin }),
        createSingleFaceMaterial({ shirtBox: net.rArmTop,    pantsBox: null, skinColor: rarmSkin }),
        createSingleFaceMaterial({ shirtBox: net.rArmBottom, pantsBox: null, skinColor: rarmSkin }),
        createSingleFaceMaterial({ shirtBox: net.rArmFront,  pantsBox: null, skinColor: rarmSkin }),
        createSingleFaceMaterial({ shirtBox: net.rArmBack,   pantsBox: null, skinColor: rarmSkin })
      ],

      // Left Arm: Shirt ONLY
      leftArm: [
        createSingleFaceMaterial({ shirtBox: net.lArmRight,  pantsBox: null, skinColor: larmSkin }),
        createSingleFaceMaterial({ shirtBox: net.lArmLeft,   pantsBox: null, skinColor: larmSkin }),
        createSingleFaceMaterial({ shirtBox: net.lArmTop,    pantsBox: null, skinColor: larmSkin }),
        createSingleFaceMaterial({ shirtBox: net.lArmBottom, pantsBox: null, skinColor: larmSkin }),
        createSingleFaceMaterial({ shirtBox: net.lArmFront,  pantsBox: null, skinColor: larmSkin }),
        createSingleFaceMaterial({ shirtBox: net.lArmBack,   pantsBox: null, skinColor: larmSkin })
      ],

      // Right Leg: Pants ONLY
      rightLeg: [
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.rLegRight,  skinColor: rlegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.rLegLeft,   skinColor: rlegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.rLegTop,    skinColor: rlegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.rLegBottom, skinColor: rlegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.rLegFront,  skinColor: rlegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.rLegBack,   skinColor: rlegSkin })
      ],

      // Left Leg: Pants ONLY
      leftLeg: [
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.lLegRight,  skinColor: llegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.lLegLeft,   skinColor: llegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.lLegTop,    skinColor: llegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.lLegBottom, skinColor: llegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.lLegFront,  skinColor: llegSkin }),
        createSingleFaceMaterial({ shirtBox: null, pantsBox: net.lLegBack,   skinColor: llegSkin })
      ]
    };

    AvatarTextureManager.textureCache.set(key, materials);
    return materials;
  }
}
