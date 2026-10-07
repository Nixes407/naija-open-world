import { SKIN_TONES } from '../ui/CharacterCreator.js';


const clamp = (v, min = 0, max = 100) =>

  Math.max(min, Math.min(max, v));


export default class PlayerState {

  constructor() {

    this._data      = null;

    this._listeners = [];

  }


  init(creatorResult) {

    const origin = creatorResult.origin;

    this._data = {

      name:       creatorResult.name,

      gender:     creatorResult.gender,

      skinTone:   creatorResult.skinTone,

      originId:   origin.id,

      originName: origin.name,


      moneyKobo: origin.startMoney * 100,


      health:     clamp(origin.stats.health),

      energy:     clamp(origin.stats.energy),

      sanity:     clamp(origin.stats.sanity),

      reputation: clamp(origin.stats.reputation),

      streetCred: clamp(origin.stats.streetCred),

      education:  clamp(origin.stats.education),


      hunger:       100,

      thirst:       100,

      phoneBattery: 100,

      dataBalance:  200,


      dayNumber:           1,

      inGameHour:          6,

      hasGenerator:        false,

      generatorFuelLitres: 0,

      hasInverter:         false,

      inverterCharge:      0,

      powerIsOn:           false,


      currentJob:  null,

      jobLevel:    0,

      experience:  0,


      housing:  'none',

      rentOwed: 0,


      inventory: [],


      tutorialDone: false,

      isAlive:      true,

    };


    this._emit('init', this._data);

    return this;

  }


  get money() {

    return this._data.moneyKobo / 100;

  }


  get moneyFormatted() {

    return '₦' + this.money.toLocaleString('en-NG', {

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,

    });

  }


  canAfford(naira) {

    return this._data.moneyKobo >= naira * 100;

  }


  spend(naira) {

    if (!this.canAfford(naira)) return false;

    this._data.moneyKobo -= naira * 100;

    this._emit('money', this.money);

    return true;

  }


  earn(naira) {

    this._data.moneyKobo += naira * 100;

    this._emit('money', this.money);

  }


  setStat(key, value) {

    if (!(key in this._data)) return;

    this._data[key] = clamp(value);

    this._emit('stat', {

      key, value: this._data[key]

    });

    if (key === 'health' && this._data[key] <= 0) {

      this._data.isAlive = false;

      this._emit('death', this._data);

    }

  }


  modStat(key, delta) {

    this.setStat(

      key, (this._data[key] ?? 0) + delta

    );

  }


  getStat(key) {

    return this._data?.[key] ?? 0;

  }


  get(key) {

    return this._data?.[key];

  }


  set(key, value) {

    this._data[key] = value;

    this._emit('update', { key, value });

  }


  on(event, fn) {

    this._listeners.push({ event, fn });

    return () => {

      this._listeners =

        this._listeners.filter(l => l.fn !== fn);

    };

  }


  _emit(event, data) {

    this._listeners

      .filter(l =>

        l.event === event || l.event === '*'

      )

      .forEach(l => l.fn(data));

  }


  toJSON() {

    return JSON.parse(JSON.stringify(this._data));

  }


  fromJSON(data) {

    this._data = data;

    this._emit('loaded', this._data);

  }


  debug() {

    console.table(this._data);

  }

}
