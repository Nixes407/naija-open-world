import OrientationGuard from './ui/OrientationGuard.js';
import MobileControls from './ui/MobileControls.js';
import FullscreenManager from './ui/FullscreenManager.js';
import WorldBuilder from './world/WorldBuilder.js';
import RoadNetwork  from './world/RoadNetwork.js';
import WaterSystem from './world/WaterSystem.js';
import Landmarks  from './world/Landmarks.js';
import StreetFurniture from './world/StreetFurniture.js';
import AmbientDetails  from './world/AmbientDetails.js';
import { Renderer } from './core/Renderer.js';
import { InputManager } from './core/InputManager.js';
import { CharacterController } from './player/CharacterController.js';
import { TimeSystem } from './world/TimeSystem.js';

/**
 * main.js
 * ---------------------------------------------------------------------------
 * Naija Open World - Sprint 1 entry point.
 *
 * Wires the four systems together and runs the frame loop in a fixed order:
 *   time -> input/player physics -> camera -> environment -> render -> HUD
 */

/* -------------------------------------------------------------------------- */
/* DOM                                                                         */
/* -------------------------------------------------------------------------- */

const canvas = document.getElementById('game-canvas');
const overlay = document.getElementById('overlay');
const hudTime = document.getElementById('hud-time');

// Hide desktop clock on mobile -
// MobileControls time chip takes over
if ('ontouchstart' in window ||
     navigator.maxTouchPoints > 0) {
  const desktopClock = hudTime;
  if (desktopClock) {
    desktopClock.style.display = 'none';
    // The clock's panel (label + phase/day row) would otherwise sit directly
    // under the MENU / MAP buttons, which are pinned to the same corner.
    const desktopClockPanel = desktopClock.closest('#hud-clock');
    if (desktopClockPanel) desktopClockPanel.style.display = 'none';
  }
}

const hudPhase = document.getElementById('hud-phase');
const hudDay = document.getElementById('hud-day');
const hudFps = document.getElementById('hud-fps');
const hudStats = document.getElementById('hud-stats');

/* -------------------------------------------------------------------------- */
/* Systems                                                                     */
/* -------------------------------------------------------------------------- */

const renderer = new Renderer(canvas);
const input = new InputManager(canvas);
const time = new TimeSystem({ startHour: 6, timeScale: 1 });
const mobileControls = new MobileControls();
const player = new CharacterController({
  renderer, input, mobileControls,
});
const orientationGuard = new OrientationGuard();
orientationGuard.startListening();

// Self-contained: builds its own top-centre toggle button and listens for
// fullscreenchange to keep the icon in sync. It also receives the
// orientationGuard so it can request the landscape lock the moment the page
// actually enters fullscreen - lock() only succeeds from fullscreen, which is
// what makes Android auto-rotate work.
const fullscreen = new FullscreenManager(
  orientationGuard
);

// ── Build Lagos city ──
const CITY_CONFIG = {
  gridCols:  8,
  gridRows:  8,
  blockSize: 40,
  roadWidth: 10,
};

const worldBuilder = new WorldBuilder(
  renderer.scene
);
worldBuilder.build(CITY_CONFIG);

const roadNetwork = new RoadNetwork(
  renderer.scene
);
roadNetwork.build(CITY_CONFIG);

// ── Lagos Lagoon ──
const waterSystem = new WaterSystem(renderer.scene);
waterSystem.build({
  width:  500,
  length: 300,
  x:      0,
  z:      260,
});

// ── Hero landmarks ──
const landmarks = new Landmarks(renderer.scene);
landmarks.build({
  cityOffsetX: 0,
  cityOffsetZ: 0,
});

const streetFurniture = new StreetFurniture(
  renderer.scene
);
streetFurniture.build(CITY_CONFIG);

const ambientDetails = new AmbientDetails(
  renderer.scene
);
ambientDetails.build(CITY_CONFIG);

// Debug handle from the browser console:
//   Naija.time.setHours(18.4)   - jump to sunset
//   Naija.player.respawn(20, 20)
//   Naija.renderer.setQualityTier(0)
window.Naija = { renderer, input, time, player, mobileControls };

/* -------------------------------------------------------------------------- */
/* Resize                                                                      */
/* -------------------------------------------------------------------------- */

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('orientationchange', () => renderer.resize());

/* -------------------------------------------------------------------------- */
/* Pointer lock / start overlay                                                */
/* -------------------------------------------------------------------------- */

function startPlaying() {
  overlay.classList.add('hidden');
  // The mobile look zone is built with pointer-events:none precisely so it
  // cannot swallow the tap that starts the game. Now that the overlay is out
  // of the way, switch camera-look capture on. No-op on desktop.
  mobileControls.enable();
  input.requestPointerLock();
}

