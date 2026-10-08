import * as THREE from 'three';

/**
 * Renderer.js
 * ---------------------------------------------------------------------------
 * Owns everything that draws: the WebGL renderer, the perspective camera, the
 * scene graph, the hemisphere sky, the Lagos soil ground plane and the
 * lighting rig (sun + sky dome light + moonlight).
 *
 * The scene reacts to the time of day through `updateEnvironment()`, which is
 * fed a plain environment state object produced by `world/TimeSystem.js` - so
 * this class never needs to know *how* time is measured.
 */

/** Ground plane is 500m x 500m. */
export const WORLD_SIZE = 500;

/** Metres covered by one ground texture tile (the texture repeats 25x). */
const GROUND_TILE_METRES = 20;

/* -------------------------------------------------------------------------- */
/* Lagos colour palette                                                        */
/* -------------------------------------------------------------------------- */

/** Nigerian soil / laterite road colour (spec). */
export const SOIL_COLOR = 0xc2956c;
/** Danfo yellow - also the player capsule colour (spec). */
export const DANFO_YELLOW = 0xffd700;

const COLORS = {
  daySkyTop: 0x87ceeb, // bright Lagos blue-white (spec)
  daySkyHorizon: 0xdcecf6,
  nightSkyTop: 0x0a0a2e, // deep blue night (spec)
  nightSkyHorizon: 0x161d4d,
  sunset: 0xff5a24, // harmattan orange/red sunset
  sunHigh: 0xfff4e2,
  sunLow: 0xff7a33,
  moon: 0x8fa8e0,
  stars: 0xfff8e7,
  /** Light bounced off the soil - the hemisphere light's ground colour. */
  soilBounce: SOIL_COLOR,
  /** At night the soil only reflects a cold moonlit blue. */
  nightBounce: 0x1b2140,
};

/* -------------------------------------------------------------------------- */
/* Sky dome shader                                                             */
/* -------------------------------------------------------------------------- */

