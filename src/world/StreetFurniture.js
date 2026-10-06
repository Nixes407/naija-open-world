import * as THREE from 'three';

export default class StreetFurniture {
  constructor(scene) {
    this.scene  = scene;
    this._group = new THREE.Group();
    this._group.name = 'streetFurniture';
    scene.add(this._group);
  }

  _rand(min, max) {
    return min + Math.random() * (max - min);
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _makePowerPole(x, z) {
    const group = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(
      0.12, 0.18, 11, 8
    );
    const poleMat = new THREE.MeshLambertMaterial({
      color: '#5C4033',
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 5.5;
    pole.castShadow = true;
    group.add(pole);

    const armGeo = new THREE.BoxGeometry(3, 0.15, 0.15);
    const arm    = new THREE.Mesh(armGeo, poleMat);
    arm.position.y = 10.5;
    group.add(arm);

    [-1.2, 1.2].forEach(ox => {
      const insGeo = new THREE.CylinderGeometry(
        0.08, 0.08, 0.3, 6
      );
      const ins = new THREE.Mesh(insGeo,
        new THREE.MeshLambertMaterial({
          color: '#FFFFFF'
        })
      );
      ins.position.set(ox, 10.65, 0);
      group.add(ins);
    });

    group.position.set(x, 0, z);
    return group;
  }

  _makeStreetLight(x, z) {
    const group = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(
      0.08, 0.12, 8, 8
    );
    const postMat = new THREE.MeshLambertMaterial({
      color: '#888888',
    });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 4;
    post.castShadow = true;
    group.add(post);

    const armGeo = new THREE.BoxGeometry(1.8, 0.1, 0.1);
    const arm    = new THREE.Mesh(armGeo, postMat);
    arm.position.set(0.9, 8.1, 0);
    group.add(arm);

    const lampGeo = new THREE.BoxGeometry(
      0.6, 0.25, 0.35
    );
    const lampMat = new THREE.MeshLambertMaterial({
      color:    '#FFD700',
      emissive: '#AA8800',
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(1.8, 7.9, 0);
    group.add(lamp);

    group.position.set(x, 0, z);
    return group;
  }

  _makeBusStop(x, z, rotation = 0) {
    const group = new THREE.Group();

    const roofGeo = new THREE.BoxGeometry(5, 0.2, 2.5);
    const roofMat = new THREE.MeshLambertMaterial({
      color: '#FFD700',
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.8;
    roof.castShadow = true;
    group.add(roof);

    const backGeo = new THREE.BoxGeometry(
      5, 2.6, 0.15
    );
    const backMat = new THREE.MeshLambertMaterial({
      color: '#E8D5B0',
    });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, 1.3, -1.1);
    group.add(back);

    [-2.3, 2.3].forEach(ox => {
      const postGeo = new THREE.BoxGeometry(
        0.15, 2.8, 0.15
      );
      const post = new THREE.Mesh(postGeo,
        new THREE.MeshLambertMaterial({
          color: '#888888'
        })
      );
      post.position.set(ox, 1.4, -0.5);
      group.add(post);
    });

    const benchGeo = new THREE.BoxGeometry(
      4.2, 0.15, 0.5
    );
    const benchMat = new THREE.MeshLambertMaterial({
      color: '#8B6914',
    });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, 0.55, -0.85);
    group.add(bench);

    const signGeo = new THREE.BoxGeometry(
      2.5, 0.6, 0.05
    );
    const signMat = new THREE.MeshLambertMaterial({
      color: '#006400',
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.4, -1.08);
    group.add(sign);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    return group;
  }

  _makeMarketStall(x, z, rotation = 0) {
    const group = new THREE.Group();
    const postMat = new THREE.MeshLambertMaterial({
      color: '#5C4033',
    });

    [[-1.5,-1],[1.5,-1],[-1.5,1],[1.5,1]]
    .forEach(([ox, oz]) => {
      const pGeo = new THREE.CylinderGeometry(
        0.06, 0.06, 2.4, 6
      );
      const p = new THREE.Mesh(pGeo, postMat);
      p.position.set(ox, 1.2, oz);
      p.castShadow = true;
      group.add(p);
    });

    const canopyColors = [
      '#FF6B35','#FFD700','#E63946',
      '#2ECC71','#3498DB',
    ];
    const canopyGeo = new THREE.BoxGeometry(
      3.6, 0.08, 2.6
    );
    const canopyMat = new THREE.MeshLambertMaterial({
      color: this._pick(canopyColors),
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 2.44;
    canopy.castShadow = true;
    group.add(canopy);

    const tableGeo = new THREE.BoxGeometry(
      3, 0.1, 1
    );
    const tableMat = new THREE.MeshLambertMaterial({
      color: '#8B7355',
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 1.0, -0.4);
    group.add(table);

    for (let i = 0; i < 5; i++) {
      const gGeo = new THREE.BoxGeometry(
        this._rand(0.2, 0.5),
        this._rand(0.1, 0.4),
        this._rand(0.2, 0.4)
      );
      const gMat = new THREE.MeshLambertMaterial({
        color: this._pick([
          '#FF6B35','#FFD700','#E63946',
          '#2ECC71','#F5E6C8','#8B0000',
        ]),
      });
      const g = new THREE.Mesh(gGeo, gMat);
      g.position.set(
        this._rand(-1.2, 1.2), 1.2, -0.4
      );
      group.add(g);
    }

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    return group;
  }

  _makeGutter(x, z, length, horizontal) {
    const gutterGeo = horizontal
      ? new THREE.BoxGeometry(length, 0.3, 0.5)
      : new THREE.BoxGeometry(0.5, 0.3, length);
    const gutterMat = new THREE.MeshLambertMaterial({
      color: '#555555',
    });
    const gutter = new THREE.Mesh(gutterGeo, gutterMat);
    gutter.position.set(x, -0.1, z);
    gutter.receiveShadow = true;
    return gutter;
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

        this._group.add(
          this._makePowerPole(
            cx - blockSize / 2 + 2,
            cz - blockSize / 2 + 2
          )
        );
        this._group.add(
          this._makePowerPole(
            cx + blockSize / 2 - 2,
            cz + blockSize / 2 - 2
          )
        );
        this._group.add(
          this._makeStreetLight(
            cx - blockSize / 2 - 2, cz
          )
        );
        this._group.add(
          this._makeStreetLight(
            cx + blockSize / 2 + 2, cz
          )
        );

        if ((r + c) % 3 === 0) {
          this._group.add(
            this._makeBusStop(
              cx,
              cz - blockSize / 2 - roadWidth / 2 + 2,
              0
            )
          );
        }

        if ((r + c) % 2 === 0) {
          const stallCount = Math.floor(
            this._rand(2, 5)
          );
          for (let s = 0; s < stallCount; s++) {
            this._group.add(
              this._makeMarketStall(
                cx + this._rand(
                  -blockSize/2+4, blockSize/2-4
                ),
                cz + this._rand(
                  -blockSize/2+4, blockSize/2-4
                ),
                this._rand(0, Math.PI * 2)
              )
            );
          }
        }

        this._group.add(
          this._makeGutter(
            cx,
            cz - blockSize/2 - roadWidth/2 + 0.8,
            blockSize + roadWidth,
            true
          )
        );
      }
    }
    return this._group;
  }

  dispose() {
    this.scene.remove(this._group);
  }
}
