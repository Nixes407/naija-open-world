import * as CANNON from 'cannon-es';

export default class CollisionSystem {
  constructor(world) {
    // world = CANNON.World instance
    this._world  = world;
    this._bodies = [];
  }

  // ── Add a static box collider ─────────────
  _addBox(cx, cy, cz, hw, hh, hd) {
    const shape = new CANNON.Box(
      new CANNON.Vec3(hw, hh, hd)
    );
    const body  = new CANNON.Body({
      mass:     0,       // static
      type:     CANNON.Body.STATIC,
      material: new CANNON.Material({
        friction:    0.3,
        restitution: 0.0,
      }),
    });
    body.addShape(shape);
    body.position.set(cx, cy, cz);
    this._world.addBody(body);
    this._bodies.push(body);
    return body;
  }

  // ── Add a static cylinder collider ───────
  _addCylinder(cx, cy, cz, radius, height) {
    const shape = new CANNON.Cylinder(
      radius, radius, height, 8
    );
    const body  = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
    });
    body.addShape(shape);
    body.position.set(cx, cy, cz);
    this._world.addBody(body);
    this._bodies.push(body);
    return body;
  }

  // ── Generate colliders for city blocks ───
  buildCityColliders(options = {}) {
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

        // ── Building colliders ──
        // WorldBuilder creates cols×rows buildings
        // per block. We add one large block
        // collider per building footprint rather
        // than per-mesh for performance.
        const cols   = Math.max(
          1, Math.floor((blockSize - 6) / 14)
        );
        const rows   = Math.max(
          1, Math.floor((blockSize - 6) / 14)
        );
        const usable = blockSize - 6;
        const cellW  = usable / cols;
        const cellD  = usable / rows;

        for (let br = 0; br < rows; br++) {
          for (let bc = 0; bc < cols; bc++) {
            const bx = cx - usable / 2 +
                       cellW * (bc + 0.5);
            const bz = cz - usable / 2 +
                       cellD * (br + 0.5);
            const bw = cellW * 0.75;
            const bd = cellD * 0.75;
            // Height: use a tall collider 
            // (40m covers all building heights)
            this._addBox(
              bx, 20, bz,  // cx, cy, cz
              bw / 2, 20, bd / 2 // half-extents
            );
          }
        }

        // ── Compound wall colliders (4 sides) ──
        // Low walls around larger buildings
        const wallH = 0.6;
        const wallT = 0.1;
        // Front wall
        this._addBox(
          cx, wallH,
          cz - blockSize / 2 + 1,
          blockSize / 2 + 1, wallH, wallT
        );
        // Back wall
        this._addBox(
          cx, wallH,
          cz + blockSize / 2 - 1,
          blockSize / 2 + 1, wallH, wallT
        );
        // Left wall
        this._addBox(
          cx - blockSize / 2 + 1,
          wallH, cz,
          wallT, wallH, blockSize / 2 + 1
        );
        // Right wall
        this._addBox(
          cx + blockSize / 2 - 1,
          wallH, cz,
          wallT, wallH, blockSize / 2 + 1
        );

        // ── Bus stop colliders ──
        if ((r + c) % 3 === 0) {
          // Match bus stop position from
          // StreetFurniture._makeBusStop()
          this._addBox(
            cx, 1.5,
            cz - blockSize / 2 -
            roadWidth / 2 + 2,
            2.5, 1.5, 1.2
          );
        }

        // ── Parked danfo colliders ──
        // Approximate positions from
        // AmbientDetails (road edge)
        this._addBox(
          cx, 1.1,
          cz - blockSize / 2 -
          roadWidth / 2 + 3,
          2.75, 1.1, 1.2
        );
      }
    }
  }

  // ── Landmark colliders ────────────────────
  buildLandmarkColliders(options = {}) {
    const {
      cityOffsetX = 0,
      cityOffsetZ = 0,
    } = options;

    // NECOM House — tall narrow tower
    // Position from Landmarks._buildNECOMHouse()
    this._addBox(
      cityOffsetX + 80,  60,
      cityOffsetZ - 60,
      9, 60, 9
    );
    // NECOM podium
    this._addBox(
      cityOffsetX + 80, 4,
      cityOffsetZ - 60,
      14, 4, 14
    );

    // National Theatre — circular base + drum
    // Position from Landmarks._buildNationalTheatre()
    this._addCylinder(
      cityOffsetX - 120, 3,
      cityOffsetZ - 20,
      30, 6
    );
    this._addCylinder(
      cityOffsetX - 120, 16,
      cityOffsetZ - 20,
      18, 20
    );

    // Lekki Bridge — deck collider
    // Position + rotation from
    // Landmarks._buildLekkiBridge()
    // Bridge is rotated PI/2 so length is along Z
    this._addBox(
      cityOffsetX + 20, 14,
      cityOffsetZ + 200,
      7, 0.6, 100
    );
  }

  // ── World boundary walls ──────────────────
  // Invisible walls at map edges so player
  // cannot fall off the world
  buildWorldBoundaries(mapRadius = 250) {
    const wallH = 50;
    const wallT = 2;
    const r     = mapRadius;
    // North wall
    this._addBox(0, wallH / 2, -r,
      r + wallT, wallH / 2, wallT);
    // South wall
    this._addBox(0, wallH / 2, r,
      r + wallT, wallH / 2, wallT);
    // East wall
    this._addBox(r, wallH / 2, 0,
      wallT, wallH / 2, r + wallT);
    // West wall
    this._addBox(-r, wallH / 2, 0,
      wallT, wallH / 2, r + wallT);
  }

  // ── Remove all colliders ──────────────────
  dispose() {
    this._bodies.forEach(b =>
      this._world.removeBody(b)
    );
    this._bodies = [];
  }
}
