export const ORIGINS = {

  ajebutter: {

    id:'ajebutter', name:'Ajebutter',

    description:'Rich kid from Lekki. Silver spoon, zero street sense.',

    emoji:'🏠', startMoney:5000000,

    stats:{health:100,energy:100,sanity:80,

           reputation:60,streetCred:10,education:80},

    startArea:'Lekki', difficulty:'Easy',

    color:'#FFD700',

    autoLook:{hair:'low-cut',hairColor:'#1a1a1a',

              beard:'clean',clothes:'designer',

              shoes:'loafers',accessory:'gold-chain'},

    allowedClothes:['designer','suit','smart-casual','ankara'],

    allowedShoes:['loafers','dress-shoes','trainers','sneakers'],

    allowedHairColors:['#1a1a1a','#4a3728','#8B6914',

                       '#FFD700','#888888','#e74c3c'],

  },

  ajepako: {

    id:'ajepako', name:'Ajepako',

    description:'Street smart hustler from Mushin. Knows every corner.',

    emoji:'💪', startMoney:50000,

    stats:{health:90,energy:95,sanity:70,

           reputation:40,streetCred:90,education:30},

    startArea:'Mushin', difficulty:'Hard',

    color:'#FF6B35',

    autoLook:{hair:'fade',hairColor:'#1a1a1a',

              beard:'stubble',clothes:'streetwear',

              shoes:'trainers',accessory:'durag'},

    allowedClothes:['streetwear','ankara','simple'],

    allowedShoes:['trainers','slippers','sandals'],

    allowedHairColors:['#1a1a1a','#4a3728'],

  },

  jjc: {

    id:'jjc', name:'JJC',

    description:'Just landed from abroad. Big dreams, culture shock loading.',

    emoji:'✈️', startMoney:200000,

    stats:{health:100,energy:100,sanity:60,

           reputation:30,streetCred:5,education:90},

    startArea:'Ikeja', difficulty:'Medium',

    color:'#4FC3F7',

    autoLook:{hair:'waves',hairColor:'#1a1a1a',

              beard:'clean',clothes:'foreign-brand',

              shoes:'sneakers',accessory:'abroad-jacket'},

    allowedClothes:['foreign-brand','smart-casual','designer'],

    allowedShoes:['sneakers','trainers','loafers'],

    allowedHairColors:['#1a1a1a','#4a3728','#8B6914',

                       '#888888','#FFD700','#e74c3c'],

  },

  village: {

    id:'village', name:'Village Champion',

    description:'Arriving from the village with big ambitions.',

    emoji:'🌿', startMoney:15000,

    stats:{health:100,energy:100,sanity:90,

           reputation:20,streetCred:40,education:20},

    startArea:'Oshodi', difficulty:'Very Hard',

    color:'#2ECC71',

    autoLook:{hair:'low-cut',hairColor:'#1a1a1a',

              beard:'full-beard',clothes:'agbada',

              shoes:'slippers',accessory:'none'},

    allowedClothes:['agbada','ankara','simple'],

    allowedShoes:['slippers','sandals'],

    allowedHairColors:['#1a1a1a','#4a3728'],

  },

  returnee: {

    id:'returnee', name:'Returnee',

    description:'Back from diaspora. Dollar savings, naira problems.',

    emoji:'🌍', startMoney:800000,

    stats:{health:100,energy:90,sanity:75,

           reputation:50,streetCred:15,education:85},

    startArea:'VI', difficulty:'Medium',

    color:'#9B59B6',

    autoLook:{hair:'low-cut',hairColor:'#1a1a1a',

              beard:'goatee',clothes:'smart-casual',

              shoes:'loafers',accessory:'foreign-watch'},

    allowedClothes:['smart-casual','suit','foreign-brand'],

    allowedShoes:['loafers','dress-shoes','sneakers'],

    allowedHairColors:['#1a1a1a','#4a3728','#8B6914',

                       '#888888','#FFD700','#e74c3c'],

  },

};



export const SKIN_TONES = [

  {id:'tone1',color:'#FDDBB4',label:'Light'},

  {id:'tone2',color:'#D4956A',label:'Medium'},

  {id:'tone3',color:'#8D5524',label:'Brown'},

  {id:'tone4',color:'#4A2912',label:'Dark'},

  {id:'tone5',color:'#2C1A0E',label:'Deepest'},

];



