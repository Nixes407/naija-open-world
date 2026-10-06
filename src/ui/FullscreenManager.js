export default class FullscreenManager {
  constructor(orientationGuard = null) {
    this._guard = orientationGuard;
    this._buildButton();
    this._attachEvents();
  }

  _buildButton() {
    this.btn = document.createElement('div');
    this.btn.id = 'fullscreen-btn';
    Object.assign(this.btn.style, {
      position:       'fixed',
      top:            '12px',
      // Center horizontally
      left:           '50%',
      transform:      'translateX(-50%)',
      width:          '40px',
      height:         '40px',
      borderRadius:   '8px',
      background:     'rgba(0,0,0,0.55)',
      border:         '1px solid rgba(255,255,255,0.25)',
      color:          '#FFD700',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       '20px',
      cursor:         'pointer',
      zIndex:         '10002',
      pointerEvents:  'auto',
      touchAction:    'none',
      userSelect:     'none',
      transition:     'background 0.2s',
    });
    this.btn.textContent = '⛶';
    this.btn.title = 'Toggle Fullscreen';
    document.body.appendChild(this.btn);
  }

  _attachEvents() {
    // Toggle on click and touch
    const toggle = (e) => {
      e.preventDefault();
      this.toggle();
    };
    this.btn.addEventListener('click', toggle);
    this.btn.addEventListener('touchstart', toggle,
      { passive: false }
    );

    // Update icon when fullscreen changes
    const onFSChange = () => {
      this._updateIcon();
      // After entering fullscreen, request
      // landscape lock — this is when it works
      if (this.isFullscreen() && this._guard) {
        if (screen.orientation && 
            screen.orientation.lock) {
          screen.orientation.lock('landscape')
            .catch(() => {
              // Still fails on iOS — expected
            });
        }
      }
    };
    document.addEventListener(
      'fullscreenchange', onFSChange
    );
    document.addEventListener(
      'webkitfullscreenchange', onFSChange
    );
  }

  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement
    );
  }

  toggle() {
    if (this.isFullscreen()) {
      this.exit();
    } else {
      this.enter();
    }
  }

  enter() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  }

  exit() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  _updateIcon() {
    // ⛶ = enter fullscreen, ⛶ = exit
    this.btn.textContent = 
      this.isFullscreen() ? '✕FS' : '⛶';
    this.btn.style.background = 
      this.isFullscreen()
        ? 'rgba(255,215,0,0.3)'
        : 'rgba(0,0,0,0.55)';
  }
}
