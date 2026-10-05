# Naija Open World 🇳🇬

A browser-based open-world game set in **Lagos, Nigeria** — built with Vite + Three.js + cannon-es.
Everything is generated from primitives at runtime: **no external assets, no backend, no database.**

This repository currently contains **Sprint 1: the playable foundation.**

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (production bundle in `dist/`), `npm run preview` (serve the bundle).

---

## Sprint 1 scope

A 500m × 500m stretch of Lagos soil with a danfo-yellow capsule that walks, sprints and jumps
under a full day/night cycle, viewed through a third-person camera.

| Requirement | Status | Where |
| --- | --- | --- |
| Vite + Three.js project structure | ✅ | `package.json`, `vite.config.js` |
| 500m × 500m flat sandy ground `#C2956C` | ✅ | `src/core/Renderer.js` |
| Hemisphere sky: `#0a0a2e` night → `#87CEEB` day | ✅ | `Renderer.js` (sky shader) |
| Directional sun that moves with time of day | ✅ | `Renderer.js` `updateEnvironment()` |
| Orange/red sunset near the horizon | ✅ | `Renderer.js` + `TimeSystem.twilight` |
| Yellow capsule player `#FFD700` | ✅ | `src/player/CharacterController.js` |
| WASD movement + mouse look | ✅ | `src/core/InputManager.js` |
| Third-person camera (behind & above) | ✅ | `CharacterController` camera rig |
| HUD with in-game clock in the top-left | ✅ | `index.html` + `src/main.js` |
| 24-minute full day/night cycle | ✅ | `src/world/TimeSystem.js` |
| 30fps floor, no external assets | ✅ | adaptive quality in `Renderer.setQualityTier()` |

Physics (`cannon-es`) backs the character: gravity, jumping, ground contacts and the invisible
walls at the edge of the world all come from the simulation rather than being faked in the
update loop. That world is the seam Sprint 2 grows into (traffic, buildings, pedestrians).

---

## Project layout

```
index.html                       entry page + HUD markup/styles
vite.config.js                   dev server (0.0.0.0, allowedHosts) & build config
package.json                     three, cannon-es, vite
src/
  main.js                        boot + frame loop + HUD updates
  core/
    Renderer.js                  WebGL renderer, camera, sky shader, soil ground, lights,
                                 stars, fog, adaptive quality tiers
    InputManager.js              keyboard (WASD/arrows/Shift/Space/Q/E/T/R) + mouse look
  player/
    CharacterController.js       capsule mesh + cannon-es body + third-person camera rig
  world/
    TimeSystem.js                the 24-real-minute day clock and sun path
```

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` / arrows | Move (camera-relative) |
| Mouse (click to capture the cursor) | Look — pointer lock, with click-and-drag as a fallback |
| `Q` / `E` | Turn the camera (keyboard-only play) |
| Mouse wheel | Zoom the third-person camera (3.2m – 16m) |
| `Shift` | Sprint |
| `Space` | Jump |
| `T` | Cycle time speed: ×1 → ×2 → ×5 → ×20 → ×60 |
| `R` | Respawn at the origin |
| `Esc` | Release the cursor |

**Time:** one in-game hour per real minute, so the full 24-hour day/night cycle takes exactly
**24 real minutes**. The world starts at 06:00 (dawn).

## How the day/night cycle works

`TimeSystem` maps real seconds to in-game hours and derives the sun's position:

```
theta = ((hours - 6) / 12) * π        // 06:00 sunrise (east) → 18:00 sunset (west)
sunDirection = (cos θ, sin θ, ~0.3)   // normalized, pointing towards the sun
```

From that single vector it publishes an environment snapshot — `elevation`, `daylight`,
`twilight`, `nightness` — which `Renderer.updateEnvironment()` consumes to drive:

* the sky shader (zenith ↔ horizon gradient + warm band around the sun + sun disc),
* the directional sun light (colour, intensity, position, shadow frustum),
* the hemisphere bounce light (which carries the warm dusk glow onto the ground),
* moonlight, star opacity and fog colour.

Nothing in the renderer knows what a "clock" is, and nothing in the clock knows what a
"shader" is, so later sprints can swap either side independently.

## Performance notes

* **Frame budget:** 9 draw calls and ~2.3k triangles for the whole scene; per-frame game logic
  (clock + physics + camera + environment) measured at **~0.07 ms** on a software rasteriser.
* **Allocation-free loop:** input, camera and environment snapshots reuse their objects, so the
  game does not churn the garbage collector.
* **Adaptive quality:** the game targets 60fps and enforces a 30fps floor — if the measured
  framerate dips below 45 it steps down (shadow map 2048 → 1024 → off, resolution scale
  1 → 0.85 → 0.65) and climbs back up when there is headroom. The active tier shows in the HUD.
* `dt` is clamped to 100ms, and physics runs on a fixed 1/60s timestep (max 3 substeps), so
  tab-switching or a slow frame can never teleport the player.

## Debug console

```js
Naija.time.setHours(18.4)        // jump to sunset
Naija.time.cycleTimeScale()      // speed up the clock
Naija.player.respawn(20, -35)    // teleport
Naija.renderer.setQualityTier(0) // force high quality
Naija.renderer.qualityTier       // current tier (0 = high)
```

## Roadmap (later sprints)

Danfo buses and okadas, real Lagos landmarks, NPCs with dialogue, traffic signals, sound,
save games, and a proper asset pipeline. Sprint 1 intentionally ships with none of these.
