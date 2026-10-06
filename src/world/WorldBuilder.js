import * as THREE from 'three';

// ── Nigerian building color palette ──────────────
const WALL_COLORS = [
  '#F5E6C8', // cream/off-white (most common)
  '#E8D5B0', // sandy beige
  '#C4956A', // terracotta
  '#D4C5A9', // light grey-beige
  '#B8860B', // dark goldenrod (older buildings)
  '#8B7355', // brown
  '#E8C49A', // peach
  '#F0D9B5', // light tan
];

const ROOF_COLORS = [
  '#8B0000', // dark red (common zinc roof)
  '#696969', // grey (concrete slab)
  '#556B2F', // dark olive green
  '#4A4A4A', // dark grey
  '#8B4513', // saddle brown
  '#2F4F4F', // dark slate
];

const ACCENT_COLORS = [
  '#228B22', // green window frames
  '#1E90FF', // blue doors
  '#FF8C00', // orange trim
  '#8B0000', // dark red accents
];

export default class WorldBuilder {
  constructor(scene) {
    this.scene  = scene;
    this._group = new THREE.Group();
    this._group.name = 'city';
    scene.add(this._group);
  }

  // ── Utility: random item from array ──────────
  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── Utility: random float between min and max ─
  _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  // ── Build one building ────────────────────────
  _makeBuilding(x, z, w, d, h, wallColor, roofColor) {
    const group = new THREE.Group();

    // Main wall body
    const wallGeo = new THREE.BoxGeometry(w, h, d);
    const wallMat = new THREE.MeshLambertMaterial({
      color: wallColor,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = h / 2;
    wall.castShadow    = true;
    wall.receiveShadow = true;
    group.add(wall);

    // Flat roof slab (slightly wider than walls)
    const roofGeo = new THREE.BoxGeometry(
      w + 0.3, 0.3, d + 0.3
    );
    const roofMat = new THREE.MeshLambertMaterial({
      color: roofColor,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y    = h + 0.15;
    roof.castShadow    = true;
    roof.receiveShadow = true;
    group.add(roof);

    // Windows (2 rows, evenly spaced)
    const winColor  = this._pick(ACCENT_COLORS);
    const winMat    = new THREE.MeshLambertMaterial({
      color: winColor,
    });
    const winRows   = Math.max(1, Math.floor(h / 3));
    const winCols   = Math.max(1, Math.floor(w / 2.5));
    const winW      = 0.6;
    const winH      = 0.8;
    const winD      = 0.05;

    for (let row = 0; row < winRows; row++) {
      for (let col = 0; col < winCols; col++) {
        const wx = -w / 2 + 1.2 +
                   col * (w - 1.2) / Math.max(1, winCols - 1);
        const wy = 1.5 + row * 3;
        if (wy >= h) continue;

        // Front face windows
        const winGeo = new THREE.BoxGeometry(
          winW, winH, winD
        );
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(wx, wy, d / 2 + 0.03);
        group.add(win);
      }
    }

    // Compound wall (low fence around building)
    if (w > 6 && d > 6) {
      const fenceH   = 1.2;
      const fenceMat = new THREE.MeshLambertMaterial({
        color: '#D2B48C',
      });
      // Front fence
      const fFGeo = new THREE.BoxGeometry(
        w + 2, fenceH, 0.2
      );
      const fF = new THREE.Mesh(fFGeo, fenceMat);
      fF.position.set(0, fenceH / 2, d / 2 + 1);
      group.add(fF);
      // Back fence
      const fBGeo = new THREE.BoxGeometry(
        w + 2, fenceH, 0.2
      );
      const fB = new THREE.Mesh(fBGeo, fenceMat);
      fB.position.set(0, fenceH / 2, -(d / 2 + 1));
      group.add(fB);
      // Left fence
      const fLGeo = new THREE.BoxGeometry(
        0.2, fenceH, d + 2
      );
      const fL = new THREE.Mesh(fLGeo, fenceMat);
      fL.position.set(-(w / 2 + 1), fenceH / 2, 0);
      group.add(fL);
      // Right fence
      const fRGeo = new THREE.BoxGeometry(
        0.2, fenceH, d + 2
      );
      const fR = new THREE.Mesh(fRGeo, fenceMat);
      fR.position.set(w / 2 + 1, fenceH / 2, 0);
      group.add(fR);
    }

    group.position.set(x, 0, z);
    return group;
  }

  // ── Generate a city block ─────────────────────
  _makeBlock(centerX, centerZ, blockSize) {
    const group    = new THREE.Group();
    const margin   = 3;
    const padding  = 2;
    const usable   = blockSize - margin * 2;

    // Number of buildings depends on block size
    const cols = Math.floor(usable / 14);
    const rows = Math.floor(usable / 14);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellW = usable / cols;
        const cellD = usable / rows;

        const bx = -usable / 2 + cellW * (c + 0.5);
        const bz = -usable / 2 + cellD * (r + 0.5);

        // Building dimensions (varied)
        const bw = this._rand(
          cellW * 0.4, cellW * 0.75
        );
        const bd = this._rand(
          cellD * 0.4, cellD * 0.75
        );

        // Height variety:
        // 70% low (1-2 floors), 25% medium (3-5),
        // 5% tall (6-12)
        const roll = Math.random();
        let bh;
        if      (roll < 0.70) bh = this._rand(3,  7);
        else if (roll < 0.95) bh = this._rand(9, 16);
        else                  bh = this._rand(18, 36);

        const wallColor = this._pick(WALL_COLORS);
        const roofColor = this._pick(ROOF_COLORS);

        const building = this._makeBuilding(
          bx, bz, bw, bd, bh, wallColor, roofColor
        );
        group.add(building);
      }
    }

    group.position.set(centerX, 0, centerZ);
    return group;
  }

  // ── Generate the full city grid ───────────────
  build(options = {}) {
    const {
      gridCols   = 8,
      gridRows   = 8,
      blockSize  = 40,
      roadWidth  = 10,
    } = options;

    const step = blockSize + roadWidth;
    const offX = -(gridCols - 1) * step / 2;
    const offZ = -(gridRows - 1) * step / 2;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const cx = offX + c * step;
        const cz = offZ + r * step;
        const block = this._makeBlock(
          cx, cz, blockSize
        );
        this._group.add(block);
      }
    }

    return this._group;
  }

  // ── Remove city from scene ────────────────────
  dispose() {
    this.scene.remove(this._group);
  }
}
