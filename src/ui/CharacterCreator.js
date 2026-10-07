export const ORIGINS = {
  ajebutter: {
    id: 'ajebutter', name: 'Ajebutter',
    description: 'Rich kid from Lekki. Silver spoon, zero street sense.',
    emoji: '🏠', startMoney: 5000000,
    stats: {
      health: 100, energy: 100, sanity: 80,
      reputation: 60, streetCred: 10, education: 80,
    },
    startArea: 'Lekki', difficulty: 'Easy',
    color: '#FFD700',
  },
  ajepako: {
    id: 'ajepako', name: 'Ajepako',
    description: 'Street smart hustler from Mushin. Knows every corner.',
    emoji: '💪', startMoney: 50000,
    stats: {
      health: 90, energy: 95, sanity: 70,
      reputation: 40, streetCred: 90, education: 30,
    },
    startArea: 'Mushin', difficulty: 'Hard',
    color: '#FF6B35',
  },
  jjc: {
    id: 'jjc', name: 'JJC',
    description: 'Just landed from abroad. Big dreams, culture shock loading.',
    emoji: '✈️', startMoney: 200000,
    stats: {
      health: 100, energy: 100, sanity: 60,
      reputation: 30, streetCred: 5, education: 90,
    },
    startArea: 'Ikeja', difficulty: 'Medium',
    color: '#4FC3F7',
  },
  village: {
    id: 'village', name: 'Village Champion',
    description: 'Arriving from the village with big ambitions.',
    emoji: '🌿', startMoney: 15000,
    stats: {
      health: 100, energy: 100, sanity: 90,
      reputation: 20, streetCred: 40, education: 20,
    },
    startArea: 'Oshodi', difficulty: 'Very Hard',
    color: '#2ECC71',
  },
  returnee: {
    id: 'returnee', name: 'Returnee',
    description: 'Back from diaspora. Dollar savings, naira problems.',
    emoji: '🌍', startMoney: 800000,
    stats: {
      health: 100, energy: 90, sanity: 75,
      reputation: 50, streetCred: 15, education: 85,
    },
    startArea: 'VI', difficulty: 'Medium',
    color: '#9B59B6',
  },
};

export const SKIN_TONES = [
  { id: 'tone1', color: '#FDDBB4', label: 'Light' },
  { id: 'tone2', color: '#D4956A', label: 'Medium' },
  { id: 'tone3', color: '#8D5524', label: 'Brown' },
  { id: 'tone4', color: '#4A2912', label: 'Dark' },
  { id: 'tone5', color: '#2C1A0E', label: 'Deepest' },
];

export default class CharacterCreator {
  constructor() {
    this._resolve = null;
    this._selected = {
      origin: 'ajepako', name: '',
      gender: 'male', skinTone: 'tone3',
    };
    this._el = null;
    this._statsEl = null;
  }

  // Returns a Promise that resolves with
  // the player's choices when they submit
  open() {
    return new Promise(resolve => {
      this._resolve = resolve;
      this._build();
    });
  }

  _build() {
    // Full screen overlay
    const el = document.createElement('div');
    el.id = 'char-creator';
    Object.assign(el.style, {
      position: 'fixed', inset: '0',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a00 100%)',
      color: '#FFD700', fontFamily: 'Arial, sans-serif',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      overflowY: 'auto', zIndex: '20000',
      padding: '20px', boxSizing: 'border-box',
    });
    this._el = el;

    // Title
    const title = document.createElement('h1');
    title.textContent = '🇳🇬 Who Are You?';
    Object.assign(title.style, {
      fontSize: 'clamp(20px,4vw,32px)',
      margin: '0 0 6px', textAlign: 'center',
      textShadow: '0 0 20px rgba(255,215,0,0.5)',
    });
    el.appendChild(title);

    const sub = document.createElement('p');
    sub.textContent =
      'Your origin determines your starting conditions in Lagos';
    Object.assign(sub.style, {
      fontSize: '13px', color: '#aaa',
      margin: '0 0 20px', textAlign: 'center',
    });
    el.appendChild(sub);