export const HAIR_STYLES = [

  {id:'low-cut',label:'Low Cut'},

  {id:'fade',label:'Fade'},

  {id:'afro',label:'Afro'},

  {id:'dreadlocks',label:'Dreadlocks'},

  {id:'waves',label:'Waves'},

  {id:'bald',label:'Bald'},

  {id:'braids',label:'Braids'},

];



export const BEARD_STYLES = [

  {id:'clean',label:'Clean Shave'},

  {id:'stubble',label:'Stubble'},

  {id:'goatee',label:'Goatee'},

  {id:'full-beard',label:'Full Beard'},

];



export const CLOTHES_OPTIONS = [

  {id:'designer',label:'Designer Wear'},

  {id:'suit',label:'Suit'},

  {id:'smart-casual',label:'Smart Casual'},

  {id:'streetwear',label:'Street Wear'},

  {id:'foreign-brand',label:'Foreign Brand'},

  {id:'ankara',label:'Ankara'},

  {id:'agbada',label:'Agbada'},

  {id:'simple',label:'Simple Wear'},

];



export const SHOES_OPTIONS = [

  {id:'loafers',label:'Loafers'},

  {id:'dress-shoes',label:'Dress Shoes'},

  {id:'trainers',label:'Trainers'},

  {id:'sneakers',label:'Sneakers'},

  {id:'slippers',label:'Slippers'},

  {id:'sandals',label:'Sandals'},

  {id:'crocs',label:'Crocs'},

  {id:'boots',label:'Boots'},

];



export default class CharacterCreator {

  constructor() {

    this._resolve = null;

    this._slide   = 0;

    this._el      = null;

    this._track   = null;

    this._slides  = [];

    this._selected = {

      name:'', gender:'male',

      originId:'ajepako',

      skinTone:SKIN_TONES[2],

      hairStyle:'low-cut',

      hairColor:'#1a1a1a',

      beard:'clean',

      clothes:'streetwear',

      shoes:'trainers',

      photoURL:null,

      autoGenerated:false,

    };

  }



  open() {

    return new Promise(resolve => {

      this._resolve = resolve;

      this._build();

    });

  }



  _build() {

    const el = document.createElement('div');

    el.id = 'char-creator';

    Object.assign(el.style, {

      position:'fixed', inset:'0',

      background:

        'linear-gradient(135deg,#0a0a1a 0%,#1a0a00 100%)',

      zIndex:'20000', overflow:'hidden',

      fontFamily:'Arial, sans-serif',

    });

    this._el = el;



    const track = document.createElement('div');

    track.id = 'cc-track';

    Object.assign(track.style, {

      display:'flex', width:'300%',

      height:'100%',

      transition:

        'transform 0.4s cubic-bezier(0.4,0,0.2,1)',

    });

    this._track = track;

    el.appendChild(track);



    this._slides[0] = this._buildSlide1();

    this._slides[1] = this._buildSlide2();

    this._slides[2] = this._buildSlide3Shell();

    this._slides.forEach(s =>

      track.appendChild(s)

    );



    document.body.appendChild(el);

  }



  _makeSlideWrapper() {

    const div = document.createElement('div');

    Object.assign(div.style, {

      width:          'calc(100% / 3)',

      height:         '100%',

      display:        'flex',

      flexDirection:  'column',

      alignItems:     'center',

      justifyContent: 'flex-start',

      padding:        '8px 14px',

      boxSizing:      'border-box',

      overflowY:      'auto',

      overflowX:      'hidden',

      color:          '#FFD700',

      scrollbarWidth: 'none',

    });

    return div;

  }



  _makeProgressDots(active) {

    const wrap = document.createElement('div');

    Object.assign(wrap.style, {

      display:'flex', gap:'8px',

      marginBottom:'6px',

    });

    [0,1,2].forEach(i => {

      const dot = document.createElement('div');

      Object.assign(dot.style, {

        width: i===active ? '14px' : '6px',

        height:'5px', borderRadius:'4px',

        background: i===active

          ? '#FFD700' : 'rgba(255,215,0,0.3)',

        transition:'all 0.3s',

      });

      wrap.appendChild(dot);

    });

    return wrap;

  }



