export default class StatsHUD {
  constructor(playerState) {
    this._state = playerState;
    this._el = null;
    this._els = {};
    this._build();
    this._bindState();
  }

  _build() {
    // ── Root panel: top-left cluster ──────────
    const el = document.createElement('div');
    el.id = 'stats-hud';
    Object.assign(el.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      zIndex: '1500',
      pointerEvents: 'none',
      userSelect: 'none',
    });
    this._el = el;

    // ── Row 1: Avatar + Stat bars ─────────────
    const topRow = document.createElement('div');
    Object.assign(topRow.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    });

    // Avatar circle
    const avatar = document.createElement('div');
    avatar.id = 'hud-avatar';
    Object.assign(avatar.style, {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#8D5524',
      border: '2px solid #FFD700',
      flexShrink: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      overflow: 'hidden',
    });
    avatar.textContent = '😊';
    this._els.avatar = avatar;
    topRow.appendChild(avatar);

    // Bars column
    const barsCol = document.createElement('div');
    Object.assign(barsCol.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
    });

    const barDefs = [
      { key: 'health', emoji: '❤️', color: '#E74C3C' },
      { key: 'energy', emoji: '⚡', color: '#F39C12' },
      { key: 'hunger', emoji: '🍖', color: '#E67E22' },
      { key: 'sanity', emoji: '🧠', color: '#9B59B6' },
    ];

    barDefs.forEach(({ key, emoji, color }) => {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
      });

      const icon = document.createElement('span');
      icon.textContent = emoji;
      icon.style.fontSize = '9px';
      icon.style.minWidth = '12px';
      row.appendChild(icon);

      const barBg = document.createElement('div');
      Object.assign(barBg.style, {
        width: '70px',
        height: '5px',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '3px',
        overflow: 'hidden',
      });

      const barFill = document.createElement('div');
      Object.assign(barFill.style, {
        width: '100%',
        height: '100%',
        background: color,
        borderRadius: '3px',
        transition: 'width 0.4s ease',
      });
      barBg.appendChild(barFill);
      row.appendChild(barBg);

      const val = document.createElement('span');
      Object.assign(val.style, {
        color: 'rgba(255,255,255,0.7)',
        fontSize: '8px',
        minWidth: '20px',
        fontFamily: 'Arial, sans-serif',
      });
      val.textContent = '100';
      row.appendChild(val);

      this._els[key] = { fill: barFill, val };
      barsCol.appendChild(row);
    });

    topRow.appendChild(barsCol);
    el.appendChild(topRow);

    // ── Row 2: Money display ──────────────────
    const moneyRow = document.createElement('div');
    moneyRow.id = 'hud-money';
    Object.assign(moneyRow.style, {
      background: 'rgba(0,0,0,0.60)',
      border: '1px solid rgba(255,215,0,0.5)',
      borderRadius: '6px',
      padding: '2px 8px',
      color: '#FFD700',
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    });
    moneyRow.innerHTML =
      '<span style="font-size:9px">💰</span>' +
      '<span id="hud-money-text">₦ ---</span>';
    this._els.money = moneyRow.querySelector('#hud-money-text');
    el.appendChild(moneyRow);

    // ── Row 3: Day + Power in one row ─────────
    const infoRow = document.createElement('div');
    Object.assign(infoRow.style, {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
    });

    const dayEl = document.createElement('div');
    dayEl.id = 'stats-hud-day';
    Object.assign(dayEl.style, {
      background: 'rgba(0,0,0,0.60)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '6px',
      padding: '2px 6px',
      color: '#aaa',
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      whiteSpace: 'nowrap',
    });
    dayEl.textContent = 'Day 1';
    this._els.day = dayEl;
    infoRow.appendChild(dayEl);

    const powerEl = document.createElement('div');
    powerEl.id = 'hud-power';
    Object.assign(powerEl.style, {
      background: 'rgba(0,0,0,0.60)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '6px',
      padding: '2px 6px',
      color: '#E74C3C',
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
      whiteSpace: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
    });
    powerEl.innerHTML =
      '<span>🔌</span>' +
      '<span id="hud-power-text">No Power</span>';
    this._els.powerText = powerEl.querySelector('#hud-power-text');
    infoRow.appendChild(powerEl);

    el.appendChild(infoRow);
    document.body.appendChild(el);

    // Hidden until game starts
    el.style.display = 'none';
  }

  _bindState() {
    if (!this._state) return;

    this._state.on('init', () => {
      this.show();
      this.refresh();
      // Update avatar skin tone
      const tone = this._state.get('skinTone');
      if (tone && this._els.avatar) {
        this._els.avatar.style.background = tone.color || '#8D5524';
      }
    });
    this._state.on('money', () => this._updateMoney());
    this._state.on('stat', ({ key }) => this._updateBar(key));
  }

  refresh() {
    if (!this._state?.get('name')) return;
    this._updateMoney();
    ['health', 'energy', 'hunger', 'sanity']
      .forEach(k => this._updateBar(k));
    this._updateDay();
  }

  _updateMoney() {
    if (this._els.money && this._state) {
      this._els.money.textContent = this._state.moneyFormatted;
    }
  }

  _updateBar(key) {
    const entry = this._els[key];
    if (!entry || !this._state) return;
    const val = this._state.getStat(key);
    entry.fill.style.width = `${val}%`;
    entry.val.textContent = Math.round(val);
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

  updatePower(isOn, source) {
    const txt = this._els.powerText;
    const row = document.getElementById('hud-power');
    if (!txt) return;
    if (isOn) {
      txt.textContent = source === 'gen'
        ? '⚙️ Generator' : '💡 NEPA';
      txt.style.color = '#2ECC71';
      if (row) row.style.borderColor = 'rgba(46,204,113,0.3)';
    } else {
      txt.textContent = '🔌 No Power';
      txt.style.color = '#E74C3C';
      if (row) row.style.borderColor = 'rgba(255,255,255,0.1)';
    }
  }

  tick() {
    if (!this._state?.get('name')) return;
    this._tickCount = (this._tickCount ?? 0) + 1;
    if (this._tickCount % 600 === 0) {
      this._state.modStat('hunger', -1);
      this._state.modStat('energy', -0.5);
      this._state.modStat('thirst', -1.5);
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