    // Name input
    const nameWrap = document.createElement('div');
    Object.assign(nameWrap.style, {
      width: '100%', maxWidth: '400px', margin: '0 0 12px',
    });
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Your Name';
    Object.assign(nameLabel.style, {
      display: 'block', fontSize: '13px',
      color: '#aaa', marginBottom: '6px',
    });
    nameWrap.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter your name...';
    nameInput.maxLength = 20;
    Object.assign(nameInput.style, {
      width: '100%', padding: '10px 14px',
      fontSize: '16px',
      background: 'rgba(255,255,255,0.08)',
      border: '2px solid rgba(255,215,0,0.3)',
      borderRadius: '8px', color: '#FFD700',
      outline: 'none', boxSizing: 'border-box',
    });
    nameInput.addEventListener('focus', () => {
      nameInput.style.borderColor = '#FFD700';
    });
    nameInput.addEventListener('blur', () => {
      nameInput.style.borderColor = 'rgba(255,215,0,0.3)';
    });
    nameInput.addEventListener('input', () => {
      this._selected.name = nameInput.value.trim();
    });
    nameWrap.appendChild(nameInput);
    el.appendChild(nameWrap);

    // Gender selector
    const genderWrap = document.createElement('div');
    Object.assign(genderWrap.style, {
      display: 'flex', gap: '10px', marginBottom: '12px',
    });
    ['male', 'female'].forEach(g => {
      const btn = document.createElement('button');
      btn.dataset.gender = g;
      btn.textContent = g === 'male' ? '👨 Male' : '👩 Female';
      Object.assign(btn.style, {
        padding: '8px 20px', borderRadius: '20px',
        border: '2px solid rgba(255,215,0,0.4)',
        background: g === this._selected.gender
          ? 'rgba(255,215,0,0.2)' : 'transparent',
        color: '#FFD700', fontSize: '14px',
        cursor: 'pointer', transition: 'all 0.2s',
      });
      btn.addEventListener('click', () => {
        this._selected.gender = g;
        genderWrap.querySelectorAll('button').forEach(b => {
          b.style.background = b.dataset.gender === g
            ? 'rgba(255,215,0,0.2)' : 'transparent';
        });
      });
      genderWrap.appendChild(btn);
    });
    el.appendChild(genderWrap);

    // Skin tone selector
    const skinWrap = document.createElement('div');
    Object.assign(skinWrap.style, {
      display: 'flex', gap: '8px',
      alignItems: 'center', marginBottom: '12px',
    });
    const skinLabel = document.createElement('span');
    skinLabel.textContent = 'Skin Tone: ';
    Object.assign(skinLabel.style, {
      fontSize: '13px', color: '#aaa',
    });
    skinWrap.appendChild(skinLabel);
    SKIN_TONES.forEach(tone => {
      const dot = document.createElement('div');
      dot.title = tone.label;
      Object.assign(dot.style, {
        width: '28px', height: '28px',
        borderRadius: '50%', background: tone.color,
        cursor: 'pointer',
        border: tone.id === this._selected.skinTone
          ? '3px solid #FFD700'
          : '3px solid transparent',
        transition: 'border 0.2s, transform 0.2s',
      });
      dot.addEventListener('click', () => {
        this._selected.skinTone = tone.id;
        skinWrap.querySelectorAll('div').forEach(d => {
          d.style.border = '3px solid transparent';
          d.style.transform = 'scale(1)';
        });
        dot.style.border = '3px solid #FFD700';
        dot.style.transform = 'scale(1.2)';
      });
      skinWrap.appendChild(dot);
    });
    el.appendChild(skinWrap);

    // Origin cards title
    const cardsTitle = document.createElement('h2');
    cardsTitle.textContent = 'Choose Your Origin';
    Object.assign(cardsTitle.style, {
      fontSize: 'clamp(14px,3vw,20px)',
      margin: '16px 0 12px',
      textAlign: 'center', width: '100%',
    });
    el.appendChild(cardsTitle);

