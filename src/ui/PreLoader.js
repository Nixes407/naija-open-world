export default class PreLoader {
  constructor() {
    this._el      = null;
    this._resolve = null;
  }

  show() {
    return new Promise(resolve => {
      this._resolve = resolve;
      this._build();
    });
  }

  _build() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes phone-rotate {
        0%,40%  { transform: rotate(0deg);  }
        60%,100%{ transform: rotate(90deg); }
      }
      @keyframes pulse-tap {
        0%,100% { opacity:0.6;transform:scale(1);   }
        50%     { opacity:1;  transform:scale(1.08); }
      }
      @keyframes fade-out-loader {
        from { opacity:1; }
        to   { opacity:0; }
      }
    `;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.id = 'pre-loader';
    Object.assign(el.style, {
      position:       'fixed',
      inset:          '0',
      background:     '#000000',
      zIndex:         '99999',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     'Arial, sans-serif',
      cursor:         'pointer',
      userSelect:     'none',
    });
    this._el = el;

    const logo = document.createElement('div');
    logo.textContent = '🇳🇬';
    logo.style.fontSize = '48px';
    logo.style.marginBottom = '8px';
    el.appendChild(logo);

    const title = document.createElement('div');
    title.textContent = 'NAIJA OPEN WORLD';
    Object.assign(title.style, {
      fontSize:      'clamp(18px,5vw,28px)',
      fontWeight:    'bold',
      color:         '#FFD700',
      letterSpacing: '3px',
      marginBottom:  '32px',
      textShadow:
        '0 0 20px rgba(255,215,0,0.5)',
    });
    el.appendChild(title);

    const phoneWrap =
      document.createElement('div');
    Object.assign(phoneWrap.style, {
      position:       'relative',
      width:          '120px',
      height:         '120px',
      marginBottom:   '24px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    });

    const phoneIcon =
      document.createElement('div');
    phoneIcon.textContent = '📱';
    Object.assign(phoneIcon.style, {
      fontSize:  '64px',
      animation:
        'phone-rotate 2s ease-in-out infinite',
    });
    phoneWrap.appendChild(phoneIcon);

    const arrow =
      document.createElement('div');
    arrow.textContent = '↻';
    Object.assign(arrow.style, {
      position: 'absolute',
      bottom:   '0',
      right:    '0',
      fontSize: '24px',
      color:    '#FFD700',
      opacity:  '0.7',
    });
    phoneWrap.appendChild(arrow);
    el.appendChild(phoneWrap);

    const instr =
      document.createElement('div');
    instr.textContent =
      'Tap anywhere to go fullscreen & play';
    Object.assign(instr.style, {
      fontSize:     'clamp(13px,3vw,16px)',
      color:        'rgba(255,255,255,0.7)',
      marginBottom: '8px',
      textAlign:    'center',
      padding:      '0 20px',
    });
    el.appendChild(instr);

    const sub = document.createElement('div');
    sub.textContent =
      'Best played in landscape mode';
    Object.assign(sub.style, {
      fontSize:  '11px',
      color:     'rgba(255,255,255,0.35)',
      animation: 'pulse-tap 2s infinite',
    });
    el.appendChild(sub);

    const dismiss = () => {
      const docEl =
        document.documentElement;
      const goFS =
        docEl.requestFullscreen?.bind(docEl) ||
        docEl.webkitRequestFullscreen
          ?.bind(docEl);

      const afterFS = () => {
        if (screen.orientation?.lock) {
          screen.orientation
            .lock('landscape')
            .catch(() => {});
        }
        el.style.animation =
          'fade-out-loader 0.4s ease forwards';
        setTimeout(() => {
          el.remove();
          this._el = null;
          if (this._resolve) {
            this._resolve();
            this._resolve = null;
          }
        }, 420);
      };

      if (goFS) {
        goFS().then(afterFS).catch(afterFS);
      } else {
        afterFS();
      }
    };

    el.addEventListener('click', dismiss,
      {once:true}
    );
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      dismiss();
    }, {once:true, passive:false});

    document.body.appendChild(el);
  }

  destroy() {
    this._el?.remove();
    this._el = null;
  }
}
