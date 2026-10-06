export default class MobileControls {
  constructor() {
    this.active = 'ontouchstart' in window ||
                  navigator.maxTouchPoints > 0;

    // Internal state
    this._moveX   = 0;
    this._moveY   = 0;
    this._lookDX  = 0;
    this._lookDY  = 0;
    this._jump    = false;
    this._sprint  = false;
    this._interact = false;
    this._context = 'default';

    // Touch tracking
    this._joystickTouchId = null;
    this._lookTouchId     = null;
    this._lookLastX       = 0;
    this._lookLastY       = 0;

    if (!this.active) return;
    this._buildUI();
    this._attachEvents();
  }

  // ── Build joystick UI ──────────────────────────
  _buildUI() {
    // Root overlay (covers full screen,
    // pointer-events:none so Three.js still
    // receives events in the middle)
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position:      'fixed',
      top:           '0',
      left:          '0',
      width:         '100%',
      height:        '100%',
      pointerEvents: 'none',
      zIndex:        '1000',
      userSelect:    'none',
    });
    document.body.appendChild(this.root);

    // ── Left joystick ──
    this.joystickOuter = document.createElement('div');
    Object.assign(this.joystickOuter.style, {
      position:        'fixed',
      bottom:          '20px',
      left:            '20px',
      width:           '80px',
      height:          '80px',
      borderRadius:    '50%',
      border:          '2px solid rgba(255,255,255,0.3)',
      background:      'rgba(0,0,0,0.4)',
      pointerEvents:   'auto',
      touchAction:     'none',
      userSelect:      'none',
    });

    this.joystickKnob = document.createElement('div');
    Object.assign(this.joystickKnob.style, {
      position:       'absolute',
      top:            '50%',
      left:           '50%',
      width:          '36px',
      height:         '36px',
      borderRadius:   '50%',
      background:     '#FFD700',
      transform:      'translate(-50%, -50%)',
      transition:     'transform 0.1s ease',
      pointerEvents:  'none',
    });

    this.joystickOuter.appendChild(this.joystickKnob);
    this.root.appendChild(this.joystickOuter);
  }

  // ── Touch events ──────────────────────────────
  _attachEvents() {
    // Joystick touch
    this.joystickOuter.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this._joystickTouchId = t.identifier;
      this._updateJoystick(t);
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._joystickTouchId) {
          e.preventDefault();
          this._updateJoystick(t);
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._joystickTouchId) {
          this._joystickTouchId = null;
          this._moveX = 0;
          this._moveY = 0;
          // Snap knob back to center
          this.joystickKnob.style.transform =
            'translate(-50%, -50%)';
        }
      }
    }, { passive: true });
  }

  _updateJoystick(touch) {
    const rect =
      this.joystickOuter.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    let  dx = touch.clientX - cx;
    let  dy = touch.clientY - cy;

    const maxTravel = 32;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxTravel) {
      dx = (dx / dist) * maxTravel;
      dy = (dy / dist) * maxTravel;
    }

    this._moveX = dx / maxTravel;
    this._moveY = dy / maxTravel;

    // Move knob visually (override transition
    // during active drag)
    this.joystickKnob.style.transition = 'none';
    this.joystickKnob.style.transform  =
      `translate(calc(-50% + ${dx}px), ` +
      `calc(-50% + ${dy}px))`;
  }

  // ── Public API ────────────────────────────────
  getMobileInput() {
    const out = {
      moveX:          this._moveX,
      moveY:          this._moveY,
      lookDeltaX:     this._lookDX,
      lookDeltaY:     this._lookDY,
      jump:           this._jump,
      sprint:         this._sprint,
      interact:       this._interact,
      currentContext: this._context,
    };
    // Consume one-shot values
    this._lookDX   = 0;
    this._lookDY   = 0;
    this._jump     = false;
    this._interact = false;
    return out;
  }

  setContext(name) {
    this._context = name;
  }

  isActive() {
    return this.active;
  }
}
