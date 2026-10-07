export default class MiniMap {
  constructor(player, worldBuilder) {
    this._player       = player;
    this._worldBuilder = worldBuilder;
    this._scale        = 0.4; // world units to px
    this._radius       = 55;  // map display radius px
    this._el           = null;
    this._canvas       = null;
    this._ctx          = null;
    this._build();
  }

  _build() {
    // ── Container ────────────────────────────
    const el = document.createElement('div');
    el.id = 'mini-map';
    Object.assign(el.style, {
      position:     'fixed',
      top:          '97px',
      right:        '12px',
      width:        '110px',
      height:       '110px',
      borderRadius: '8px',
      overflow:     'hidden',
      border:       '1px solid rgba(255,215,0,0.4)',
      background:   'rgba(0,0,0,0.75)',
      zIndex:       '1500',
      pointerEvents:'none',
      userSelect:   'none',
      display:      'none',
    });
    this._el = el;

    // ── Canvas ───────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width  = 110;
    canvas.height = 110;
    Object.assign(canvas.style, {
      width:  '110px',
      height: '110px',
    });
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');
    el.appendChild(canvas);

    // ── Label ────────────────────────────────
    const label = document.createElement('div');
    label.textContent = 'MAP';
    Object.assign(label.style, {
      position:   'absolute',
      top:        '4px',
      right:      '6px',
      color:      'rgba(255,215,0,0.6)',
      fontSize:   '9px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      pointerEvents: 'none',
    });
    el.appendChild(label);

    document.body.appendChild(el);
  }

  // ── Call every frame from main loop ───────
  tick() {
    if (!this._ctx || !this._player) return;
    if (this._el.style.display === 'none') return;
    this._draw();
  }

  _draw() {
    const ctx = this._ctx;
    const W   = 110;
    const H   = 110;
    const cx  = W / 2;
    const cy  = H / 2;

    // Get player world position
    const pPos = this._player.body
      ? this._player.body.position
      : { x: 0, z: 0 };

    // ── Clear ────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // ── Background ───────────────────────────
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, W, H);

    // ── Grid lines ───────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    for (let i = 0; i < W; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }

    // ── Draw buildings from WorldBuilder ─────
    if (this._worldBuilder?.buildingData) {
      this._worldBuilder.buildingData.forEach(b => {
        const sx = cx + (b.x - pPos.x) * this._scale;
        const sy = cy + (b.z - pPos.z) * this._scale;
        const sw = Math.max(2, b.w * this._scale);
        const sd = Math.max(2, b.d * this._scale);

        // Only draw if within visible range
        if (sx < -sw || sx > W + sw) return;
        if (sy < -sd || sy > H + sd) return;

        ctx.fillStyle = b.h > 15
          ? '#3a5a8a'  // tall building — blue
          : '#2a4a3a'; // short building — green
        ctx.fillRect(
          sx - sw / 2, sy - sd / 2, sw, sd
        );
      });
    }

    // ── Draw roads (simplified grid) ─────────
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth   = 4 * this._scale * 10;
    // Horizontal roads
    for (let r = -4; r <= 5; r++) {
      const worldZ = r * 50 - 25;
      const sy = cy + (worldZ - pPos.z) * this._scale;
      if (sy < 0 || sy > H) continue;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(W, sy);
      ctx.stroke();
    }
    // Vertical roads
    for (let c = -4; c <= 5; c++) {
      const worldX = c * 50 - 25;
      const sx = cx + (worldX - pPos.x) * this._scale;
      if (sx < 0 || sx > W) continue;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, H);
      ctx.stroke();
    }

    // ── Draw landmarks ────────────────────────
    const landmarks = [
      { x: 220,  z: 0,   label: 'NECOM',   color: '#4FC3F7' },
      { x: -220, z: 0,   label: 'Theatre', color: '#FF6B35' },
      { x: 0,    z: 220, label: 'Bridge',  color: '#2ECC71' },
    ];
    landmarks.forEach(lm => {
      const sx = cx + (lm.x - pPos.x) * this._scale;
      const sy = cy + (lm.z - pPos.z) * this._scale;
      if (sx < 0 || sx > W || sy < 0 || sy > H) return;
      ctx.fillStyle = lm.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lm.color;
      ctx.font      = 'bold 7px Arial';
      ctx.fillText(lm.label, sx + 5, sy + 3);
    });

    // ── Player dot (always center) ────────────
    // Direction indicator
    ctx.fillStyle   = '#FFD700';
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Player name
    ctx.fillStyle = '#FFD700';
    ctx.font      = 'bold 8px Arial';
    ctx.fillText('YOU', cx + 7, cy + 3);

    // ── Compass ───────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font      = 'bold 8px Arial';
    ctx.fillText('N', cx - 3, 10);
  }

  show() {
    if (this._el) this._el.style.display = 'block';
  }

  hide() {
    if (this._el) this._el.style.display = 'none';
  }

  toggle() {
    if (!this._el) return;
    if (this._el.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  destroy() {
    this._el?.remove();
  }
}
