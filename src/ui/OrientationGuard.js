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

    this.overlay.style.display = 

      this.isPortrait() ? 'flex' : 'none';

  }



  startListening() {

    this.update();

    // Attempt real OS-level landscape lock

    // (works on Android Chrome, silently fails

    //  elsewhere — that is expected behaviour)

    if (this.isMobile() && screen.orientation 

        && screen.orientation.lock) {

      screen.orientation.lock('landscape')

        .catch(() => {

          // Lock not supported or not in 

          // fullscreen — CSS fallback handles it

        });

    }

    // CSS fallback listeners

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
