export default class MobileControls {
  constructor() {
    this.active = 'ontouchstart' in window ||
                  navigator.maxTouchPoints > 0;

    // Context definitions
    this._contexts = {
      default: {
        btnA: { label: '⚡ ACT',   color: '#FFD700' },
        btnB: { label: '↑ JUMP',  color: 'rgba(255,255,255,0.7)' },
        btnC: { label: '▶▶ RUN',  color: 'rgba(255,255,255,0.5)' },
      },
      nearNPC: {
        btnA: { label: '💬 TALK',   color: '#FFD700' },
        btnB: { label: '✕ CANCEL', color: 'rgba(255,255,255,0.7)' },
        btnC: { label: '▶▶ RUN',   color: 'rgba(255,255,255,0.5)' },
      },
      nearVehicle: {
        btnA: { label: '🚐 ENTER', color: '#FFD700' },
        btnB: { label: '↑ JUMP',  color: 'rgba(255,255,255,0.7)' },
        btnC: { label: '▶▶ RUN',  color: 'rgba(255,255,255,0.5)' },
      },
      driving: {
        btnA: { label: '🚪 EXIT',  color: '#FF4444' },
        btnB: { label: '📯 HORN',  color: 'rgba(255,255,255,0.7)' },
        btnC: { label: '🔄 BRAKE', color: 'rgba(255,165,0,0.8)' },
      },
      nearDoor: {
        btnA: { label: '🚪 ENTER', color: '#FFD700' },
        btnB: { label: '↑ JUMP',  color: 'rgba(255,255,255,0.7)' },
        btnC: { label: '▶▶ RUN',  color: 'rgba(255,255,255,0.5)' },
      },
      nearMarket: {
        btnA: { label: '🛒 BUY',  color: '#00CC66' },
        btnB: { label: '↑ JUMP', color: 'rgba(255,255,255,0.7)' },
        btnC: { label: '▶▶ RUN', color: 'rgba(255,255,255,0.5)' },
      },
    };

    // Timer IDs for cancelling stale context fades
    this._contextTimers = {};

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
    this._buildButtons();
    this._buildLookZone();
    this._buildTopButtons();
  }