  _makeContinueBtn(onClick) {

    const btn = document.createElement('button');

    btn.id = 'cc-continue';

    Object.assign(btn.style, {

      marginTop:'8px', padding:'9px 22px',

      fontSize:'13px', fontWeight:'bold',

      background:'transparent',

      color:'#FFD700',

      border:'2px solid #FFD700',

      borderRadius:'30px', cursor:'pointer',

      display:'flex', alignItems:'center',

      gap:'10px', transition:'all 0.2s',

      animation:

        'glow-border 1.5s ease-in-out infinite alternate',

    });

    btn.innerHTML =

      'CONTINUE <span style="font-size:18px">→</span>';

    btn.addEventListener('mouseenter', () => {

      btn.style.background =

        'rgba(255,215,0,0.15)';

    });

    btn.addEventListener('mouseleave', () => {

      btn.style.background = 'transparent';

    });

    btn.addEventListener('click', onClick);

    btn.addEventListener('touchstart', e => {

      e.preventDefault(); onClick();

    }, {passive:false});

    return btn;

  }



  _makeBackBtn(onClick) {

    const btn = document.createElement('button');

    Object.assign(btn.style, {

      marginTop:'4px', padding:'5px 14px',

      fontSize:'11px',

      background:'transparent',

      color:'rgba(255,215,0,0.5)',

      border:'1px solid rgba(255,215,0,0.3)',

      borderRadius:'20px', cursor:'pointer',

    });

    btn.textContent = '← BACK';

    btn.addEventListener('click', onClick);

    btn.addEventListener('touchstart', e => {

      e.preventDefault(); onClick();

    }, {passive:false});

    return btn;

  }



  _buildSlide1() {

    const slide = this._makeSlideWrapper();

    slide.appendChild(

      this._makeProgressDots(0)

    );



    const title = document.createElement('h1');

    title.textContent = '🇳🇬 What is your name?';

    Object.assign(title.style, {

      fontSize:'clamp(18px,4vw,28px)',

      margin:'0 0 6px', textAlign:'center',

      textShadow:

        '0 0 20px rgba(255,215,0,0.4)',

    });

    slide.appendChild(title);



    const sub = document.createElement('p');

    sub.textContent =

      'You cannot start a Lagos life without a name';

    Object.assign(sub.style, {

      fontSize:'12px', color:'#888',

      margin:'0 0 20px', textAlign:'center',

    });

    slide.appendChild(sub);



    const input = document.createElement('input');

    input.type = 'text';

    input.placeholder = 'Enter your name...';

    input.maxLength = 20;

    input.id = 'cc-name-input';

    Object.assign(input.style, {

      width:'100%', maxWidth:'320px',

      padding:'12px 16px', fontSize:'18px',

      background:'rgba(255,255,255,0.08)',

      border:'2px solid rgba(255,215,0,0.4)',

      borderRadius:'10px', color:'#FFD700',

      outline:'none', textAlign:'center',

      boxSizing:'border-box',

      marginBottom:'8px',

    });

    input.addEventListener('focus', () => {

      input.style.borderColor = '#FFD700';

      input.style.boxShadow =

        '0 0 12px rgba(255,215,0,0.3)';

    });

    input.addEventListener('blur', () => {

      input.style.borderColor =

        'rgba(255,215,0,0.4)';

      input.style.boxShadow = 'none';

    });

    input.addEventListener('input', () => {

      this._selected.name = input.value.trim();

    });

    slide.appendChild(input);



    const errEl = document.createElement('div');

    errEl.id = 'cc-name-error';

    Object.assign(errEl.style, {

      color:'#E74C3C', fontSize:'12px',

      marginBottom:'8px', textAlign:'center',

      minHeight:'18px',

    });

    slide.appendChild(errEl);



    const gWrap = document.createElement('div');

    Object.assign(gWrap.style, {

      display:'flex', gap:'12px',

      marginBottom:'8px',

    });

    ['male','female'].forEach(g => {

      const btn = document.createElement('button');

      btn.dataset.gender = g;

      btn.textContent =

        g==='male' ? '👨 Male' : '👩 Female';

      Object.assign(btn.style, {

        padding:'10px 24px',

        borderRadius:'24px',

        border:'2px solid rgba(255,215,0,0.4)',

        background: g===this._selected.gender

          ? 'rgba(255,215,0,0.2)' : 'transparent',

        color:'#FFD700', fontSize:'14px',

        cursor:'pointer', transition:'all 0.2s',

      });

      btn.addEventListener('click', () => {

        this._selected.gender = g;

        gWrap.querySelectorAll('button')

          .forEach(b => {

            b.style.background =

              b.dataset.gender===g

                ? 'rgba(255,215,0,0.2)'

                : 'transparent';

          });

      });

      gWrap.appendChild(btn);

    });

    slide.appendChild(gWrap);



    slide.appendChild(

      this._makeContinueBtn(() => {

        const name = input.value.trim();

        if (!name || name.length < 2) {

          input.style.borderColor = '#E74C3C';

          input.style.boxShadow =

            '0 0 8px rgba(231,76,60,0.5)';

          errEl.textContent =

            '⚠️ Oga enter your name first!';

          input.focus();

          setTimeout(() => {

            input.style.borderColor =

              'rgba(255,215,0,0.4)';

            input.style.boxShadow = 'none';

            errEl.textContent = '';

          }, 2500);

          return;

        }

        this._selected.name = name;

        this._goToSlide(1);

      })

    );



    return slide;

  }



