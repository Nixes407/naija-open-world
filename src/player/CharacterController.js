import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DANFO_YELLOW, WORLD_SIZE } from '../core/Renderer.js';

/**
 * CharacterController.js
 * ---------------------------------------------------------------------------
 * The player: a yellow (danfo) capsule that walks around Lagos with WASD while
 * a third-person camera orbits behind and above it.
 *
 * The capsule is a real `cannon-es` rigid body (Sprint 1's physics stack), so
 * gravity, jumping, collisions and the 500m x 500m world bounds come from the
 * simulation instead of being faked in the update loop.
 *
 * Geometry conventions (kept identical for physics and visuals):
 *   - the physics body is a capsule = two spheres of PLAYER_RADIUS offset
 *     +/-PLAYER_HALF_HEIGHT along local Y;
 *   - the body centre therefore sits CENTER_HEIGHT = radius + halfHeight above
 *     the ground when standing, and the capsule is exactly 2 * CENTER_HEIGHT tall;
 *   - the visual mesh and the camera rig both use that same "feet origin"
 *     (origin on the ground, capsule growing upwards), so there is a single
 *     offset constant to reason about.
 */

/** Capsule radius (m). */
const PLAYER_RADIUS = 0.45;
/** Distance from the capsule centre to each cap centre (m). */
const PLAYER_HALF_HEIGHT = 0.55;
/** Feet -> capsule centre (m). */
const CENTER_HEIGHT = PLAYER_RADIUS + PLAYER_HALF_HEIGHT;
/** Capsule height in metres (2.0). */
const PLAYER_HEIGHT = CENTER_HEIGHT * 2;

const WALK_SPEED = 6.2; // m/s (~22 km/h, brisk Lagos stroll)
const SPRINT_SPEED = 11.5; // m/s
const JUMP_SPEED = 6.4; // m/s  => ~1.0m jump under 20 m/s^2 gravity
const MAX_GROUND_SPEED = 14;

