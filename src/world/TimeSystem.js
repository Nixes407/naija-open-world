import * as THREE from 'three';

/**
 * TimeSystem.js
 * ---------------------------------------------------------------------------
 * The world clock. A full 24 in-game hour day/night cycle takes 24 real
 * minutes, i.e. 1 in-game hour per real minute (1440 real seconds per day),
 * so the sun visibly rises and sets during a normal play session.
 *
 * It owns no rendering: `update()` advances the clock and `environment()`
 * returns a plain description of the sky state that `core/Renderer.js`
 * translates into sky colours, sun position and light intensities.
 */

/** Real seconds for a full 24-hour in-game day (24 real minutes). */
export const DAY_LENGTH_SECONDS = 24 * 60;

/** In-game hour the world starts at (just before sunrise). */
export const START_HOUR = 6;

/** Seconds of real time per in-game hour. */
export const SECONDS_PER_GAME_HOUR = DAY_LENGTH_SECONDS / 24;

/** Cycle for the T key: time multipliers. */
export const TIME_SCALE_STEPS = [1, 2, 5, 20, 60];

const PHASES = [
  { until: 5, name: 'Night' },
  { until: 7, name: 'Dawn' }, // sun climbing over the horizon
  { until: 12, name: 'Morning' },
  { until: 15, name: 'Midday' },
  { until: 17.5, name: 'Afternoon' },
  { until: 19.5, name: 'Dusk' }, // sun dropping back to the horizon
  { until: 21, name: 'Evening' },
  { until: 24.001, name: 'Night' },
];

export class TimeSystem {
  /**
   * @param {object} [options]
   * @param {number} [options.startHour=START_HOUR]
   * @param {number} [options.dayLengthSeconds=DAY_LENGTH_SECONDS]
   * @param {number} [options.timeScale=1] multiplier on the real-time flow
   */
  constructor({ startHour = START_HOUR, dayLengthSeconds = DAY_LENGTH_SECONDS, timeScale = 1 } = {}) {
    this.dayLengthSeconds = dayLengthSeconds;
    this.startHour = startHour;
    this.timeScale = timeScale;

    /** Hours since midnight, 0..24. */
    this.hours = startHour;
    /** Whole days elapsed since the world started. */
    this.day = 1;

    /** Unit vector pointing from the world *towards* the sun. */
    this.sunDirection = new THREE.Vector3();
    /** Sine of the sun angle: < 0 below the horizon, 1 straight overhead. */
    this.elevation = 0;
    /** 0 at night, 1 in broad daylight. */
    this.daylight = 0;
    /** Peaks at 1 while the sun sits on the horizon (sunrise / sunset). */
    this.twilight = 0;
    /** 1 - daylight. */
    this.nightness = 1;
    /** Human readable phase name, e.g. "Dawn". */
    this.phase = 'Dawn';

    this._sunriseFlag = false;
    this._sunsetFlag = false;
    this._onEvent = null;
    this._env = {
      hours: this.hours,
      day: this.day,
      phase: this.phase,
      sunDirection: new THREE.Vector3(0, 1, 0),
      elevation: 0,
      daylight: 0,
      twilight: 0,
      nightness: 1,
      timeScale: this.timeScale,
    };

    this._recompute();
    this.environment();
  }

  /** Optional callback: ({ type: 'sunrise' | 'sunset' | 'newDay', ... }) => void */
  onEvent(callback) {
    this._onEvent = callback;
  }

  /**
   * Advance the clock.
   * @param {number} deltaSeconds real seconds since the last frame
   */
  update(deltaSeconds) {
    // Guard against the huge dt produced by a backgrounded tab.
    const dt = Math.min(deltaSeconds, 0.1) * this.timeScale;
    const hoursPerSecond = 24 / this.dayLengthSeconds;

    const previous = this.hours;
    this.hours += dt * hoursPerSecond;

    if (this.hours >= 24) {
      this.hours %= 24;
      this.day += 1;
      this._emit({ type: 'newDay', day: this.day });
      this._sunriseFlag = false;
      this._sunsetFlag = false;
    }

    this._recompute();

    // Discrete events, fired once each per day.
    if (!this._sunriseFlag && previous < 6 && this.hours >= 6) {
      this._sunriseFlag = true;
      this._emit({ type: 'sunrise', hour: this.hours });
    }
    if (!this._sunsetFlag && previous < 18 && this.hours >= 18) {
      this._sunsetFlag = true;
      this._emit({ type: 'sunset', hour: this.hours });
    }
  }

  /** Cycle through the time-speed multipliers (T key). */
  cycleTimeScale() {
    const index = TIME_SCALE_STEPS.indexOf(this.timeScale);
    const next = index === -1 ? 0 : (index + 1) % TIME_SCALE_STEPS.length;
    this.timeScale = TIME_SCALE_STEPS[next];
    return this.timeScale;
  }

  setHours(hours) {
    this.hours = ((hours % 24) + 24) % 24;
    this._recompute();
  }

  /* ------------------------------------------------------------------------ */

  _recompute() {
    // Sun path: rises in the east at 06:00, peaks at noon, sets in the west at
    // 18:00, then continues below the horizon through the night.
    const theta = ((this.hours - 6) / 12) * Math.PI;

    // Slight constant north/south tilt keeps shadows from collapsing to a
    // perfectly vertical line at noon.
    this.sunDirection
      .set(Math.cos(theta), Math.sin(theta), 0.28 + 0.1 * Math.cos(theta))
      .normalize();

    this.elevation = this.sunDirection.y;
    // The ramp deliberately runs well past the horizon: the sky stays lit for
    // the ~25 real seconds of civil twilight after sunset instead of snapping
    // to night the moment the sun touches the ground.
    this.daylight = smoothstep(-0.32, 0.18, this.elevation);
    this.nightness = 1 - this.daylight;

    const horizonProximity = Math.max(0, 1 - Math.abs(this.elevation) / 0.3);
    const aboveHorizonFade = smoothstep(-0.45, -0.1, this.elevation);
    this.twilight = horizonProximity * aboveHorizonFade;

    this.phase = PHASES.find((entry) => this.hours < entry.until)?.name ?? 'Night';
  }

  _emit(event) {
    if (this._onEvent) this._onEvent(event);
  }

  /* ------------------------------- Read-only API ---------------------------- */

  /** e.g. "06:32 AM" - the HUD clock string. */
  formatTime() {
    const totalMinutes = Math.floor(this.hours * 60);
    const minutes = totalMinutes % 60;
    const rawHours = Math.floor(totalMinutes / 60) % 24;
    const period = rawHours < 12 ? 'AM' : 'PM';
    const hours12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  /** e.g. "06:32" (24h, used for debugging). */
  formatTime24() {
    const totalMinutes = Math.floor(this.hours * 60);
    const minutes = totalMinutes % 60;
    const rawHours = Math.floor(totalMinutes / 60) % 24;
    return `${String(rawHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * A snapshot of everything the renderer needs to dress the world. The object
   * and its vectors are reused every frame (keeps the loop allocation-free) -
   * read it, don't store it.
   */
  environment() {
    const env = this._env;
    env.hours = this.hours;
    env.day = this.day;
    env.phase = this.phase;
    env.sunDirection.copy(this.sunDirection); // Vector3 towards the sun
    env.elevation = this.elevation;
    env.daylight = this.daylight;
    env.twilight = this.twilight;
    env.nightness = this.nightness;
    env.timeScale = this.timeScale;
    return env;
  }
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0 || 1e-6), 0), 1);
  return t * t * (3 - 2 * t);
}
