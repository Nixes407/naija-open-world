export default class OrientationGuard {
  constructor() {
    // Build a hidden overlay — kept in DOM
    // for compatibility but never shown
    this.overlay = document.createElement('div');
    this.overlay.id = 'orientation-guard';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }

  isMobile() {
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0;
  }

  isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  update() {
    // Never show anything — overlay stays hidden
    this.overlay.style.display = 'none';
  }

  startListening() {
    // Immediately request fullscreen on any device
    // This fires as early as possible
    this._requestFullscreenAndLock();

    // Re-attempt on any user interaction
    // (needed for browsers that require gesture)
    const onGesture = () => {
      this._requestFullscreenAndLock();
    };
    document.addEventListener(
      'click', onGesture, { once: true }
    );
    document.addEventListener(
      'touchstart', onGesture, { once: true }
    );

    // Listen for orientation changes
    window.addEventListener('resize',
      () => this.update()
    );
    if (screen.orientation) {
      screen.orientation.addEventListener(
        'change', () => this._tryLock()
      );
    }
  }

  _requestFullscreenAndLock() {
    const el = document.documentElement;
    const goFS =
      el.requestFullscreen?.bind(el) ||
      el.webkitRequestFullscreen?.bind(el);

    if (goFS) {
      try {
        // Legacy WebKit may return void instead of a Promise.
        Promise.resolve(goFS()).then(() => {
          this._tryLock();
        }).catch(() => {
          // Fullscreen failed silently
          // Try lock anyway in case it works
          this._tryLock();
        });
      } catch {
        // Legacy APIs can also throw synchronously.
        this._tryLock();
      }
    } else {
      this._tryLock();
    }
  }

  _tryLock() {
    if (screen.orientation?.lock) {
      screen.orientation.lock('landscape')
        .catch(() => {
          // Silently fail on unsupported devices
        });
    }
  }
}
