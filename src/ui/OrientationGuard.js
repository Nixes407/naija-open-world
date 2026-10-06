export default class OrientationGuard {

  constructor() {

    const style = document.createElement('style');

    style.textContent = `

  @keyframes phoneRotate {

    0%   { transform: rotate(0deg);  }

    100% { transform: rotate(90deg); }

  }

`;

    document.head.appendChild(style);



    this.overlay = document.createElement('div');

    this.overlay.id = 'orientation-guard';

    Object.assign(this.overlay.style, {

      position:       'fixed',

      top:            '0',

      left:           '0',

      width:          '100%',

      height:         '100%',

      background:     '#000000',

      color:          '#FFD700',

      display:        'none',

      flexDirection:  'column',

      alignItems:     'center',

      justifyContent: 'center',

      zIndex:         '9999',

      fontFamily:     'Arial, sans-serif',

      fontSize:       '20px',

      textAlign:      'center',

    });



    const icon = document.createElement('div');

    icon.textContent = '📱';

    Object.assign(icon.style, {

      fontSize:     '64px',

      marginBottom: '24px',

      animation:    'phoneRotate 2s ease-in-out infinite alternate',

    });



    const msg = document.createElement('p');

    msg.textContent = 

      'Rotate your phone for the best experience 🎮';

    Object.assign(msg.style, {

      margin:  '0',

      padding: '0 24px',

    });



    this.overlay.appendChild(icon);

    this.overlay.appendChild(msg);

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
    if (!this.isMobile()) {
      this.overlay.style.display = 'none';
      return;
    }
    // Only show if portrait AND lock failed
    // (soft hint handles this, so update()
    //  just hides in landscape)
    if (!this.isPortrait()) {
      this.overlay.style.display = 'none';
    }
  }

  _showSoftHint() {
    // Only show if actually in portrait
    if (!this.isPortrait()) return;

    // Change overlay text to be a soft hint
    // (not a hard block)
    this.overlay.style.display    = 'flex';
    this.overlay.style.background = 'rgba(0,0,0,0.7)';

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      this.overlay.style.opacity    = '0';
      this.overlay.style.transition = 'opacity 0.5s';
      setTimeout(() => {
        this.overlay.style.display = 'none';
        this.overlay.style.opacity = '1';
      }, 500);
    }, 3000);
  }

  startListening() {
    if (!this.isMobile()) return;

    // Attempt silent auto-lock to landscape
    // This works on Android Chrome when page is
    // focused. On iOS it silently fails — that
    // is expected and handled below.
    const tryLock = () => {
      if (screen.orientation &&
          screen.orientation.lock) {
        screen.orientation.lock('landscape')
          .then(() => {
            // Lock succeeded — hide overlay
            // completely, never show it
            this.overlay.style.display = 'none';
          })
          .catch(() => {
            // Lock failed (iOS or no fullscreen)
            // Show a soft auto-dismissing hint
            this._showSoftHint();
          });
      } else {
        // API not available — show soft hint
        this._showSoftHint();
      }
    };

    // Small delay so page is fully loaded first
    setTimeout(tryLock, 800);

    // Still listen for orientation changes
    // in case user manually rotates
    window.addEventListener('resize',
      () => this.update()
    );
    if (screen.orientation) {
      screen.orientation.addEventListener(
        'change', () => this.update()
      );
    }
  }

}
