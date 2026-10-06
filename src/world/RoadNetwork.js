import * as THREE from 'three';

export default class RoadNetwork {
  constructor(scene) {
    this.scene  = scene;
    this._group = new THREE.Group();
    this._group.name = 'roads';
    scene.add(this._group);
  }

  // ── Build one road segment ────────────────────
  _makeRoad(x, z, width, length, horizontal) {
    const group = new THREE.Group();

    // Asphalt surface
    const roadGeo = horizontal
      ? new THREE.PlaneGeometry(length, width)
      : new THREE.PlaneGeometry(width, length);
    const roadMat = new THREE.MeshLambertMaterial({
      color: '#1a1a1a', // dark asphalt
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x    = -Math.PI / 2;
    road.position.y    = 0.01; // just above ground
    road.receiveShadow = true;
    group.add(road);

    // Center line (dashed yellow)
    const lineCount  = Math.floor(
      (horizontal ? length : length) / 6
    );
    const lineMat = new THREE.MeshLambertMaterial({
      color: '#FFD700',
    });
    for (let i = 0; i < lineCount; i++) {
      const lineGeo = new THREE.PlaneGeometry(
        horizontal ? 3 : 0.15,
        horizontal ? 0.15 : 3
      );
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.y = 0.02;
      if (horizontal) {
        line.position.x = -length / 2 + 3 + i * 6;
      } else {
        line.position.z = -length / 2 + 3 + i * 6;
      }
      group.add(line);
    }

    // Pavement/sidewalk edges
    const paveMat = new THREE.MeshLambertMaterial({
      color: '#8B7355', // worn concrete
    });
    const paveH   = 0.15;
    const paveW   = 1.5;

    if (horizontal) {
      // Top edge
      const ptGeo = new THREE.BoxGeometry(
        length, paveH, paveW
      );
      const pt = new THREE.Mesh(ptGeo, paveMat);
      pt.position.set(0, paveH / 2, width / 2 + paveW / 2);
      pt.receiveShadow = true;
      group.add(pt);
      // Bottom edge
      const pbGeo = new THREE.BoxGeometry(
        length, paveH, paveW
      );
      const pb = new THREE.Mesh(pbGeo, paveMat);
      pb.position.set(
        0, paveH / 2, -(width / 2 + paveW / 2)
      );
      pb.receiveShadow = true;
      group.add(pb);
    } else {
      // Left edge
      const plGeo = new THREE.BoxGeometry(
        paveW, paveH, length
      );
      const pl = new THREE.Mesh(plGeo, paveMat);
      pl.position.set(
        -(width / 2 + paveW / 2), paveH / 2, 0
      );
      pl.receiveShadow = true;
      group.add(pl);
      // Right edge
      const prGeo = new THREE.BoxGeometry(
        paveW, paveH, length
      );
      const pr = new THREE.Mesh(prGeo, paveMat);
      pr.position.set(
        width / 2 + paveW / 2, paveH / 2, 0
      );
      pr.receiveShadow = true;
      group.add(pr);
    }

    group.position.set(x, 0, z);
    return group;
  }

  // ── Build intersection box ────────────────────
  _makeIntersection(x, z, size) {
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshLambertMaterial({
      color: '#1a1a1a',
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x    = -Math.PI / 2;
    mesh.position.set(x, 0.01, z);
    mesh.receiveShadow = true;
    return mesh;
  }

  // ── Build full road grid ──────────────────────
  build(options = {}) {
    const {
      gridCols  = 8,
      gridRows  = 8,
      blockSize = 40,
      roadWidth = 10,
    } = options;

    const step   = blockSize + roadWidth;
    const offX   = -(gridCols - 1) * step / 2;
    const offZ   = -(gridRows - 1) * step / 2;
    const totalW = gridCols * step;
    const totalL = gridRows * step;

    // Horizontal roads (run along X axis)
    for (let r = 0; r <= gridRows; r++) {
      const z = offZ - roadWidth / 2 - blockSize / 2
                + r * step;
      this._group.add(
        this._makeRoad(0, z, roadWidth, totalW, true)
      );
    }

    // Vertical roads (run along Z axis)
    for (let c = 0; c <= gridCols; c++) {
      const x = offX - roadWidth / 2 - blockSize / 2
                + c * step;
      this._group.add(
        this._makeRoad(x, 0, roadWidth, totalL, false)
      );
    }

    // Intersections
    for (let r = 0; r <= gridRows; r++) {
      for (let c = 0; c <= gridCols; c++) {
        const x = offX - roadWidth / 2 -
                  blockSize / 2 + c * step;
        const z = offZ - roadWidth / 2 -
                  blockSize / 2 + r * step;
        this._group.add(
          this._makeIntersection(x, z, roadWidth)
        );
      }
    }

    return this._group;
  }

  dispose() {
    this.scene.remove(this._group);
  }
}