export class CharacterController {
  /**
   * @param {object} options
   * @param {import('../core/Renderer.js').Renderer} options.renderer
   * @param {import('../core/InputManager.js').InputManager} options.input
   */
  constructor({ renderer, input }) {
    this.renderer = renderer;
    this.input = input;
    this.scene = renderer.scene;

    /* ---------------------------------------------------------------------- */
    /* Visual: danfo-yellow capsule                                            */
    /* ---------------------------------------------------------------------- */
    const material = new THREE.MeshStandardMaterial({
      color: DANFO_YELLOW,
      roughness: 0.42,
      metalness: 0.08,
      emissive: 0x2a1f00,
      emissiveIntensity: 0.35,
    });

    this.mesh = new THREE.Mesh(createCapsuleGeometry(PLAYER_RADIUS, PLAYER_HALF_HEIGHT * 2), material);
    this.mesh.name = 'Player';
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Nose: shows which way the character faces (local -Z is "forward").
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0 }),
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, CENTER_HEIGHT + 0.15, -PLAYER_RADIUS - 0.1);
    nose.castShadow = true;
    this.mesh.add(nose);
    this.nose = nose;

    // Dark outline: keeps the bright danfo yellow readable against the soil in
    // full daylight (a light-coloured character on light ground otherwise
    // melts into the background).
    const outline = new THREE.Mesh(
      this.mesh.geometry,
      new THREE.MeshBasicMaterial({ color: 0x1b1206, side: THREE.BackSide }),
    );
    outline.scale.setScalar(1.045);
    this.mesh.add(outline);
    this.outline = outline;

    // Contact patch on the ground: reads as weight and confirms the height math.
    const contact = new THREE.Mesh(
      new THREE.RingGeometry(PLAYER_RADIUS * 0.7, PLAYER_RADIUS * 1.1, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    this.mesh.add(contact);

    this.scene.add(this.mesh);

    /* ---------------------------------------------------------------------- */
    /* Physics world                                                           */
    /* ---------------------------------------------------------------------- */
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = false;
    this.world.defaultContactMaterial.friction = 0.12;
    this.world.defaultContactMaterial.restitution = 0;
    this.world.solver.iterations = 12;

    const groundMaterial = new CANNON.Material('ground');
    this.playerMaterial = new CANNON.Material('player');
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(groundMaterial, this.playerMaterial, {
        friction: 0.05,
        restitution: 0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
      }),
    );

    // Static ground: an infinite plane at y = 0 (matches the visual plane).
    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: groundMaterial });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    // Player: capsule = two spheres offset along the local Y axis. (Only these
    // two shapes - a third sphere at the centre would make the ground probe
    // below hit the player itself.)
    this.body = new CANNON.Body({
      mass: 78,
      material: this.playerMaterial,
      angularDamping: 1, // no rag-dolling for now
      linearDamping: 0.02,
      fixedRotation: true,
    });
    this.body.addShape(new CANNON.Sphere(PLAYER_RADIUS), new CANNON.Vec3(0, +PLAYER_HALF_HEIGHT, 0));
    this.body.addShape(new CANNON.Sphere(PLAYER_RADIUS), new CANNON.Vec3(0, -PLAYER_HALF_HEIGHT, 0));
    this.body.updateMassProperties();
    this.body.position.set(0, CENTER_HEIGHT + 0.05, 0);
    this.world.addBody(this.body);

    // World bounds: invisible walls at the edge of the 500m x 500m plane.
    this._addBoundaryWalls();

    this.groundContact = true; // optimistic on the first frame
    this._jumpLatch = false;
    /** Surface normal under the player (stays +Y until slopes exist). */
    this.groundNormal = new CANNON.Vec3(0, 1, 0);
    this._tmpNormal = new CANNON.Vec3();

    /* ---------------------------------------------------------------------- */
    /* Third-person camera rig                                                 */
    /* ---------------------------------------------------------------------- */
    this.rig = new THREE.Group();
    this.rig.name = 'CameraRig';
    this.pivot = new THREE.Object3D(); // what the camera orbits: the capsule centre
    this.pivot.position.y = CENTER_HEIGHT;
    this.rig.add(this.pivot);
    this.scene.add(this.rig);

    this.yaw = 0; // 0 => looking towards -Z
    this.pitch = -0.26; // slight downward tilt: camera sits above the player
    this.minPitch = -1.15; // looking down
    this.maxPitch = 0.62; // looking up

    this.cameraDistance = 7.2;
    this.minDistance = 3.2;
    this.maxDistance = 16;

    this._desiredCamera = new THREE.Vector3();
    this._smoothedCamera = new THREE.Vector3();
    this._lookAt = new THREE.Vector3();
    this._smoothedLookAt = new THREE.Vector3();
    this._moveDirection = new THREE.Vector3();
    this._cameraForward = new THREE.Vector3();
    this._cameraRight = new THREE.Vector3();

    this._firstFrame = true;
    this.speed = 0;

    this.rig.position.set(this.body.position.x, this.body.position.y - CENTER_HEIGHT, this.body.position.z);
    this.mesh.position.copy(this.rig.position);
  }

  /* ------------------------------------------------------------------------ */
  /* Setup helpers                                                             */
  /* ------------------------------------------------------------------------ */

  _addBoundaryWalls() {
    const limit = WORLD_SIZE / 2;
    const thickness = 2;
    const height = 12;
    const wallShape = new CANNON.Box(new CANNON.Vec3(limit + thickness, height, thickness));

    const walls = [
      [0, -limit, 0], // north (+Z side of the wall faces the playfield)
      [0, limit, Math.PI], // south
      [-limit, 0, Math.PI / 2], // west
      [limit, 0, -Math.PI / 2], // east
    ];

    this._wallBodies = [];
    for (const [x, z, rotationY] of walls) {
      const body = new CANNON.Body({ mass: 0, shape: wallShape });
      body.position.set(x, height / 2, z);
      body.quaternion.setFromEuler(0, rotationY, 0);
      this.world.addBody(body);
      this._wallBodies.push(body);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Frame update                                                              */
  /* ------------------------------------------------------------------------ */

  /**
   * @param {number} dt seconds since the previous frame
   * @param {object} [env] environment snapshot from the TimeSystem (sprint hook)
   */
  update(dt, env) {
    this._updateLook(dt);
    this._updateMovement(dt, env);
    this._updateCamera(dt);
  }

  _updateLook(dt) {
    const mouse = this.input.consumeLookDelta();
    const keyboardYaw = this.input.getLookAxis() * 1.8 * dt; // Q / E

    this.yaw += mouse.yaw + keyboardYaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch + mouse.pitch, this.minPitch, this.maxPitch);

    // Wheel zooms the third-person camera.
    const wheel = this.input.consumeWheel();
    if (wheel !== 0) {
      this.cameraDistance = THREE.MathUtils.clamp(
        this.cameraDistance + wheel * 0.01,
        this.minDistance,
        this.maxDistance,
      );
    }
  }

  _updateMovement(dt) {
    const body = this.body;
    const move = this.input.getMoveVector();
    const speed = this.input.sprinting ? SPRINT_SPEED : WALK_SPEED;

    // Camera-relative movement on the ground plane.
    this._cameraForward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._cameraRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    this._moveDirection
      .set(0, 0, 0)
      .addScaledVector(this._cameraForward, -move.z)
      .addScaledVector(this._cameraRight, move.x);

    const moving = this._moveDirection.lengthSq() > 1e-6;
    if (moving) this._moveDirection.normalize();

    // `groundContact` comes from the previous physics step (see
    // _updateGroundContact) - one frame of latency, which is imperceptible and
    // keeps jumping responsive because the impulse is applied before the step.
    const wantsJump = this.input.wantsJump && !this._jumpLatch;
    if (wantsJump && this.groundContact) {
      body.velocity.y = JUMP_SPEED;
      this._jumpLatch = true;
    } else if (!this.input.wantsJump) {
      this._jumpLatch = false;
    }

    // Horizontal velocity is driven directly: crisp, frame-rate independent
    // control, while cannon-es still resolves gravity and collisions.
    const targetVx = this._moveDirection.x * speed;
    const targetVz = this._moveDirection.z * speed;
    const blend = moving ? (this.groundContact ? 1 : 0.06) : this.groundContact ? 0.85 : 0.02;

    body.velocity.x = THREE.MathUtils.lerp(body.velocity.x, targetVx, blend);
    body.velocity.z = THREE.MathUtils.lerp(body.velocity.z, targetVz, blend);

    const horizontal = Math.hypot(body.velocity.x, body.velocity.z);
    if (horizontal > MAX_GROUND_SPEED) {
      const clamp = MAX_GROUND_SPEED / horizontal;
      body.velocity.x *= clamp;
      body.velocity.z *= clamp;
    }

    // Fixed 1/60s physics timestep, at most 3 substeps per frame.
    this.world.step(1 / 60, dt, 3);

    this.speed = Math.hypot(body.velocity.x, body.velocity.z);
    this._updateGroundContact();

    // Safety net: if the capsule ever escapes the world, put it back.
    if (!Number.isFinite(body.position.y) || body.position.y < -25) {
      this.respawn();
    }

    /* --------------------------- Sync visual mesh --------------------------- */
    this.mesh.position.set(body.position.x, body.position.y - CENTER_HEIGHT, body.position.z);

    // Face the direction of travel, turning smoothly.
    if (moving) {
      const desiredYaw = Math.atan2(-this._moveDirection.x, -this._moveDirection.z);
      const delta = shortestAngle(this.mesh.rotation.y, desiredYaw);
      this.mesh.rotation.y += delta * Math.min(1, 12 * dt);
    }

    // Small lean while airborne so jumps read visually.
    this.mesh.rotation.x = this.groundContact ? 0 : THREE.MathUtils.clamp(body.velocity.y * 0.01, -0.1, 0.1);
  }

  /**
   * Ground check from the physics solver's own contact list.
   *
   * (A downward raycast from the capsule centre does NOT work here: the first
   * thing it hits is the player's own bottom cap, 0.1m below the centre. Contact
   * normals are both cheaper and exactly right, and they give us the surface
   * angle so slopes can be handled in a later sprint.)
   */
  _updateGroundContact() {
    const contacts = this.world.contacts;
    let grounded = false;

    for (let i = 0; i < contacts.length; i += 1) {
      const contact = contacts[i];
      const playerIsBi = contact.bi === this.body;
      if (!playerIsBi && contact.bj !== this.body) continue;

      // `contact.ni` points from bi towards bj, so flip it when the player is
      // bj: `away` then always points from the player out towards the other
      // body. Standing on the ground makes it point straight down.
      const away = playerIsBi ? contact.ni : this._tmpNormal.copy(contact.ni).negate();
      if (away.y < -0.5) {
        grounded = true;
        this.groundNormal.set(-away.x, -away.y, -away.z); // surface normal
        break;
      }
    }

    this.groundContact = grounded;
    if (!grounded) this.groundNormal.set(0, 1, 0);
  }

  _updateCamera(dt) {
    // Move / rotate the rig with the player (rig origin = the player's feet).
    this.rig.position.set(this.body.position.x, this.body.position.y - CENTER_HEIGHT, this.body.position.z);
    this.rig.rotation.y = this.yaw;
    this.rig.updateMatrixWorld(true);

    // Third-person framing: behind (+Z on the rig) and above the pivot.
    this._desiredCamera.set(
      0,
      this.cameraDistance * Math.sin(-this.pitch),
      this.cameraDistance * Math.cos(this.pitch),
    );
    this.pivot.localToWorld(this._desiredCamera);

    // Never let the ground clip into view (flat world today, cheap safety net).
    if (this._desiredCamera.y < 0.8) this._desiredCamera.y = 0.8;

    // Aim slightly above the capsule centre so the player sits nicely in frame.
    this._lookAt.set(this.body.position.x, this.body.position.y + 0.15, this.body.position.z);

    if (this._firstFrame) {
      this._smoothedCamera.copy(this._desiredCamera);
      this._smoothedLookAt.copy(this._lookAt);
      this._firstFrame = false;
    } else {
      const follow = 1 - Math.exp(-10 * dt);
      this._smoothedCamera.lerp(this._desiredCamera, follow);
      this._smoothedLookAt.lerp(this._lookAt, follow);
    }

    const camera = this.renderer.camera;
    camera.position.copy(this._smoothedCamera);
    camera.lookAt(this._smoothedLookAt);
  }

  /* ------------------------------------------------------------------------ */
  /* Public helpers                                                            */
  /* ------------------------------------------------------------------------ */

  respawn(x = 0, z = 0) {
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.force.set(0, 0, 0);
    this.body.position.set(x, CENTER_HEIGHT + 0.05, z);
    this._firstFrame = true;
  }

  get position() {
    return this.body.position;
  }

  get isGrounded() {
    return this.groundContact;
  }

  get height() {
    return PLAYER_HEIGHT;
  }

  /** Rough horizontal speed in m/s (used by the HUD in later sprints). */
  get horizontalSpeed() {
    return this.speed;
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Y-up capsule (cylinder + two hemispheres) with its origin at the FEET, i.e.
 * the geometry spans y = 0 .. 2 * radius + cylinderHeight. Matches the two
 * sphere shapes used by the physics body exactly.
 */
function createCapsuleGeometry(radius, cylinderHeight, radialSegments = 20, capSegments = 6) {
  const capTop = radius + cylinderHeight; // centre of the top hemisphere
  const totalHeight = cylinderHeight + radius * 2;
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const ringStride = radialSegments + 1;

  const addVertex = (x, y, z, nx, ny, nz, u, v) => {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    uvs.push(u, v);
  };

  // --- cylinder wall (between the two cap centres) ---
  for (const y of [radius, capTop]) {
    for (let i = 0; i <= radialSegments; i += 1) {
      const u = i / radialSegments;
      const theta = u * Math.PI * 2;
      const nx = Math.sin(theta);
      const nz = Math.cos(theta);
      addVertex(nx * radius, y, nz * radius, nx, 0, nz, u, y / totalHeight);
    }
  }
  for (let i = 0; i < radialSegments; i += 1) {
    const a = i;
    const b = i + 1;
    const c = ringStride + i;
    const d = ringStride + i + 1;
    indices.push(a, b, c, b, d, c); // counter-clockwise seen from outside
  }

  // --- top hemisphere (capTop -> capTop + radius) ---
  const topStart = positions.length / 3;
  for (let lat = 0; lat <= capSegments; lat += 1) {
    const phi = (lat / capSegments) * (Math.PI / 2);
    const y = capTop + Math.sin(phi) * radius;
    const r = Math.cos(phi);
    for (let i = 0; i <= radialSegments; i += 1) {
      const theta = (i / radialSegments) * Math.PI * 2;
      addVertex(Math.sin(theta) * r * radius, y, Math.cos(theta) * r * radius, Math.sin(theta) * r, Math.sin(phi), Math.cos(theta) * r, i / radialSegments, y / totalHeight);
    }
  }
  for (let lat = 0; lat < capSegments; lat += 1) {
    for (let i = 0; i < radialSegments; i += 1) {
      const a = topStart + lat * ringStride + i;
      indices.push(a, a + 1, a + ringStride, a + 1, a + ringStride + 1, a + ringStride);
    }
  }

  // --- bottom hemisphere (radius -> 0), wound the other way ---
  const bottomStart = positions.length / 3;
  for (let lat = 0; lat <= capSegments; lat += 1) {
    const phi = (lat / capSegments) * (Math.PI / 2);
    const y = radius - Math.sin(phi) * radius;
    const r = Math.cos(phi);
    for (let i = 0; i <= radialSegments; i += 1) {
      const theta = (i / radialSegments) * Math.PI * 2;
      addVertex(Math.sin(theta) * r * radius, y, Math.cos(theta) * r * radius, Math.sin(theta) * r, -Math.sin(phi), Math.cos(theta) * r, i / radialSegments, y / totalHeight);
    }
  }
  for (let lat = 0; lat < capSegments; lat += 1) {
    for (let i = 0; i < radialSegments; i += 1) {
      const a = bottomStart + lat * ringStride + i;
      // This hemisphere's rings run downwards, so the winding is mirrored.
      indices.push(a, a + ringStride, a + 1, a + 1, a + ringStride, a + ringStride + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** Signed shortest angular distance from `from` to `to` (radians). */
function shortestAngle(from, to) {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}
