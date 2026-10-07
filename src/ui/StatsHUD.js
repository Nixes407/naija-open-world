export default class StatsHUD {

  constructor(playerState) {

    this._state = playerState;

    this._el    = null;

    this._els   = {};

    this._build();

    this._bindState();

  }


  _build() {

    // ── Root panel ──────────────────────────

    const el = document.createElement('div');

    el.id = 'stats-hud';

    Object.assign(el.style, {

      position:      'fixed',

      bottom:        '20px',

      left:          '50%',

      transform:     'translateX(-50%)',

      display:       'flex',

      flexDirection: 'row',

      gap:           '8px',

      zIndex:        '1500',

      pointerEvents: 'none',

      userSelect:    'none',

      flexWrap:      'wrap',

      justifyContent:'center',

      maxWidth:      '420px',

    });

    this._el = el;


    // ── Money display ────────────────────────

    const moneyEl = document.createElement('div');

    moneyEl.id = 'hud-money';

    Object.assign(moneyEl.style, {

      background:   'rgba(0,0,0,0.65)',

      border:       '1px solid #FFD700',

      borderRadius: '20px',

      padding:      '5px 14px',

      color:        '#FFD700',

      fontFamily:   'Arial, sans-serif',

      fontSize:     '14px',

      fontWeight:   'bold',

      whiteSpace:   'nowrap',

    });

    moneyEl.textContent = '₦0.00';

    this._els.money = moneyEl;

    el.appendChild(moneyEl);


    // ── Stat bars config ─────────────────────

    const bars = [

      { key:'health',     emoji:'❤️',  color:'#E74C3C' },

      { key:'energy',     emoji:'⚡',  color:'#F39C12' },

      { key:'hunger',     emoji:'🍖',  color:'#E67E22' },

      { key:'sanity',     emoji:'🧠',  color:'#9B59B6' },

      { key:'phoneBattery', emoji:'📱', color:'#2ECC71' },

    ];


    bars.forEach(({ key, emoji, color }) => {

      const wrap = document.createElement('div');

      Object.assign(wrap.style, {

        background:   'rgba(0,0,0,0.65)',

        border:       `1px solid ${color}`,

        borderRadius: '20px',

        padding:      '5px 10px',

        display:      'flex',

        alignItems:   'center',

        gap:          '5px',

        minWidth:     '80px',

      });


      const icon = document.createElement('span');

      icon.textContent = emoji;

      icon.style.fontSize = '12px';

      wrap.appendChild(icon);


      const barBg = document.createElement('div');

      Object.assign(barBg.style, {

        width:        '50px',

        height:       '6px',

        background:   'rgba(255,255,255,0.15)',

        borderRadius: '3px',

        overflow:     'hidden',

      });


      const barFill = document.createElement('div');

      Object.assign(barFill.style, {

        width:        '100%',

        height:       '100%',

        background:   color,

        borderRadius: '3px',

        transition:   'width 0.5s ease',

      });

      barBg.appendChild(barFill);

      wrap.appendChild(barBg);


      const valEl = document.createElement('span');

      Object.assign(valEl.style, {

        color:      '#fff',

        fontSize:   '10px',

        fontFamily: 'Arial, sans-serif',

        minWidth:   '24px',

        textAlign:  'right',

      });

      valEl.textContent = '100';

      wrap.appendChild(valEl);


      this._els[key] = { fill: barFill, val: valEl };

      el.appendChild(wrap);

    });


    // ── Day counter ──────────────────────────

    const dayEl = document.createElement('div');

    dayEl.id = 'hud-day';

    Object.assign(dayEl.style, {

      background:   'rgba(0,0,0,0.65)',

      border:       '1px solid rgba(255,255,255,0.2)',

      borderRadius: '20px',

      padding:      '5px 14px',

      color:        '#aaa',

      fontFamily:   'Arial, sans-serif',

      fontSize:     '12px',

      whiteSpace:   'nowrap',

    });

    dayEl.textContent = 'Day 1';

    this._els.day = dayEl;

    el.appendChild(dayEl);



    document.body.appendChild(el);



    // Hide until game starts

    el.style.display = 'none';

  }


  // ── Listen to PlayerState events ──────────

  _bindState() {

    if (!this._state) return;


    this._state.on('init', () => {

      this.show();

      this.refresh();

    });


    this._state.on('money', () => {

      this._updateMoney();

    });


    this._state.on('stat', ({ key }) => {

      this._updateBar(key);

    });

  }


  // ── Update all displayed values ───────────

  refresh() {

    if (!this._state?.get('name')) return;

    this._updateMoney();

    ['health','energy','hunger',

     'sanity','phoneBattery'].forEach(k => {

      this._updateBar(k);

    });

    this._updateDay();

  }


  _updateMoney() {

    if (this._els.money && this._state) {

      this._els.money.textContent =

        this._state.moneyFormatted;

    }

  }


  _updateBar(key) {

    const entry = this._els[key];

    if (!entry || !this._state) return;

    const val = this._state.getStat(key);

    entry.fill.style.width = `${val}%`;

    entry.val.textContent  = Math.round(val);



    // Color warning when low

    if (val <= 20) {

      entry.fill.style.animation =

        'pulse 0.8s ease-in-out infinite alternate';

    } else {

      entry.fill.style.animation = 'none';

    }

  }


  _updateDay() {

    if (this._els.day && this._state) {

      const day = this._state.get('dayNumber') ?? 1;

      this._els.day.textContent = `Day ${day}`;

    }

  }


  // ── Call from main game loop each frame ───

  tick() {

    // Hunger and energy drain slowly over time

    // This runs every frame so we use a counter

    if (!this._state?.get('name')) return;

    this._tickCount = (this._tickCount ?? 0) + 1;



    // Every 600 frames (~10 seconds at 60fps)

    // drain hunger by 1 and energy by 0.5

    if (this._tickCount % 600 === 0) {

      this._state.modStat('hunger',  -1);

      this._state.modStat('energy',  -0.5);

      this._state.modStat('thirst',  -1.5);



      // Phone battery drains too

      this._state.modStat('phoneBattery', -0.3);



      // Refresh displays

      this.refresh();

    }

  }


  show() {

    if (this._el) this._el.style.display = 'flex';

  }


  hide() {

    if (this._el) this._el.style.display = 'none';

  }


  destroy() {

    this._el?.remove();

    this._el = null;

  }

}