  _buildSlide2() {

    const slide = this._makeSlideWrapper();

    slide.appendChild(

      this._makeProgressDots(1)

    );



    const title = document.createElement('h2');

    title.textContent = '🏙️ Who are you in Lagos?';

    Object.assign(title.style, {

      fontSize:'clamp(16px,3vw,24px)',

      margin:'3px 0 7px', textAlign:'center',

    });

    slide.appendChild(title);



    // Origin cards grid

    const grid = document.createElement('div');

    Object.assign(grid.style, {

      display:'grid',

      gridTemplateColumns:

        'repeat(5,1fr)',

      gap:'4px', width:'100%', maxWidth:'660px',

    });



    Object.values(ORIGINS).forEach(origin => {

      const card = document.createElement('div');

      card.dataset.oid = origin.id;

      const sel =

        this._selected.originId === origin.id;

      Object.assign(card.style, {

        background: sel

          ? 'rgba(255,215,0,0.12)'

          : 'rgba(255,255,255,0.04)',

        border: sel

          ? `2px solid ${origin.color}`

          : '2px solid rgba(255,255,255,0.1)',

        borderRadius:'10px',

        padding:'10px',

        cursor:'pointer',

        transition:'all 0.2s',

        userSelect:'none',

      });

      card.innerHTML = `

        <div style="font-size:17px;

                    margin-bottom:2px">

          ${origin.emoji}

        </div>

        <div style="font-size:11px;

                    font-weight:bold;

                    color:${origin.color};

                    margin-bottom:1px">

          ${origin.name}

        </div>

        <div style="font-size:9px;color:#555">

          ${origin.difficulty}

        </div>

        <div style="font-size:9px;color:#444">

          ${'\u20A6'}${(origin.startMoney/1000)

            .toFixed(0)}k

        </div>

      `;

      card.addEventListener('click', () => {

        this._selected.originId = origin.id;

        grid.querySelectorAll('[data-oid]')

          .forEach(c => {

            const o = ORIGINS[c.dataset.oid];

            const s =

              c.dataset.oid === origin.id;

            c.style.background = s

              ? 'rgba(255,215,0,0.12)'

              : 'rgba(255,255,255,0.04)';

            c.style.border = s

              ? `2px solid ${o.color}`

              : '2px solid rgba(255,255,255,0.1)';

          });

        this._updateStatsPreview(statsEl);

      });

      grid.appendChild(card);

    });

    slide.appendChild(grid);



    // Stats preview panel

    const statsEl = document.createElement('div');

    statsEl.id = 'cc-stats-preview';

    Object.assign(statsEl.style, {

      marginTop:'5px', padding:'5px 8px',

      background:'rgba(255,255,255,0.04)',

      borderRadius:'8px',

      width:'100%', maxWidth:'660px',

      fontSize:'10px',

    });

    this._updateStatsPreview(statsEl);

    slide.appendChild(statsEl);



    // Buttons row

    const btnRow = document.createElement('div');

    Object.assign(btnRow.style, {

      display:'flex', gap:'12px',

      alignItems:'center', marginTop:'4px',

    });

    btnRow.appendChild(

      this._makeBackBtn(() => this._goToSlide(0))

    );

    btnRow.appendChild(

      this._makeContinueBtn(

        () => this._goToSlide(2)

      )

    );

    slide.appendChild(btnRow);



    return slide;

  }



