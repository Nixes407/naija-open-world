import * as THREE from 'three';

export default class WaterSystem {
  constructor(scene) {
    this.scene   = scene;
    this._group  = new THREE.Group();
    this._group.name = 'water';
    this._meshes = [];
    this._clock  = new THREE.Clock();
    scene.add(this._group);
  }

  build(options = {}) {
    const {
      width  = 500,
      length = 300,
      x      = 0,
      z      = 260,
    } = options;

    // ── Main lagoon plane ──────────────────────
    const geo = new THREE.PlaneGeometry(
      width, length, 32, 32
    );
    geo.rotateX(-Math.PI / 2);

    // Store original Y positions for wave animation
    const pos      = geo.attributes.position;
    const originY  = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      originY[i] = pos.getY(i);
    }
    geo.userData.originY = originY;

    const mat = new THREE.MeshLambertMaterial({
      color:       '#1a6b8a',
      transparent: true,
      opacity:     0.85,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, -0.3, z);
    mesh.receiveShadow = true;
    mesh.name = 'lagoon';
    this._group.add(mesh);
    this._meshes.push(mesh);

    // ── Shoreline edge (darker strip) ─────────
    const shoreGeo = new THREE.PlaneGeometry(
      width + 10, 8
    );
    const shoreMat = new THREE.MeshLambertMaterial({
      color: '#8B7355',
    });
    const shore = new THREE.Mesh(shoreGeo, shoreMat);
    shore.rotation.x = -Math.PI / 2;
    shore.position.set(x, 0.005, z - length / 2);
    shore.receiveShadow = true;
    this._group.add(shore);

    // ── Distant water shimmer strips ──────────
    // (lighter color lines to suggest light on water)
    const shimmerMat = new THREE.MeshLambertMaterial({
      color:       '#4FC3F7',
      transparent: true,
      opacity:     0.3,
    });
    for (let i = 0; i < 6; i++) {
      const sGeo = new THREE.PlaneGeometry(
        this._rand(60, 180), 1.5
      );
      const s = new THREE.Mesh(sGeo, shimmerMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(
        this._rand(-width / 2, width / 2),
        -0.28,
        z + this._rand(-length / 3, length / 3)
      );
      this._group.add(s);
      this._meshes.push(s);
    }

    return this._group;
  }

  _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // ── Call every frame from main loop ──────────
  update() {
    const t = this._clock.getElapsedTime();

    // Animate the lagoon mesh vertices for waves
    const lagoon = this._group.getObjectByName('lagoon');
    if (!lagoon) return;

    const pos     = lagoon.geometry.attributes.position;
    const originY = lagoon.geometry.userData.originY;
    if (!originY) return;

    for (let i = 0; i < pos.count; i++) {
      const x     = pos.getX(i);
      const z     = pos.getZ(i);
      const wave  = Math.sin(x * 0.05 + t * 0.8) * 0.15
                  + Math.sin(z * 0.08 + t * 0.6) * 0.10
                  + Math.sin((x + z) * 0.04 + t) * 0.08;
      pos.setY(i, originY[i] + wave);
    }
    pos.needsUpdate = true;
    lagoon.geometry.computeVertexNormals();
  }

  dispose() {
    this.scene.remove(this._group);
  }
}
