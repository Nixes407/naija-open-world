/**
 * InputManager.js
 * ---------------------------------------------------------------------------
 * All player input in one place: keyboard (WASD + arrows, Shift, Space,
 * hotkeys) and mouse look.
 *
 * Mouse look works two ways so it is never broken:
 *   1. Pointer Lock - click the world and the cursor is captured (Chrome,
 *      Firefox, Safari). Best feel, unlimited rotation.
 *   2. Click-and-drag fallback - if pointer lock is unavailable (embedded
 *      iframes, some mobile browsers, permission denials) dragging the mouse
 *      still rotates the camera.
 * Arrow keys / Q & E also rotate the camera for keyboard-only play.
 */

const MOVE_KEYS = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

const PREVENT_DEFAULT = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyT', 'KeyR', 'KeyQ', 'KeyE',
]);

export class InputManager {
  /**
   * @param {HTMLElement} target element that receives pointer input (the canvas)
   * @param {object} [options]
   * @param {number} [options.sensitivity=0.0022] radians per pixel of mouse movement
   */
  constructor(target, { sensitivity = 0.0022 } = {}) {
    this.target = target;
    this.sensitivity = sensitivity;

    /** @type {Set<string>} currently held key codes */
    this.keysDown = new Set();
    /** @type {Set<string>} keys pressed during the current frame */
    this.justPressed = new Set();

    /** Mouse look delta accumulated since the last consumeMouseDelta(). */
    this.mouseDelta = { x: 0, y: 0 };
    /** Mouse wheel delta accumulated since the last endFrame(). */
    this.wheelDelta = 0;

    this.pointerLocked = false;
    this.dragging = false;
    /** True once the player has interacted at all (used to hide the overlay). */
    this.hasInteracted = false;

    this._listeners = [];
    this._moveVector = { x: 0, z: 0 };
    this._lookDelta = { yaw: 0, pitch: 0 };
    this._bind();
  }

  /* ------------------------------------------------------------------------ */
  /* Binding                                                                   */
  /* ------------------------------------------------------------------------ */

