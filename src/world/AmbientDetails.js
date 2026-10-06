import * as THREE from 'three';

const DANFO_YELLOW = '#FFD700';
const DANFO_STRIPE = '#000000';

export default class AmbientDetails {
  constructor(scene) {
    this.scene  = scene;
    this._group = new THREE.Group();
    this._group.name = 'ambientDetails';
    scene.add(this._group);
  }

  _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _makeTree(x, z) {
    const group   = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(
      0.2, 0.3, 3, 8
    );
    const trunkMat = new THREE.MeshLambertMaterial({
      color: '#5C4033',
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);

    const leafColors = [
      '#228B22','#2E8B57','#006400','#32CD32',
    ];
    const leafMat = new THREE.MeshLambertMaterial({
      color: this._pick(leafColors),
    });
    [{y:4.5,r:2.2},{y:6.0,r:1.6}].forEach(
      ({y, r}) => {
        const leafGeo = new THREE.SphereGeometry(
          r, 8, 6
        );
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.y = y;
        leaf.castShadow = true;
        group.add(leaf);
      }
    );

    group.position.set(x, 0, z);
    return group;
  }

  _makeParkedDanfo(x, z, rotation = 0) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(
      5.5, 2.2, 2.4
    );
    const bodyMat = new THREE.MeshLambertMaterial({
      color: DANFO_YELLOW,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);

    const stripeGeo = new THREE.BoxGeometry(
      5.6, 0.4, 2.45
    );
    const stripeMat = new THREE.MeshLambertMaterial({
      color: DANFO_STRIPE,
    });
    const stripe = new THREE.Mesh(
      stripeGeo, stripeMat
    );
    stripe.position.y = 1.4;
    group.add(stripe);

    const rackGeo = new THREE.BoxGeometry(5, 0.1, 2);
    const rackMat = new THREE.MeshLambertMaterial({
      color: '#C0C0C0',
    });
    const rack = new THREE.Mesh(rackGeo, rackMat);
    rack.position.y = 2.55;
    group.add(rack);

    [[-2,-1.25],[-2,1.25],[2,-1.25],[2,1.25]]
    .forEach(([wx, wz]) => {
      const wGeo = new THREE.CylinderGeometry(
        0.4, 0.4, 0.25, 12
      );
      const wMat = new THREE.MeshLambertMaterial({
        color: '#1a1a1a',
      });
      const wheel = new THREE.Mesh(wGeo, wMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.4, wz);
      group.add(wheel);
    });

    const wsGeo = new THREE.BoxGeometry(
      0.1, 1.0, 2.0
    );
    const wsMat = new THREE.MeshLambertMaterial({
      color:       '#87CEEB',
      transparent: true,
      opacity:     0.6,
    });
    const ws = new THREE.Mesh(wsGeo, wsMat);
    ws.position.set(2.76, 1.9, 0);
    group.add(ws);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    return group;
  }

  _makeParkedOkada(x, z, rotation = 0) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(
      1.8, 0.8, 0.5
    );
    const bodyMat = new THREE.MeshLambertMaterial({
      color: this._pick([
        '#FF0000','#0000FF','#FF8C00','#008000',
      ]),
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    group.add(body);

    [-0.7, 0.7].forEach(wx => {
      const wGeo = new THREE.TorusGeometry(
        0.38, 0.1, 8, 16
      );
      const wMat = new THREE.MeshLambertMaterial({
        color: '#1a1a1a',
      });
      const wheel = new THREE.Mesh(wGeo, wMat);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(wx, 0.4, 0);
      group.add(wheel);
    });

    const hGeo = new THREE.BoxGeometry(0.1, 0.1, 0.9);
    const hMat = new THREE.MeshLambertMaterial({
      color: '#888888',
    });
    const h = new THREE.Mesh(hGeo, hMat);
    h.position.set(0.7, 1.35, 0);
    group.add(h);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    return group;
  }

  _makePothole(x, z) {
    const geo = new THREE.CircleGeometry(
      this._rand(0.4, 1.2), 10
    );
    const mat = new THREE.MeshLambertMaterial({
      color: '#111111',
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.015, z);
    return mesh;
  }

  _makeWallMural(x, z, rotation = 0) {
    const group = new THREE.Group();
    const colors = [
      '#008751','#FFFFFF','#FFD700',
      '#E63946','#3498DB','#FF6B35',
    ];
    for (let i = 0; i < 3; i++) {
      const pGeo = new THREE.PlaneGeometry(
        this._rand(1.5, 3.5), 1.2
      );
      const pMat = new THREE.MeshLambertMaterial({
        color: this._pick(colors),
        side:  THREE.DoubleSide,
      });
      const panel = new THREE.Mesh(pGeo, pMat);
      panel.position.set(
        this._rand(-2, 2), 1.0 + i * 1.3, 0
      );
      group.add(panel);
    }
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    return group;
  }

  build(options = {}) {
    const {
      gridCols  = 8,
      gridRows  = 8,
      blockSize = 40,
      roadWidth = 10,
    } = options;

    const step = blockSize + roadWidth;
    const offX = -(gridCols - 1) * step / 2;
    const offZ = -(gridRows - 1) * step / 2;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const cx = offX + c * step;
        const cz = offZ + r * step;

        const treeCount = Math.floor(
          this._rand(2, 5)
        );
        for (let t = 0; t < treeCount; t++) {
          this._group.add(
            this._makeTree(
              cx + this._rand(
                -blockSize/2+1, blockSize/2-1
              ),
              cz - blockSize / 2 - 3
            )
          );
        }

        if (Math.random() > 0.4) {
          this._group.add(
            this._makeParkedDanfo(
              cx + this._rand(-15, 15),
              cz - blockSize/2 - roadWidth/2 + 3,
              this._pick([0, Math.PI])
            )
          );
        }

        if (Math.random() > 0.5) {
          const okCount = Math.floor(
            this._rand(1, 4)
          );
          for (let o = 0; o < okCount; o++) {
            this._group.add(
              this._makeParkedOkada(
                cx + this._rand(-12, 12),
                cz + blockSize / 2 + 2,
                this._rand(0, Math.PI * 2)
              )
            );
          }
        }

        const holeCount = Math.floor(
          this._rand(1, 4)
        );
        for (let h = 0; h < holeCount; h++) {
          this._group.add(
            this._makePothole(
              cx + this._rand(-4, 4),
              cz - blockSize/2 - roadWidth/2
            )
          );
        }

        if (Math.random() > 0.65) {
          this._group.add(
            this._makeWallMural(
              cx + this._rand(-10, 10),
              cz + this._rand(-10, 10),
              this._rand(0, Math.PI * 2)
            )
          );
        }
      }
    }
    return this._group;
  }

  dispose() {
    this.scene.remove(this._group);
  }
}