  _buildButtons() {
    // Button configs [id, label, color,
    //                 bottom, right]
    const btns = [
      { id:'btnA', label:'⚡ ACT',
        bg:'#FFD700',
        bottom:'20px',  right:'20px'  },
      { id:'btnB', label:'↑ JUMP',
        bg:'rgba(255,255,255,0.7)',
        bottom:'90px',  right:'80px'  },
      { id:'btnC', label:'▶▶ RUN',
        bg:'rgba(255,255,255,0.5)',
        bottom:'20px',  right:'90px'  },
    ];

    this.buttons = {};
    btns.forEach(cfg => {
      const btn = document.createElement('div');
      Object.assign(btn.style, {
        position:     'fixed',
        bottom:       cfg.bottom,
        right:        cfg.right,
        width:        '60px',
        height:       '60px',
        borderRadius: '50%',
        background:   cfg.bg,
        display:      'flex',
        alignItems:   'center',
        justifyContent:'center',
        fontSize:     '11px',
        fontWeight:   'bold',
        fontFamily:   'Arial, sans-serif',
        color:        '#000',
        pointerEvents:'auto',
        touchAction:  'none',
        userSelect:   'none',
        cursor:       'pointer',
        boxShadow:    '0 2px 8px rgba(0,0,0,0.5)',
        transition:   'opacity 0.2s ease, transform 0.1s ease, background 0.2s ease',
        textAlign:    'center',
        lineHeight:   '1.2',
        padding:      '4px',
      });
      btn.textContent = cfg.label;
      btn.dataset.btnId = cfg.id;

      // Press animation
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        btn.style.transform = 'scale(0.88)';
        btn.style.opacity   = '0.75';
        if (cfg.id === 'btnA') this._interact = true;
        if (cfg.id === 'btnB') this._jump     = true;
        if (cfg.id === 'btnC') this._sprint   = true;
      }, { passive: false });

      btn.addEventListener('touchend', e => {
        e.preventDefault();
        btn.style.transform = 'scale(1)';
        btn.style.opacity   = '1';
        if (cfg.id === 'btnC') this._sprint = false;
      }, { passive: false });

      // Mouse fallback so the buttons are testable on desktop / in device
      // emulation, and so touch devices that only synthesise click events
      // (some in-app webviews) still fire the action.
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (cfg.id === 'btnA') this._interact = true;
        if (cfg.id === 'btnB') this._jump     = true;
        if (cfg.id === 'btnC') this._sprint   = true;
        // Auto-release sprint after 16ms on click
        if (cfg.id === 'btnC') {
          setTimeout(() => { this._sprint = false; }, 16);
        }
      });

      this.buttons[cfg.id] = btn;
      this.root.appendChild(btn);
    });
  }

  _buildLookZone() {
    this.lookZone = document.createElement('div');
    Object.assign(this.lookZone.style, {
      position:     'fixed',
      top:          '0',
      right:        '0',
      width:        '60%',
      height:       '100%',
      // Starts DISABLED. This zone covers the right 60% of the viewport at
      // full height, which includes the dead centre of the screen where the
      // start overlay's "Click to play" CTA lives. If it were 'auto' from
      // construction it would swallow every tap on the overlay (and on the
      // canvas) before the game has started, because the root sits at
      // z-index 1000 while #overlay is trapped at z-index auto.
      // main.js calls enable() from the start handler to turn look on.
      pointerEvents:'none',
      touchAction:  'none',
      userSelect:   'none',
      // transparent — invisible to player
      background:   'transparent',
    });

    this.lookZone.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        if (this._lookTouchId === null &&
            t.identifier !== this._joystickTouchId) {
          this._lookTouchId = t.identifier;
          this._lookLastX   = t.clientX;
          this._lookLastY   = t.clientY;
        }
      }
    }, { passive: true });

    this.lookZone.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._lookTouchId) {
          this._lookDX += (t.clientX - this._lookLastX)
                          * 0.004;
          this._lookDY += (t.clientY - this._lookLastY)
                          * 0.004;
          this._lookLastX = t.clientX;
          this._lookLastY = t.clientY;
        }
      }
    }, { passive: true });

    this.lookZone.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._lookTouchId) {
          this._lookTouchId = null;
        }
      }
    }, { passive: true });

    this.root.appendChild(this.lookZone);
  }

  _buildTopButtons() {
    const makeTopBtn = (label, extraStyles) => {
      const btn = document.createElement('div');
      Object.assign(btn.style, {
        position:       'fixed',
        width:          '32px',
        height:         '32px',
        borderRadius:   '8px',
        background:     'rgba(0,0,0,0.55)',
        border:         '1px solid rgba(255,255,255,0.25)',
        color:          '#FFD700',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '9px',
        fontFamily:     'Arial, sans-serif',
        fontWeight:     'bold',
        pointerEvents:  'auto',
        touchAction:    'none',
        userSelect:     'none',
        cursor:         'pointer',
        textAlign:      'center',
        lineHeight:     '1.2',
        zIndex:         '1001',
        ...extraStyles,
      });
      btn.textContent = label;
      return btn;
    };

    this.btnMenu = makeTopBtn('≡\nMENU', {
      top:   '12px',
      right: '12px',
    });
    this.btnMenu.addEventListener('touchstart', e => {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent('naija:togglePause')
      );
    }, { passive: false });

    this.btnMap = makeTopBtn('🗺\nMAP', {
      top:  '190px',
      left: '12px',
    });
    this.btnMap.addEventListener('touchstart', e => {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent('naija:toggleMap')
      );
    }, { passive: false });

    this.timeChip = document.createElement('div');
    Object.assign(this.timeChip.style, {
      position:       'fixed',
      top:            '60px',
      right:          '12px',
      padding:        '4px 8px',
      borderRadius:   '20px',
      background:     'rgba(0,0,0,0.55)',
      border:         '1px solid rgba(255,255,255,0.25)',
      color:          '#FFD700',
      fontFamily:     'Arial, sans-serif',
      fontSize:       '11px',
      fontWeight:     'bold',
      pointerEvents:  'none',
      userSelect:     'none',
      zIndex:         '1001',
    });
    this.timeChip.textContent = '00:00 AM';

    this.root.appendChild(this.btnMenu);
    this.root.appendChild(this.btnMap);
    this.root.appendChild(this.timeChip);
  }

  updateTimeDisplay(timeString) {
    if (this.timeChip) {
      this.timeChip.textContent = timeString;
    }
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

  /**
   * Turn camera-look touch capture on. Called by main.js once the game has
   * actually started, so the invisible look zone cannot eat taps on the
   * start overlay. No-op on desktop, where the UI is never built.
   */
  enable() {
    if (!this.active) return;
    if (this.lookZone) {
      this.lookZone.style.pointerEvents = 'auto';
    }
  }

  /**
   * Turn camera-look touch capture off again (pause / back to the start
   * overlay) so taps fall through to the DOM underneath.
   */
  disable() {
    if (this.lookZone) {
      this.lookZone.style.pointerEvents = 'none';
    }
  }

  setContext(name) {
    if (!this.active) return;
    if (!this._contexts[name]) return;
    if (this._context === name) return;
    this._context = name;
    const cfg = this._contexts[name];
    Object.entries(cfg).forEach(([id, vals]) => {
      const btn = this.buttons?.[id];
      if (!btn) return;
      // Cancel any pending fade for this button
      if (this._contextTimers[id]) {
        clearTimeout(this._contextTimers[id]);
        this._contextTimers[id] = null;
      }
      // Fade out
      btn.style.opacity = '0';
      // Update after fade, store timer id
      this._contextTimers[id] = setTimeout(() => {
        this._contextTimers[id] = null;
        btn.textContent      = vals.label;
        btn.style.background = vals.color;
        btn.style.opacity    = '1';
      }, 200);
    });
  }

  isActive() {
    return this.active;
  }
}