  _on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this._listeners.push([target, type, handler, options]);
  }

  _bind() {
    const canvas = this.target;
    const doc = canvas.ownerDocument ?? document;

    this._on(window, 'keydown', (event) => {
      if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
      if (event.repeat) return;
      this.keysDown.add(event.code);
      this.justPressed.add(event.code);
      this.hasInteracted = true;
    });

    this._on(window, 'keyup', (event) => {
      this.keysDown.delete(event.code);
    });

    // Held keys must not stick when focus is lost (alt-tab, devtools, ...).
    this._on(window, 'blur', () => {
      this.keysDown.clear();
      this.dragging = false;
    });

    /* ------------------------------- Mouse look ------------------------------ */

    this._lastClient = { x: 0, y: 0 };

    this._on(canvas, 'pointerdown', (event) => {
      this.hasInteracted = true;
      if (event.button !== 0) return;
      this.dragging = true;
      this.requestPointerLock();
    });

    this._on(window, 'pointerup', () => {
      this.dragging = false;
    });

    this._on(window, 'mousemove', (event) => {
      // movementX/Y is only populated while pointer-locked, so fall back to the
      // raw client delta whenever it is missing or zero (some browsers, and the
      // click-and-drag fallback path).
      const clientDx = this._lastClient.x - event.clientX;
      const clientDy = this._lastClient.y - event.clientY;
      const useLock = this.pointerLocked && (event.movementX || event.movementY);

      if (useLock) {
        this.mouseDelta.x += event.movementX;
        this.mouseDelta.y += event.movementY;
      } else if (this.dragging) {
        this.mouseDelta.x += event.movementX || clientDx;
        this.mouseDelta.y += event.movementY || clientDy;
      }

      this._lastClient.x = event.clientX;
      this._lastClient.y = event.clientY;
    });

    this._on(canvas, 'wheel', (event) => {
      event.preventDefault();
      this.wheelDelta += event.deltaY;
    }, { passive: false });

    // Touch: one finger drags the camera (movement is keyboard-only for now).
    this._on(canvas, 'touchstart', (event) => {
      this.hasInteracted = true;
      this.dragging = true;
      const touch = event.touches[0];
      this._lastClient.x = touch.clientX;
      this._lastClient.y = touch.clientY;
    }, { passive: true });

    this._on(canvas, 'touchmove', (event) => {
      const touch = event.touches[0];
      this.mouseDelta.x += this._lastClient.x - touch.clientX;
      this.mouseDelta.y += this._lastClient.y - touch.clientY;
      this._lastClient.x = touch.clientX;
      this._lastClient.y = touch.clientY;
    }, { passive: true });

    this._on(canvas, 'touchend', () => {
      this.dragging = false;
    }, { passive: true });

    /* ------------------------------ Pointer lock ----------------------------- */
    this._on(doc, 'pointerlockchange', () => {
      this.pointerLocked = (doc.pointerLockElement ?? null) === canvas;
      if (!this.pointerLocked) this.dragging = false;
    });

    this._on(doc, 'pointerlockerror', () => {
      // Embedded/denied pointer lock: silently stay on the drag fallback.
      this.pointerLocked = false;
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Pointer lock                                                              */
  /* ------------------------------------------------------------------------ */

  /** Request pointer lock, swallowing the browser's security errors. */
  requestPointerLock() {
    if (this.pointerLocked) return;
    const canvas = this.target;
    try {
      const result = canvas.requestPointerLock?.({ unadjustedMovement: false });
      // Chrome returns a promise; a rejection just means we keep drag-look.
      if (result && typeof result.catch === 'function') {
        result.catch(() => {
          this.pointerLocked = false;
        });
      }
    } catch (error) {
      this.pointerLocked = false;
    }
  }

  exitPointerLock() {
    const doc = this.target.ownerDocument ?? document;
    if (doc.pointerLockElement) doc.exitPointerLock?.();
  }

  /* ------------------------------------------------------------------------ */
  /* Queries                                                                   */
  /* ------------------------------------------------------------------------ */

  isDown(code) {
    return this.keysDown.has(code);
  }

  /** True only on the frame the key went down. */
  wasPressed(code) {
    return this.justPressed.has(code);
  }

  /**
   * Movement intent in camera-local space. The returned object is reused
   * between calls to keep the render loop allocation-free.
   * @returns {{x: number, z: number}} x = strafe right, z = backwards
   */
  getMoveVector() {
    let x = 0;
    let z = 0;
    for (const code of this.keysDown) {
      switch (MOVE_KEYS[code]) {
        case 'forward': z -= 1; break;
        case 'back': z += 1; break;
        case 'left': x -= 1; break;
        case 'right': x += 1; break;
        default: break;
      }
    }
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    this._moveVector.x = x;
    this._moveVector.z = z;
    return this._moveVector;
  }

  /** Keyboard camera rotation (arrow keys are movement, so Q/E turn). */
  getLookAxis() {
    let x = 0;
    if (this.isDown('KeyQ')) x -= 1;
    if (this.isDown('KeyE')) x += 1;
    return x;
  }

  get sprinting() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }

  get wantsJump() {
    return this.isDown('Space') || this.isDown('KeyJ');
  }

  /**
   * Mouse look delta in radians, and resets the accumulator. The returned
   * object is reused between calls.
   */
  consumeLookDelta() {
    this._lookDelta.yaw = -this.mouseDelta.x * this.sensitivity;
    this._lookDelta.pitch = -this.mouseDelta.y * this.sensitivity;
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return this._lookDelta;
  }

  consumeWheel() {
    const delta = this.wheelDelta;
    this.wheelDelta = 0;
    return delta;
  }

  /** Call once at the end of every frame. */
  endFrame() {
    this.justPressed.clear();
  }

  dispose() {
    for (const [target, type, handler, options] of this._listeners) {
      target.removeEventListener(type, handler, options);
    }
    this._listeners.length = 0;
    this.keysDown.clear();
    this.justPressed.clear();
  }
}