const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunsetColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunDirection;
  uniform float uTwilight;
  uniform float uSunVisibility;

  varying vec3 vDirection;

  void main() {
    vec3 dir = normalize(vDirection);

    // Vertical gradient: a hazy band at the horizon (as it looks over Lagos
    // lagoon) fading into the zenith colour about 25 degrees up, so the warm
    // sunrise/sunset wash stays close to the horizon and the blue survives
    // overhead.
    float blend = smoothstep(-0.05, 0.45, dir.y);
    vec3 sky = mix(uHorizonColor, uTopColor, blend);

    // Warm band hugging the horizon around the sun at dawn/dusk.
    float sunDot = max(dot(dir, uSunDirection), 0.0);
    float horizonBand = 1.0 - smoothstep(0.0, 0.4, abs(dir.y));
    float glow = pow(sunDot, 3.0) * horizonBand * uTwilight;
    sky = mix(sky, uSunsetColor, clamp(glow * 0.85, 0.0, 0.85));

    // Sun halo + disc.
    sky += uSunColor * pow(sunDot, 90.0) * 0.25 * uSunVisibility;
    sky += uSunColor * smoothstep(0.99935, 0.99975, sunDot) * 2.6 * uSunVisibility;

    gl_FragColor = vec4(sky, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* -------------------------------------------------------------------------- */

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    canvas.id = 'game-canvas';

    /* ----------------------------- WebGL renderer ----------------------------- */
    this.webgl = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
    });
    this.pixelRatioScale = 1;
    this.qualityTier = -1; // forces setQualityTier(0) to apply the defaults
    this.quality = 'high';
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.webgl.shadowMap.enabled = true;
    this.webgl.shadowMap.type = THREE.PCFShadowMap;
    this.webgl.outputColorSpace = THREE.SRGBColorSpace;
    // No tone mapping keeps the specified palette (#C2956C / #87CEEB / #FFD700)
    // faithful to the design instead of filmic-shifting it.
    this.webgl.toneMapping = THREE.NoToneMapping;

    /* --------------------------------- Scene --------------------------------- */
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(COLORS.daySkyHorizon, 80, 430);

    /* --------------------------------- Camera -------------------------------- */
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 4000);
    this.camera.position.set(0, 6, 10);
    this.camera.lookAt(0, 1.5, 0);

    /* ---------------------------------- Sky ---------------------------------- */
    this.skyUniforms = {
      uTopColor: { value: new THREE.Color(COLORS.nightSkyTop) },
      uHorizonColor: { value: new THREE.Color(COLORS.nightSkyHorizon) },
      uSunsetColor: { value: new THREE.Color(COLORS.sunset) },
      uSunColor: { value: new THREE.Color(COLORS.sunHigh) },
      uSunDirection: { value: new THREE.Vector3(0, 1, 0) },
      uTwilight: { value: 0 },
      uSunVisibility: { value: 0 },
    };

    const skyGeometry = new THREE.SphereGeometry(1800, 32, 20);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      vertexShader: SKY_VERTEX_SHADER,
      fragmentShader: SKY_FRAGMENT_SHADER,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

    this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.sky.name = 'Sky';
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);

    /* --------------------------------- Stars --------------------------------- */
    this.stars = this._createStars(1200);
    this.scene.add(this.stars);

    /* -------------------------------- Ground --------------------------------- */
    this.ground = this._createGround();
    this.scene.add(this.ground);
    this.scene.add(this._createWorldBoundary());

    /* -------------------------------- Lighting ------------------------------- */
    this.hemiLight = new THREE.HemisphereLight(COLORS.daySkyTop, SOIL_COLOR, 0.8);
    this.hemiLight.position.set(0, 60, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(COLORS.sunHigh, 2.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.bias = -0.0006;
    this.sunLight.shadow.normalBias = 0.03;
    // A tight frustum around the player keeps a 2048 map sharp on a big world.
    const shadowExtent = 40;
    this.sunLight.shadow.camera.left = -shadowExtent;
    this.sunLight.shadow.camera.right = shadowExtent;
    this.sunLight.shadow.camera.top = shadowExtent;
    this.sunLight.shadow.camera.bottom = -shadowExtent;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Soft blue fill so the world stays readable after sundown.
    this.moonLight = new THREE.DirectionalLight(COLORS.moon, 0);
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    /* --------------------------------- Scratch -------------------------------- */
    this._sunDir = new THREE.Vector3(0, 1, 0);
    this._topColor = new THREE.Color();
    this._horizonColor = new THREE.Color();
    this._sunColor = new THREE.Color();
    this._fogColor = new THREE.Color();
    this._hemiColor = new THREE.Color();
    this._tmpColor = new THREE.Color();

    this.resize();
  }

  /* ------------------------------------------------------------------------ */
  /* Construction helpers                                                      */
  /* ------------------------------------------------------------------------ */

  /**
   * Cheap canvas-painted soil texture: laterite base colour + grain + a faint
   * 5m ground grid so movement is readable on an otherwise uniform plane.
   * No external assets, everything is drawn procedurally.
   */
  _createGroundTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const rand = mulberry32(0x5eed);

    // Base: Nigerian soil / dusty road brown.
    ctx.fillStyle = `#${SOIL_COLOR.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, size, size);

    // Large patchy stains (dry earth, patches of laterite).
    for (let i = 0; i < 60; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 8 + rand() * 46;
      const dark = rand() > 0.45;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = dark
        ? `rgba(122, 82, 48, ${0.03 + rand() * 0.07})`
        : `rgba(232, 200, 160, ${0.03 + rand() * 0.06})`;
      ctx.fill();
    }

    // Fine grain: subtle, so the plane reads as smooth sunbaked earth rather
    // than static when the camera moves.
    for (let i = 0; i < 11000; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 0.4 + rand() * 1.4;
      const light = rand() > 0.5;
      ctx.fillStyle = light
        ? `rgba(255, 236, 205, ${0.015 + rand() * 0.05})`
        : `rgba(88, 58, 32, ${0.015 + rand() * 0.06})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faint 5m grid (each tile repeats every GROUND_TILE_METRES metres).
    const gridStep = size / 4;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(96, 64, 34, 0.16)';
    for (let i = 0; i <= 4; i += 1) {
      const p = Math.min(i * gridStep, size - 0.5) + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(WORLD_SIZE / GROUND_TILE_METRES, WORLD_SIZE / GROUND_TILE_METRES);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(this.webgl.capabilities.getMaxAnisotropy(), 8);
    texture.needsUpdate = true;
    return texture;
  }

  /** The 500m x 500m flat ground plane. */
  _createGround() {
    this.groundTexture = this._createGroundTexture();

    const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      map: this.groundTexture,
      color: 0xffffff, // texture already carries SOIL_COLOR
      roughness: 0.98,
      metalness: 0,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.name = 'Ground';
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    return ground;
  }

  /** Thin outline marking the edge of the playable 500m x 500m area. */
  _createWorldBoundary() {
    const h = WORLD_SIZE / 2 - 0.5;
    const points = [
      new THREE.Vector3(-h, 0.02, -h),
      new THREE.Vector3(h, 0.02, -h),
      new THREE.Vector3(h, 0.02, h),
      new THREE.Vector3(-h, 0.02, h),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x8a6a45,
      transparent: true,
      opacity: 0.65,
      fog: true,
    });
    const boundary = new THREE.LineLoop(geometry, material);
    boundary.name = 'WorldBoundary';
    return boundary;
  }

  /** Star dome that fades in after sunset. */
  _createStars(count) {
    const positions = new Float32Array(count * 3);
    const rand = mulberry32(0xA11CE);
    for (let i = 0; i < count; i += 1) {
      // Uniform-ish distribution on the upper half of a sphere.
      const theta = rand() * Math.PI * 2;
      const y = 0.04 + rand() * 0.96;
      const r = Math.sqrt(1 - y * y);
      const radius = 1500;
      positions[i * 3 + 0] = Math.cos(theta) * r * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * r * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: COLORS.stars,
      size: 2.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });

    const stars = new THREE.Points(geometry, material);
    stars.name = 'Stars';
    stars.frustumCulled = false;
    stars.renderOrder = 0;
    return stars;
  }

  /* ------------------------------------------------------------------------ */
  /* Per-frame environment                                                     */
  /* ------------------------------------------------------------------------ */

  /**
   * Drive sky, fog, sun, stars and shadows from the current time of day.
   *
   * @param {object} env                     environment state from TimeSystem
   * @param {THREE.Vector3} env.sunDirection normalized direction *towards* the sun
   * @param {number} env.elevation           -1 (below) .. 1 (overhead)
   * @param {number} env.daylight            0 at night .. 1 in full day
   * @param {number} env.twilight            0 .. 1 at sunrise/sunset peak
   * @param {number} env.nightness           1 - daylight
   * @param {THREE.Vector3} focus            point the shadows should follow (player)
   */
  updateEnvironment(env, focus) {
    const day = env.daylight;
    const twilight = env.twilight;

    this._sunDir.copy(env.sunDirection);

    /* ------------------------------- Sky colours ------------------------------ */
    this._topColor.setHex(COLORS.nightSkyTop).lerp(this._tmpColor.setHex(COLORS.daySkyTop), day);
    this._horizonColor.setHex(COLORS.nightSkyHorizon).lerp(this._tmpColor.setHex(COLORS.daySkyHorizon), day);

    // Sunrise / sunset wash: strong at the horizon, subtle at the zenith.
    const sunset = this._tmpColor.setHex(COLORS.sunset);
    this._horizonColor.lerp(sunset, twilight * 0.6);
    this._topColor.lerp(sunset, twilight * 0.14);

    this.skyUniforms.uTopColor.value.copy(this._topColor);
    this.skyUniforms.uHorizonColor.value.copy(this._horizonColor);
    this.skyUniforms.uSunDirection.value.copy(this._sunDir);
    this.skyUniforms.uTwilight.value = twilight;
    this.skyUniforms.uSunVisibility.value = smoothstep(-0.06, 0.04, env.elevation);

    /* ---------------------------------- Fog ---------------------------------- */
    const fog = this.scene.fog;
    this._fogColor.copy(this._horizonColor).lerp(this._tmpColor.setHex(COLORS.nightSkyTop), env.nightness * 0.35);
    fog.color.copy(this._fogColor);
    // Haze: the soil dissolves into the horizon colour before the edge of the
    // 500m plane, which also hides the world boundary.
    fog.near = 70;
    fog.far = 340;

    /* --------------------------------- Sun light ------------------------------ */
    // Warm, low sun near the horizon; crisp white when high.
    const warmth = 1 - THREE.MathUtils.clamp(env.elevation / 0.32, 0, 1);
    this._sunColor.setHex(COLORS.sunHigh).lerp(this._tmpColor.setHex(COLORS.sunLow), warmth);
    this.sunLight.color.copy(this._sunColor);
    // The sun fades through civil twilight rather than switching off at the
    // horizon, so sunset stays warm and bright instead of going grey.
    this.sunLight.intensity = 2.8 * smoothstep(-0.28, 0.12, env.elevation);

    // Keep the shadow frustum centred on the player at a fixed distance.
    this.sunLight.position.copy(focus).addScaledVector(this._sunDir, 140);
    this.sunLight.target.position.copy(focus);
    this.sunLight.target.updateMatrixWorld();
    this.sunLight.shadow.camera.updateProjectionMatrix();

    // Sky dome bounce light. At dawn and dusk the sun is level with the soil so
    // the directional light barely reaches it (NdotL ~ 0); the warm glow around
    // the horizon is what actually lights Lagos at those hours. The hemisphere
    // light therefore leans towards the horizon colour and swells with the
    // twilight instead of tracking the (dark) zenith.
    this._hemiColor
      .copy(this._topColor)
      .lerp(this._horizonColor, 0.4 + 0.45 * twilight);
    const hemiGain = 1 + 0.9 * twilight;
    this.hemiLight.color.copy(this._hemiColor).multiplyScalar(hemiGain);
    this.hemiLight.groundColor
      .setHex(COLORS.soilBounce)
      .lerp(this._tmpColor.setHex(COLORS.nightBounce), env.nightness);
    this.hemiLight.intensity = 0.24 + 0.6 * day + 0.85 * twilight;

    /* -------------------------------- Moonlight ------------------------------- */
    this.moonLight.color.setHex(COLORS.moon);
    this.moonLight.intensity = 0.3 * env.nightness;
    this.moonLight.position.copy(focus).addScaledVector(this._sunDir, -120).setY(90);
    this.moonLight.target.position.copy(focus);
    this.moonLight.target.updateMatrixWorld();

    /* --------------------------------- Stars --------------------------------- */
    // Stars only come out once the sun is properly below the horizon.
    this.stars.material.opacity = THREE.MathUtils.clamp((-env.elevation - 0.02) * 3.2, 0, 1);
    this.stars.visible = this.stars.material.opacity > 0.01;

    /* ------------------------------- Sky follows ------------------------------ */
    this.sky.position.copy(focus);
  }

  /* ------------------------------------------------------------------------ */
  /* Rendering                                                                 */
  /* ------------------------------------------------------------------------ */

  /** Match the drawing buffer to the canvas CSS size. */
  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2) * (this.pixelRatioScale ?? 1));
    this.webgl.setSize(width, height, false);

    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.webgl.render(this.scene, this.camera);
  }

  /* ------------------------------------------------------------------------ */
  /* Adaptive quality (keeps the frame budget when the GPU is weak)            */
  /* ------------------------------------------------------------------------ */

  /**
   * Quality tiers, best first. `scale` multiplies the device pixel ratio,
   * `shadowMapSize` is the sun shadow resolution (0 disables shadows).
   */
  static QUALITY_TIERS = [
    { name: 'high', pixelRatioScale: 1, shadowMapSize: 2048 },
    { name: 'medium', pixelRatioScale: 0.85, shadowMapSize: 1024 },
    { name: 'low', pixelRatioScale: 0.65, shadowMapSize: 0 },
  ];

  /** Move one tier down (or up) when the framerate drifts off target. */
  setQualityTier(index) {
    const clamped = THREE.MathUtils.clamp(index, 0, Renderer.QUALITY_TIERS.length - 1);
    if (clamped === this.qualityTier) return this.qualityTier;

    this.qualityTier = clamped;
    const tier = Renderer.QUALITY_TIERS[clamped];
    this.quality = tier.name;

    if (tier.shadowMapSize === 0) {
      this.webgl.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
    } else {
      this.webgl.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      if (this.sunLight.shadow.mapSize.width !== tier.shadowMapSize) {
        this.sunLight.shadow.mapSize.set(tier.shadowMapSize, tier.shadowMapSize);
        // Force three.js to allocate a new depth target.
        this.sunLight.shadow.map?.dispose();
        this.sunLight.shadow.map = null;
      }
    }

    this.pixelRatioScale = tier.pixelRatioScale;
    this.resize();
    return this.qualityTier;
  }

  dispose() {
    this.groundTexture?.dispose();
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.ground.geometry.dispose();
    this.ground.material.dispose();
    this.stars.geometry.dispose();
    this.stars.material.dispose();
    this.webgl.dispose();
  }
}

/* -------------------------------------------------------------------------- */
/* Small shared helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Deterministic PRNG so the procedural ground looks the same every run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}