  _updateStatsPreview(el) {

    const origin =

      ORIGINS[this._selected.originId];

    const s = origin.stats;

    const bars = Object.entries(s).map(

      ([k, v]) => {

        const c =

          v >= 75 ? '#2ECC71' :

          v >= 45 ? '#FFD700' : '#E74C3C';

        return `

          <div style="display:flex;gap:4px;

                      align-items:center;

                      margin-bottom:2px">

            <span style="color:#666;

                         font-size:9px;

                         min-width:58px;

                         text-transform:capitalize">

              ${k}

            </span>

            <div style="flex:1;height:4px;

                        background:rgba(255,255,255,0.08);

                        border-radius:2px;

                        overflow:hidden">

              <div style="width:${v}%;

                          height:100%;

                          background:${c};

                          border-radius:2px">

              </div>

            </div>

            <span style="color:${c};

                         font-size:9px;

                         min-width:20px">

              ${v}

            </span>

          </div>`;

      }

    ).join('');

    el.innerHTML = `

      <div style="color:${origin.color};

                  font-weight:bold;

                  margin-bottom:3px;

                  font-size:10px">

        ${origin.emoji} ${origin.name} —

        ${origin.startArea}

      </div>${bars}

    `;

  }



  _buildSlide3Shell() {

    const slide = this._makeSlideWrapper();

    slide.appendChild(

      this._makeProgressDots(2)

    );



    const title = document.createElement('h2');

    title.textContent = '🎨 Create Your Character';

    Object.assign(title.style, {

      fontSize:'clamp(15px,3vw,22px)',

      margin:'0 0 14px', textAlign:'center',

    });

    slide.appendChild(title);



    // ── Photo upload circle ─────────────────

    const photoWrap =

      document.createElement('div');

    Object.assign(photoWrap.style, {

      display:'flex', flexDirection:'column',

      alignItems:'center', marginBottom:'12px',

    });



    const photoCircle =

      document.createElement('div');

    photoCircle.id = 'cc-photo-circle';

    Object.assign(photoCircle.style, {

      width:'72px', height:'72px',

      borderRadius:'50%',

      background:'rgba(255,255,255,0.07)',

      border:'2px dashed rgba(255,215,0,0.5)',

      display:'flex', flexDirection:'column',

      alignItems:'center',

      justifyContent:'center',

      cursor:'pointer', overflow:'hidden',

      marginBottom:'5px', position:'relative',

      transition:'border-color 0.2s',

    });

    photoCircle.innerHTML = `

      <span style="font-size:22px">📷</span>

      <span style="font-size:9px;

                   color:rgba(255,215,0,0.6);

                   margin-top:2px">

        Add Photo

      </span>

    `;



    const fileInput =

      document.createElement('input');

    fileInput.type   = 'file';

    fileInput.accept = 'image/*';

    fileInput.id     = 'cc-photo-input';

    fileInput.style.display = 'none';



    fileInput.addEventListener('change', e => {

      const file = e.target.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onload = ev => {

        const url = ev.target.result;

        this._selected.photoURL = url;

        photoCircle.innerHTML = `

          <img src="${url}"

               style="width:100%;height:100%;

                      object-fit:cover;

                      border-radius:50%">

        `;

        const av =

          document.getElementById('hud-avatar');

        if (av) {

          av.innerHTML = `

            <img src="${url}"

                 style="width:100%;height:100%;

                        object-fit:cover;

                        border-radius:50%">

          `;

        }

      };

      reader.readAsDataURL(file);

    });



    photoCircle.addEventListener('click',

      () => this._showPhotoPicker(fileInput)

    );

    photoCircle.addEventListener('touchstart',

      e => {

        e.preventDefault();

        this._showPhotoPicker(fileInput);

      }, {passive:false}

    );



    photoWrap.appendChild(photoCircle);

    photoWrap.appendChild(fileInput);



    const photoHint =

      document.createElement('div');

    photoHint.textContent =

      'Tap to add your photo (optional)';

    Object.assign(photoHint.style, {

      fontSize:'10px', color:'#555',

    });

    photoWrap.appendChild(photoHint);

    slide.appendChild(photoWrap);



    // ── Skin tone selector ──────────────────

    const skinRow =

      document.createElement('div');

    Object.assign(skinRow.style, {

      display:'flex', alignItems:'center',

      gap:'7px', marginBottom:'12px',

    });

    const skinLabel =

      document.createElement('span');

    skinLabel.textContent = 'Skin:';

    Object.assign(skinLabel.style, {

      fontSize:'12px', color:'#888',

    });

    skinRow.appendChild(skinLabel);



    SKIN_TONES.forEach(tone => {

      const dot = document.createElement('div');

      dot.title = tone.label;

      Object.assign(dot.style, {

        width:'24px', height:'24px',

        borderRadius:'50%',

        background:tone.color,

        cursor:'pointer',

        border:

          this._selected.skinTone.id===tone.id

            ? '3px solid #FFD700'

            : '3px solid transparent',

        transition:'all 0.2s',

        flexShrink:'0',

      });

      dot.addEventListener('click', () => {

        this._selected.skinTone = tone;

        skinRow.querySelectorAll('div')

          .forEach(d => {

            d.style.border =

              '3px solid transparent';

            d.style.transform = 'scale(1)';

          });

        dot.style.border = '3px solid #FFD700';

        dot.style.transform = 'scale(1.15)';

      });

      skinRow.appendChild(dot);

    });

    slide.appendChild(skinRow);



    // ── Appearance placeholder ──────────────

    const placeholder =

      document.createElement('div');

    Object.assign(placeholder.style, {

      width:'100%', maxWidth:'480px',

      padding:'10px',

      background:'rgba(255,255,255,0.03)',

      borderRadius:'8px',

      color:'#444', fontSize:'11px',

      textAlign:'center', marginBottom:'12px',

    });

    placeholder.textContent =

      'Hair • Beard • Clothes • Shoes — Coming soon';

    slide.appendChild(placeholder);



    // ── Start button ────────────────────────

    const startBtn =

      document.createElement('button');

    startBtn.id = 'cc-start-btn';

    startBtn.textContent = '🚀 Start My Lagos Life';

    Object.assign(startBtn.style, {

      padding:'13px 32px',

      fontSize:'clamp(13px,2.5vw,16px)',

      fontWeight:'bold',

      background:'#FFD700', color:'#000',

      border:'none', borderRadius:'30px',

      cursor:'pointer',

      boxShadow:

        '0 4px 20px rgba(255,215,0,0.4)',

      transition:'transform 0.1s',

    });

    startBtn.addEventListener('mouseenter',

      () => {

        startBtn.style.transform = 'scale(1.04)';

      }

    );

    startBtn.addEventListener('mouseleave',

      () => {

        startBtn.style.transform = 'scale(1)';

      }

    );

    startBtn.addEventListener('click',

      () => this._submit()

    );

    startBtn.addEventListener('touchstart',

      e => {

        e.preventDefault();

        this._submit();

      }, {passive:false}

    );

    slide.appendChild(startBtn);



    slide.appendChild(

      this._makeBackBtn(

        () => this._goToSlide(1)

      )

    );



    return slide;

  }



