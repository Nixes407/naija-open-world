import * as THREE from 'three';

export default class Landmarks {
  constructor(scene) {
    this.scene  = scene;
    this._group = new THREE.Group();
    this._group.name = 'landmarks';
    scene.add(this._group);
  }

  // ── Shared material helper ────────────────────
  _mat(color, emissive = '#000000') {
    return new THREE.MeshLambertMaterial({
      color,
      emissive,
    });
  }

  // ── NECOM House (tallest building in Lagos) ───
  // Simplified: tall rectangular tower with
  // antenna + horizontal banding
  _buildNECOMHouse(x, z) {
    const group = new THREE.Group();

    // Main tower
    const towerGeo = new THREE.BoxGeometry(18, 120, 18);
    const tower    = new THREE.Mesh(
      towerGeo, this._mat('#C0C0C0')
    );
    tower.position.y   = 60;
    tower.castShadow   = true;
    group.add(tower);

    // Horizontal floor bands (every 10 floors)
    for (let i = 0; i < 12; i++) {
      const bandGeo = new THREE.BoxGeometry(
        19.5, 0.8, 19.5
      );
      const band = new THREE.Mesh(
        bandGeo, this._mat('#888888')
      );
      band.position.y = 10 + i * 10;
      group.add(band);
    }

    // Top antenna
    const antGeo = new THREE.CylinderGeometry(
      0.3, 0.3, 20, 8
    );
    const ant = new THREE.Mesh(
      antGeo, this._mat('#444444')
    );
    ant.position.y = 130;
    group.add(ant);

    // Base podium
    const podGeo = new THREE.BoxGeometry(28, 8, 28);
    const pod    = new THREE.Mesh(
      podGeo, this._mat('#A0A0A0')
    );
    pod.position.y  = 4;
    pod.castShadow  = true;
    group.add(pod);

    group.position.set(x, 0, z);
    group.name = 'NECOMHouse';
    return group;
  }

  // ── National Theatre ──────────────────────────
  // Iconic: 4 curved petal roofs rising from
  // a circular base. Simplified as cylinders
  // with angled box "petals"
  _buildNationalTheatre(x, z) {
    const group = new THREE.Group();

    // Circular base
    const baseGeo = new THREE.CylinderGeometry(
      30, 32, 6, 32
    );
    const base    = new THREE.Mesh(
      baseGeo, this._mat('#8B6914')
    );
    base.position.y  = 3;
    base.castShadow  = true;
    group.add(base);

    // Central drum
    const drumGeo = new THREE.CylinderGeometry(
      18, 20, 20, 32
    );
    const drum    = new THREE.Mesh(
      drumGeo, this._mat('#A0856A')
    );
    drum.position.y = 16;
    group.add(drum);

    // 4 roof petals (angled boxes around center)
    const petalMat = this._mat('#6B4F2A');
    const angles   = [0, Math.PI / 2,
                      Math.PI, Math.PI * 1.5];
    angles.forEach(angle => {
      const petalGeo = new THREE.BoxGeometry(
        22, 2, 18
      );
      const petal    = new THREE.Mesh(
        petalGeo, petalMat
      );
      petal.position.set(
        Math.sin(angle) * 18,
        34,
        Math.cos(angle) * 18
      );
      petal.rotation.y = angle;
      // Tilt upward from center
      petal.rotation.z = Math.sin(angle) *
                         -0.35;
      petal.rotation.x = Math.cos(angle) *
                         -0.35;
      petal.castShadow = true;
      group.add(petal);
    });

    // Central crown
    const crownGeo = new THREE.CylinderGeometry(
      4, 6, 10, 16
    );
    const crown    = new THREE.Mesh(
      crownGeo, this._mat('#5D3E1A')
    );
    crown.position.y = 41;
    group.add(crown);

    group.position.set(x, 0, z);
    group.name = 'NationalTheatre';
    return group;
  }

  // ── Lekki-Ikoyi Link Bridge ───────────────────
  // Cable-stayed bridge: deck + 2 pylons + cables
  _buildLekkiBridge(x, z) {
    const group = new THREE.Group();

    const deckLen  = 200;
    const deckW    = 14;

    // Bridge deck
    const deckGeo = new THREE.BoxGeometry(
      deckLen, 1.2, deckW
    );
    const deck    = new THREE.Mesh(
      deckGeo, this._mat('#808080')
    );
    deck.position.y   = 14;
    deck.castShadow   = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Road surface on deck
    const surfGeo = new THREE.BoxGeometry(
      deckLen - 2, 0.2, deckW - 2
    );
    const surf    = new THREE.Mesh(
      surfGeo, this._mat('#1a1a1a')
    );
    surf.position.y = 14.7;
    group.add(surf);

    // 2 cable-stay pylons
    [-60, 60].forEach(px => {
      const pylonGeo = new THREE.BoxGeometry(
        2.5, 50, 2.5
      );
      const pylon    = new THREE.Mesh(
        pylonGeo, this._mat('#C0C0C0')
      );
      pylon.position.set(px, 39, 0);
      pylon.castShadow = true;
      group.add(pylon);

      // Cable fan from pylon top to deck
      const cabMat = this._mat('#999999');
      for (let i = -5; i <= 5; i++) {
        const dx     = i * 10;
        const dy     = 14.6 - 64;
        const dz     = 0;
        const length = Math.sqrt(
          (dx - px) * (dx - px) +
          dy * dy
        );
        const cabGeo = new THREE.BoxGeometry(
          0.2, length, 0.2
        );
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(
          (px + dx) / 2,
          64 + dy / 2,
          0
        );
        cab.rotation.z = Math.atan2(
          dx - px, -dy
        );
        group.add(cab);
      }
    });

    // Support piers underneath
    for (let i = -80; i <= 80; i += 40) {
      const pierGeo = new THREE.BoxGeometry(
        3, 14, 3
      );
      const pier    = new THREE.Mesh(
        pierGeo, this._mat('#A0A0A0')
      );
      pier.position.set(i, 7, 0);
      pier.castShadow = true;
      group.add(pier);
    }

    group.position.set(x, 0, z);
    group.rotation.y = Math.PI / 2;
    group.name = 'LekkiBridge';
    return group;
  }

  // ── Build all landmarks ───────────────────────
  build(options = {}) {
    const {
      cityOffsetX = 0,
      cityOffsetZ = 0,
    } = options;

    // NECOM House — northeast of city center
    this._group.add(
      this._buildNECOMHouse(
        cityOffsetX + 80,
        cityOffsetZ - 60
      )
    );

    // National Theatre — west of city center
    this._group.add(
      this._buildNationalTheatre(
        cityOffsetX - 120,
        cityOffsetZ - 20
      )
    );

    // Lekki-Ikoyi Bridge — south of city,
    // spanning toward water
    this._group.add(
      this._buildLekkiBridge(
        cityOffsetX + 20,
        cityOffsetZ + 200
      )
    );

    return this._group;
  }

  dispose() {
    this.scene.remove(this._group);
  }
}