    // Origin cards grid
    const grid = document.createElement('div');
    Object.assign(grid.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))',
      gap: '10px', width: '100%', maxWidth: '700px',
    });
    Object.values(ORIGINS).forEach(origin => {
      const card = document.createElement('div');
      card.dataset.originId = origin.id;
      const isSel = this._selected.origin === origin.id;
      Object.assign(card.style, {
        background: isSel
          ? 'rgba(255,215,0,0.15)'
          : 'rgba(255,255,255,0.04)',
        border: isSel
          ? `2px solid ${origin.color}`
          : '2px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', padding: '14px',
        cursor: 'pointer', transition: 'all 0.2s',
        userSelect: 'none',
      });
      card.innerHTML = `
        <div style="font-size:28px;margin-bottom:6px">
          ${origin.emoji}
        </div>
        <div style="font-size:15px;font-weight:bold;
                    color:${origin.color};margin-bottom:4px">
          ${origin.name}
        </div>
        <div style="font-size:11px;color:#aaa;
                    margin-bottom:8px;line-height:1.4">
          ${origin.description}
        </div>
        <div style="font-size:11px;color:#666">
          Start: ₦${origin.startMoney.toLocaleString()}
        </div>
        <div style="font-size:11px;color:#666">
          Difficulty: ${origin.difficulty}
        </div>
      `;
      card.addEventListener('click', () => {
        this._selected.origin = origin.id;
        el.querySelectorAll('[data-origin-id]').forEach(c => {
          const oid = c.dataset.originId;
          const o = ORIGINS[oid];
          const sel = oid === origin.id;
          c.style.background = sel
            ? 'rgba(255,215,0,0.15)'
            : 'rgba(255,255,255,0.04)';
          c.style.border = sel
            ? `2px solid ${o.color}`
            : '2px solid rgba(255,255,255,0.1)';
        });
        this._updateStats();
      });
      grid.appendChild(card);
    });
    el.appendChild(grid);

    // Stats preview panel
    this._statsEl = document.createElement('div');
    Object.assign(this._statsEl.style, {
      marginTop: '16px', padding: '14px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '10px',
      width: '100%', maxWidth: '700px',
      minHeight: '80px',
    });
    el.appendChild(this._statsEl);
    this._updateStats();

    // Start button
    const startBtn = document.createElement('button');
    startBtn.textContent = '🚀 Start My Lagos Life';
    Object.assign(startBtn.style, {
      marginTop: '20px', marginBottom: '30px',
      padding: '14px 40px',
      fontSize: 'clamp(14px,3vw,18px)',
      fontWeight: 'bold', background: '#FFD700',
      color: '#000', border: 'none',
      borderRadius: '30px', cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
      transition: 'transform 0.1s, box-shadow 0.1s',
    });
    startBtn.addEventListener('mouseenter', () => {
      startBtn.style.transform = 'scale(1.05)';
      startBtn.style.boxShadow =
        '0 6px 28px rgba(255,215,0,0.6)';
    });
    startBtn.addEventListener('mouseleave', () => {
      startBtn.style.transform = 'scale(1)';
      startBtn.style.boxShadow =
        '0 4px 20px rgba(255,215,0,0.4)';
    });
    startBtn.addEventListener('click', () => this._submit());
    el.appendChild(startBtn);
    document.body.appendChild(el);
  }

  _updateStats() {
    if (!this._statsEl) return;
    const origin = ORIGINS[this._selected.origin];
    const s = origin.stats;
    const bars = Object.entries(s).map(([key, val]) => {
      const color = val >= 75 ? '#2ECC71'
        : val >= 45 ? '#FFD700' : '#E74C3C';
      return `
        <div style="margin-bottom:6px">
          <div style="display:flex;
                      justify-content:space-between;
                      font-size:11px;margin-bottom:2px">
            <span style="color:#aaa;
                         text-transform:capitalize">
              ${key}
            </span>
            <span style="color:${color}">${val}/100</span>
          </div>
          <div style="background:rgba(255,255,255,0.1);
                      border-radius:4px;height:6px">
            <div style="width:${val}%;height:6px;
                        background:${color};
                        border-radius:4px;
                        transition:width 0.4s">
            </div>
          </div>
        </div>`;
    }).join('');
    this._statsEl.innerHTML = `
      <div style="font-size:13px;font-weight:bold;
                  margin-bottom:10px;
                  color:${origin.color}">
        ${origin.emoji} ${origin.name} —
        Starting in ${origin.startArea}
      </div>${bars}`;
  }

  _submit() {
    if (!this._selected.name) {
      const defaults = [
        'Chukwuemeka', 'Oluwaseun', 'Aminu',
        'Ngozi', 'Fatima', 'Aisha',
        'Tunde', 'Chioma', 'Emeka', 'Sola',
      ];
      this._selected.name =
        defaults[Math.floor(Math.random() * defaults.length)];
    }
    const result = {
      ...this._selected,
      origin: ORIGINS[this._selected.origin],
      skinTone: SKIN_TONES.find(
        t => t.id === this._selected.skinTone
      ),
    };
    if (this._el) {
      this._el.style.transition = 'opacity 0.4s';
      this._el.style.opacity = '0';
      setTimeout(() => {
        this._el?.remove();
        this._el = null;
      }, 400);
    }
    if (this._resolve) {
      this._resolve(result);
      this._resolve = null;
    }
  }

  destroy() {
    this._el?.remove();
    this._el = null;
  }
}