  _goToSlide(index) {

    this._slide = index;

    this._track.style.transform =

      `translateX(-${index * (100/3)}%)`;

    if (index === 2) {

      setTimeout(

        () => this._showAutoGeneratePopup(),

        420

      );

    }

  }



  _showPhotoPicker(fileInput) {

    document.getElementById('cc-photo-picker')

      ?.remove();

    const picker =

      document.createElement('div');

    picker.id = 'cc-photo-picker';

    Object.assign(picker.style, {

      position:'fixed', bottom:'0',

      left:'0', right:'0',

      background:'rgba(10,10,26,0.98)',

      border:

        '1px solid rgba(255,215,0,0.3)',

      borderRadius:'16px 16px 0 0',

      padding:'20px', zIndex:'21000',

      display:'flex', flexDirection:'column',

      gap:'10px', fontFamily:'Arial,sans-serif',

    });

    const ptitle =

      document.createElement('div');

    ptitle.textContent = 'Add your photo';

    Object.assign(ptitle.style, {

      color:'#FFD700', fontSize:'15px',

      fontWeight:'bold', textAlign:'center',

      marginBottom:'4px',

    });

    picker.appendChild(ptitle);



    const mkBtn = (text, onClick) => {

      const b = document.createElement('button');

      b.textContent = text;

      Object.assign(b.style, {

        padding:'13px', fontSize:'14px',

        background:'rgba(255,215,0,0.1)',

        color:'#FFD700',

        border:'1px solid rgba(255,215,0,0.3)',

        borderRadius:'10px',

        cursor:'pointer', width:'100%',

      });

      b.addEventListener('click', onClick);

      return b;

    };



    picker.appendChild(mkBtn(

      '📸 Take Photo', () => {

        picker.remove();

        fileInput.setAttribute(

          'capture','environment'

        );

        fileInput.click();

      }

    ));

    picker.appendChild(mkBtn(

      '🖼️ Choose from Gallery', () => {

        picker.remove();

        fileInput.removeAttribute('capture');

        fileInput.click();

      }

    ));



    const cancel =

      document.createElement('button');

    cancel.textContent = 'Cancel';

    Object.assign(cancel.style, {

      padding:'11px', fontSize:'13px',

      background:'transparent', color:'#666',

      border:'none', cursor:'pointer',

      width:'100%',

    });

    cancel.addEventListener('click',

      () => picker.remove()

    );

    picker.appendChild(cancel);

    document.body.appendChild(picker);

  }