overlay.addEventListener('click', startPlaying);
canvas.addEventListener('click', startPlaying);

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  overlay.classList.toggle('hidden', locked);
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') overlay.classList.remove('hidden');
  if (event.code === 'KeyR') player.respawn(0, 0);
  if (event.code === 'KeyT') {
    console.info(`[Naija] Time speed x${time.cycleTimeScale()}`);
  }
});

/* -------------------------------------------------------------------------- */
/* HUD                                                                         */
/* -------------------------------------------------------------------------- */

const FPS_SAMPLE_SECONDS = 0.5;
let fpsAccumulator = 0;
let fpsFrames = 0;
let hudAccumulator = 0;

/**
 * Adaptive quality: the game targets 60fps and must never sit under 30fps.
 * When the measured framerate stays low the renderer steps down a quality tier
 * (shadow resolution, then resolution scale, then shadows off) and steps back
 * up again once there is headroom.
 */
const quality = {
  smoothedFps: 60,
  cooldown: 3,
};

function updateFps(dt) {
  fpsAccumulator += dt;
  fpsFrames += 1;
  if (fpsAccumulator < FPS_SAMPLE_SECONDS) return;

  const fps = fpsFrames / fpsAccumulator;
  fpsAccumulator = 0;
  fpsFrames = 0;

  quality.smoothedFps = quality.smoothedFps * 0.5 + fps * 0.5;
  quality.cooldown -= FPS_SAMPLE_SECONDS;
  if (quality.cooldown > 0) return;

  const lastTier = Renderer.QUALITY_TIERS.length - 1;
  if (quality.smoothedFps < 45 && renderer.qualityTier < lastTier) {
    renderer.setQualityTier(renderer.qualityTier + 1);
    quality.cooldown = 3;
    console.info(`[Naija] Quality -> ${renderer.quality} (${quality.smoothedFps.toFixed(0)} fps)`);
  } else if (quality.smoothedFps > 58 && renderer.qualityTier > 0) {
    renderer.setQualityTier(renderer.qualityTier - 1);
    quality.cooldown = 10;
    console.info(`[Naija] Quality -> ${renderer.quality} (${quality.smoothedFps.toFixed(0)} fps)`);
  }
}

function updateClockHud(dt) {
  hudAccumulator += dt;
  if (hudAccumulator < 0.25) return; // ~4 updates a second is plenty
  hudAccumulator = 0;

  hudTime.textContent = time.formatTime();
  hudPhase.textContent = time.phase;
  hudDay.textContent = `Day ${time.day}`;
  hudStats.innerHTML = `<b>${Math.round(quality.smoothedFps)}</b> fps &middot; ${renderer.quality}`;
}

/* -------------------------------------------------------------------------- */
/* Frame loop                                                                  */
/* -------------------------------------------------------------------------- */

let lastTime = performance.now();

function frame(now) {
  requestAnimationFrame(frame);

  // Clamp dt so a backgrounded tab or a slow frame cannot teleport the player.
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // 1. World clock.
  time.update(dt);
  const env = time.environment();

  // 2. Player: input -> physics -> capsule transform -> third-person camera.
  player.update(dt, env);

  // 3. Sky, fog, sun, stars, shadows all follow the sun's position.
  renderer.updateEnvironment(env, player.position);

  waterSystem.update();

  // 4. Draw.
  renderer.render();

  // 5. Mobile overlay: mirror the world clock into the on-screen time chip.
  //    TimeSystem exposes formatTime() (e.g. "06:32 AM") - there is no
  //    getTimeString() on TimeSystem.
  if (mobileControls.isActive()) {
    const timeStr = time.formatTime?.() ?? '';
    mobileControls.updateTimeDisplay(timeStr);
  }

  // 6. HUD + per-frame input bookkeeping.
  updateFps(dt);
  updateClockHud(dt);
  input.endFrame();
}

/* -------------------------------------------------------------------------- */
/* Boot                                                                        */
/* -------------------------------------------------------------------------- */

function boot() {
  renderer.resize();
  renderer.updateEnvironment(time.environment(), player.position);

  hudTime.textContent = time.formatTime();
  hudPhase.textContent = time.phase;
  hudDay.textContent = `Day ${time.day}`;

  canvas.focus();
  requestAnimationFrame(frame);

  console.info(
    '%cNaija Open World%c Sprint 1 - Lagos prototype ready. Click the world to capture the mouse.',
    'color:#FFD700;font-weight:bold',
    'color:inherit',
  );
}

boot();
