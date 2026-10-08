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

      width:'calc(100% / 3)',

      height:'100%',

      display:'flex',

      flexDirection:'column',

      alignItems:'center',

      justifyContent:'center',

      padding:'20px',

      boxSizing:'border-box',

      overflowY:'auto',

      color:'#FFD700',

    });

    return div;

  }



  _makeProgressDots(active) {

    const wrap = document.createElement('div');

    Object.assign(wrap.style, {

      display:'flex', gap:'8px',

      marginBottom:'20px',

    });

    [0,1,2].forEach(i => {

      const dot = document.createElement('div');

      Object.assign(dot.style, {

        width: i===active ? '20px' : '8px',

        height:'8px', borderRadius:'4px',

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

      marginTop:'20px', padding:'12px 32px',

      fontSize:'15px', fontWeight:'bold',

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

      marginTop:'10px', padding:'8px 20px',

      fontSize:'13px',

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

    const t = document.createElement('p');

    t.textContent = 'Slide 2 — coming next';

    t.style.color = '#FFD700';

    slide.appendChild(t);

    return slide;

  }



  _buildSlide3Shell() {

    const slide = this._makeSlideWrapper();

    slide.appendChild(

      this._makeProgressDots(2)

    );

    const t = document.createElement('p');

    t.textContent = 'Slide 3 — coming next';

    t.style.color = '#FFD700';

    slide.appendChild(t);

    return slide;

  }



  _goToSlide(index) {

    this._slide = index;

    this._track.style.transform =

      `translateX(-${index * (100/3)}%)`;

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