  _showAutoGeneratePopup() {

    if (document.getElementById(

      'cc-autogen-popup'

    )) return;



    const overlay =

      document.createElement('div');

    overlay.id = 'cc-autogen-popup';

    Object.assign(overlay.style, {

      position:'fixed', inset:'0',

      background:'rgba(0,0,0,0.85)',

      zIndex:'21000', display:'flex',

      alignItems:'center',

      justifyContent:'center',

      padding:'20px',

      fontFamily:'Arial,sans-serif',

    });



    const box = document.createElement('div');

    Object.assign(box.style, {

      background:'#0f0f1e',

      border:'2px solid #FFD700',

      borderRadius:'16px', padding:'24px',

      maxWidth:'300px', width:'100%',

      textAlign:'center',

    });



    const origin =

      ORIGINS[this._selected.originId];

    box.innerHTML = `

      <div style="font-size:30px;

                  margin-bottom:10px">🎮</div>

      <div style="font-size:15px;

                  font-weight:bold;

                  color:#FFD700;

                  margin-bottom:8px">

        Character Style

      </div>

      <div style="font-size:12px;color:#aaa;

                  line-height:1.5;

                  margin-bottom:18px">

        Want us to build your character

        based on your

        <strong style="color:${origin.color}">

          ${origin.name}

        </strong>

        personality?

      </div>

    `;



    const autoBtn =

      document.createElement('button');

    autoBtn.textContent = '✨ Auto-Generate';

    Object.assign(autoBtn.style, {

      display:'block', width:'100%',

      padding:'12px', marginBottom:'8px',

      fontSize:'14px', fontWeight:'bold',

      background:'#FFD700', color:'#000',

      border:'none', borderRadius:'10px',

      cursor:'pointer',

    });

    autoBtn.addEventListener('click', () => {

      this._autoGenerate();

      overlay.remove();

    });

    box.appendChild(autoBtn);



    const manualBtn =

      document.createElement('button');

    manualBtn.textContent = '🎨 Manual Creation';

    Object.assign(manualBtn.style, {

      display:'block', width:'100%',

      padding:'12px', fontSize:'13px',

      background:'transparent',

      color:'#FFD700',

      border:'1px solid rgba(255,215,0,0.4)',

      borderRadius:'10px', cursor:'pointer',

    });

    manualBtn.addEventListener('click', () => {

      this._selected.autoGenerated = false;

      overlay.remove();

    });

    box.appendChild(manualBtn);



    overlay.appendChild(box);

    document.body.appendChild(overlay);

  }



  _autoGenerate() {

    const origin =

      ORIGINS[this._selected.originId];

    const look = origin.autoLook;

    this._selected.hairStyle  = look.hair;

    this._selected.hairColor  = look.hairColor;

    this._selected.beard      = look.beard;

    this._selected.clothes    = look.clothes;

    this._selected.shoes      = look.shoes;

    this._selected.autoGenerated = true;

    this._selected.skinTone   = SKIN_TONES[2];

    console.log(

      'Auto-generated:', this._selected

    );

  }



  _submit() {

    const result = {

      name:    this._selected.name,

      gender:  this._selected.gender,

      origin:  ORIGINS[this._selected.originId],

      skinTone:this._selected.skinTone,

      hairStyle:    this._selected.hairStyle,

      hairColor:    this._selected.hairColor,

      beard:        this._selected.beard,

      clothes:      this._selected.clothes,

      shoes:        this._selected.shoes,

      photoURL:     this._selected.photoURL,

      autoGenerated:this._selected.autoGenerated,

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

