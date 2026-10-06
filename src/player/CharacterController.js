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
   * @param {import('../ui/MobileControls.js').default} [options.mobileControls]
   *   touch controls; when omitted (or inactive) the keyboard/mouse input wins
   */
  constructor({ renderer, input, mobileControls = null }) {
    this.renderer = renderer;
    this.input = input;
    this.scene = renderer.scene;
    this._mobile = mobileControls;

    // Proximity context detection
    this._lastContext = 'default';
    // No vehicles exist yet, so nothing flips this to true during play.
    // VehicleSystem will own it in a later sprint; until then it is a stub
    // that can be driven directly (see setInVehicle below).
    this._inVehicle = false;

    /* ---------------------------------------------------------------------- */
    /* Visual: humanoid figure (head / torso / arms / legs)                    */
    /* ---------------------------------------------------------------------- */
    // Only the *visual* changed here: the old danfo-yellow capsule blob
    // (createCapsuleGeometry) is replaced by a recognisable human figure built
    // from primitives. The CANNON physics body further down is untouched, and
    // the figure keeps the same "feet origin" convention as the capsule did, so
    // every position/rotation line in _updateMovement still works unchanged on
    // the Group.
    this.mesh = this._buildHumanoidMesh();
    this.mesh.name = 'Player';

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
    // Mobile input override: read the touch state once per frame. This also
    // consumes the joystick/look accumulators, so it must happen exactly once
    // per frame (see MobileControls.getMobileInput).
    let mobileInput = null;
    if (this._mobile && this._mobile.isActive()) {
      mobileInput = this._mobile.getMobileInput();
    }

    this._updateLook(dt, mobileInput);
    this._updateMovement(dt, env, mobileInput);
    this._updateCamera(dt);

    this._updateMobileContext();

    this._animateWalk();
  }

  _updateLook(dt, mobileInput = null) {
    const mouse = this.input.consumeLookDelta();
    const keyboardYaw = this.input.getLookAxis() * 1.8 * dt; // Q / E

    this.yaw += mouse.yaw + keyboardYaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch + mouse.pitch, this.minPitch, this.maxPitch);

    // Touch look (right-hand drag zone). Same sign convention as the mouse
    // above: dragging right / down turns the camera the same way it does with
    // pointer lock. MobileControls already scales the deltas.
    if (mobileInput) {
      this.yaw -= mobileInput.lookDeltaX;
      this.pitch = THREE.MathUtils.clamp(
        this.pitch - mobileInput.lookDeltaY,
        this.minPitch,
        this.maxPitch,
      );
    }

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

  _updateMovement(dt, env, mobileInput = null) {
    const body = this.body;

    // Input source: the touch controls when they are live, keyboard/mouse
    // otherwise. Only the *reading* differs - every line of physics below
    // (velocity blending, MAX_GROUND_SPEED clamp, jump latch, mesh sync) is
    // shared, so touch and keyboard produce exactly the same motion.
    let move;
    let sprinting;
    let jumpPressed;

    if (mobileInput) {
      // Joystick: moveY is negative pushing forward (up the screen) and moveX
      // is positive strafing right, which is the same convention
      // InputManager.getMoveVector() uses for WASD.
      move = { x: mobileInput.moveX, z: mobileInput.moveY };
      sprinting = mobileInput.sprint;
      jumpPressed = mobileInput.jump;
    } else {
      move = this.input.getMoveVector();
      sprinting = this.input.sprinting;
      jumpPressed = this.input.wantsJump;
    }

    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

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
    const wantsJump = jumpPressed && !this._jumpLatch;
    if (wantsJump && this.groundContact) {
      body.velocity.y = JUMP_SPEED;
      this._jumpLatch = true;
    } else if (!jumpPressed) {
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

  _updateMobileContext() {
    if (!this._mobile || !this._mobile.isActive()) return;

    // Default context unless something is nearby
    let context = 'default';

    // We will do real proximity checks in a later sprint when NPCs and
    // vehicles exist. For now: detect if player is "driving" by checking
    // if a vehicle body is active.
    if (this._inVehicle) {
      context = 'driving';
    }

    // Only call setContext if context changed (avoids triggering the fade
    // animation every frame).
    if (context !== this._lastContext) {
      this._lastContext = context;
      this._mobile.setContext(context);
    }
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
  /* Humanoid visual                                                           */
  /* ------------------------------------------------------------------------ */

  _buildHumanoidMesh() {
    const group = new THREE.Group();

    // ── Skin and clothing colors ──
    const skinMat = new THREE.MeshLambertMaterial({
      color: '#8D5524', // Nigerian skin tone
    });
    const shirtMat = new THREE.MeshLambertMaterial({
      color: '#FFD700', // Danfo yellow shirt
    });
    const trouserMat = new THREE.MeshLambertMaterial({
      color: '#1a1a2e', // Dark trousers
    });
    const shoeMat = new THREE.MeshLambertMaterial({
      color: '#2C1810', // Dark shoes
    });

    // ── Head ──
    const headGeo = new THREE.SphereGeometry(
      0.18, 12, 10
    );
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.65;
    head.castShadow = true;
    group.add(head);

    // ── Neck ──
    const neckGeo = new THREE.CylinderGeometry(
      0.07, 0.08, 0.12, 8
    );
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.49;
    group.add(neck);

    // ── Torso ──
    const torsoGeo = new THREE.BoxGeometry(
      0.38, 0.5, 0.22
    );
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.18;
    torso.castShadow = true;
    group.add(torso);

    // ── Hips ──
    const hipGeo = new THREE.BoxGeometry(
      0.34, 0.18, 0.20
    );
    const hip = new THREE.Mesh(hipGeo, trouserMat);
    hip.position.y = 0.90;
    group.add(hip);

    // ── Left Arm ──
    const upperArmGeo = new THREE.CylinderGeometry(
      0.06, 0.055, 0.28, 8
    );
    const lUpperArm = new THREE.Mesh(
      upperArmGeo, shirtMat
    );
    lUpperArm.position.set(-0.25, 1.15, 0);
    lUpperArm.rotation.z = 0.25;
    group.add(lUpperArm);

    const forearmGeo = new THREE.CylinderGeometry(
      0.05, 0.045, 0.26, 8
    );
    const lForearm = new THREE.Mesh(
      forearmGeo, skinMat
    );
    lForearm.position.set(-0.31, 0.88, 0);
    lForearm.rotation.z = 0.15;
    group.add(lForearm);

    // ── Right Arm ──
    const rUpperArm = new THREE.Mesh(
      upperArmGeo, shirtMat
    );
    rUpperArm.position.set(0.25, 1.15, 0);
    rUpperArm.rotation.z = -0.25;
    group.add(rUpperArm);

    const rForearm = new THREE.Mesh(
      forearmGeo, skinMat
    );
    rForearm.position.set(0.31, 0.88, 0);
    rForearm.rotation.z = -0.15;
    group.add(rForearm);

    // ── Left Leg ──
    const thighGeo = new THREE.CylinderGeometry(
      0.08, 0.07, 0.32, 8
    );
    const lThigh = new THREE.Mesh(
      thighGeo, trouserMat
    );
    lThigh.position.set(-0.10, 0.65, 0);
    group.add(lThigh);

    const shinGeo = new THREE.CylinderGeometry(
      0.06, 0.05, 0.30, 8
    );
    const lShin = new THREE.Mesh(
      shinGeo, trouserMat
    );
    lShin.position.set(-0.10, 0.34, 0);
    group.add(lShin);

    // Left shoe
    const shoeGeo = new THREE.BoxGeometry(
      0.1, 0.07, 0.18
    );
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(-0.10, 0.185, 0.03);
    group.add(lShoe);

    // ── Right Leg ──
    const rThigh = new THREE.Mesh(
      thighGeo, trouserMat
    );
    rThigh.position.set(0.10, 0.65, 0);
    group.add(rThigh);

    const rShin = new THREE.Mesh(
      shinGeo, trouserMat
    );
    rShin.position.set(0.10, 0.34, 0);
    group.add(rShin);

    // Right shoe
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0.10, 0.185, 0.03);
    group.add(rShoe);

    // ── Store references for walk animation ──
    group.userData.lUpperArm = lUpperArm;
    group.userData.rUpperArm = rUpperArm;
    group.userData.lThigh    = lThigh;
    group.userData.rThigh    = rThigh;
    group.userData.lShin     = lShin;
    group.userData.rShin     = rShin;

    // Scale group so figure height matches
    // the 2.0m physics capsule exactly.
    // Current measured height: 1.83m (top of head)
    // with feet at 0.15m — net figure = 1.68m.
    // We need 2.0m total, feet at y=0.
    const currentHeight = 1.68;
    const targetHeight  = 2.0;
    const scaleFactor   = targetHeight / currentHeight;

    // Step 1: shift the figure down so the feet touch y=0.
    // Step 2: scale up to fill the 2.0m capsule.
    //
    // Both live on an INNER group, not on `group` itself: _updateMovement()
    // rewrites this.mesh.position every frame (and the constructor copies the
    // rig position into it), so an offset stored on the outer group would be
    // clobbered before the first render and the feet would float again.
    // The offset is -0.15 * scaleFactor because the shift is applied after the
    // scale, which lifts the feet by the same factor.
    const figure = new THREE.Group();
    while (group.children.length > 0) {
      figure.add(group.children[0]);
    }
    figure.position.y = -0.15 * scaleFactor;
    figure.scale.setScalar(scaleFactor);
    group.add(figure);

    // Enable shadows on every mesh in the group
    group.traverse(child => {
      if (child.isMesh) {
        child.castShadow    = true;
        child.receiveShadow = false;
      }
    });

    return group;
  }

  /**
   * Swing the limbs while the player moves, relax to a neutral pose when idle.
   * Reads the horizontal speed straight off the CANNON body (`this.body` -
   * note: not `_body`), so keyboard and touch input animate identically.
   */
  _animateWalk() {
    if (!this.mesh) return;
    const ud = this.mesh.userData;
    if (!ud.lThigh) return;

    // Check if player is moving
    const vel = this.body
      ? this.body.velocity
      : null;
    const speed = vel
      ? Math.sqrt(
          vel.x * vel.x + vel.z * vel.z
        )
      : 0;

    if (speed > 0.5) {
      // Walking animation — swing limbs
      const t   = performance.now() * 0.006;
      const sw  = Math.sin(t) * 0.4;
      const sw2 = Math.sin(t + Math.PI) * 0.4;

      if (ud.lThigh) ud.lThigh.rotation.x =  sw;
      if (ud.rThigh) ud.rThigh.rotation.x =  sw2;
      if (ud.lShin)  ud.lShin.rotation.x  =
        Math.max(0, -sw) * 0.5;
      if (ud.rShin)  ud.rShin.rotation.x  =
        Math.max(0, -sw2) * 0.5;
      if (ud.lUpperArm) ud.lUpperArm.rotation.x = sw2 * 0.6;
      if (ud.rUpperArm) ud.rUpperArm.rotation.x = sw  * 0.6;
    } else {
      // Idle — reset to neutral pose
      ['lThigh','rThigh','lShin','rShin',
       'lUpperArm','rUpperArm'].forEach(k => {
        if (ud[k]) ud[k].rotation.x = 0;
      });
    }
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

  /**
   * Marks the player as driving / on foot. This is what drives the mobile
   * button context ('driving' vs 'default'); the future VehicleSystem is
   * expected to call it on enter/exit. Reachable from the console too:
   *   Naija.player.setInVehicle(true)
   * No-op for the context until a context actually exists (i.e. no
   * behaviour change on desktop).
   */
  setInVehicle(flag) {
    this._inVehicle = Boolean(flag);
  }

  get inVehicle() {
    return this._inVehicle;
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
