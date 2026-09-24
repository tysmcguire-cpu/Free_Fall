# FreeFall

A neon browser dropper game: steer through a cylindrical shaft, avoid moving hazards, collect stars, and land inside the target. A Three.js launch scene follows an LED ball from its ramp into Canvas-rendered gameplay.

**Status:** playable browser prototype. Not yet released on the App Store.

## Play locally

Download or clone the repository and open `index.html` in a modern browser with WebGL support. Keep the files together. No build step, package installation, account, or runtime network connection is required; Three.js is bundled locally.

For a local development server, run:

```sh
python -m http.server 8000
```

Then open http://localhost:8000. Progress belongs to the browser and origin, so opening the file directly and playing through localhost can have separate saves.

## Controls

- WASD / arrow keys, or pointer dragging: steer.
- Escape / pause button: pause or resume.
- Choose a level, then select **Descend** to launch.
- Practice: adjust speed and save or restore a checkpoint.

## Modes

### Campaign

16 levels introduce additional hazard families and end with a staged finale. Complete each level to unlock the next. Three stars are available per course; successful campaign landings save the star record. Practice does not unlock levels or change campaign records.

| Difficulty | Levels |
| --- | --- |
| Beginner | 1–3 |
| Easy | 4–7 |
| Medium | 8–12 |
| Hard | 13–15 |
| Extreme | 16 |

### Infinite

Each run has a fresh obstacle sequence and palette seed. The difficulty schedule is fixed: a new stage every **6 seconds**, reaching its cap at **1:30**. Colors and wall designs blend between changes. At 1:30, randomized two-color palettes begin, with another palette every 12 seconds afterward.

Collect three stars to activate **God Mode** for six seconds: invincibility, 1.5× speed, extra star opportunities, and cycling colors. A bar beside the crosshair shows its remaining duration. The HUD tracks depth, stars, and difficulty. The best run stores depth and the star count from that same run; depth determines the record, with stars breaking exact-depth ties.

## Implementation

- **JavaScript / HTML / CSS:** application state, menus, input, local saves, and HUD.
- **Canvas 2D:** perspective-projected gameplay, effects, and landing platform.
- **Three.js 0.160.1:** procedural 3D ball, ramp, pit, lighting, and launch camera.
- **Seeded generation:** repeatable obstacle layouts for testing; a fresh seed for each Infinite run.
- **Local storage:** campaign completion, collected-star records, and Infinite best run. No backend or account system.

The project was developed manually with the help of AI coding assistance.

## Source map

| File | Purpose |
| --- | --- |
| `engine.js` | Level definitions, obstacle geometry, collisions, and Infinite generation |
| `game.js` | Game state, input, progression, Canvas rendering, and power-ups |
| `lobby3d.js` | Procedural Three.js lobby and launch sequence |
| `index.html`, `style.css` | Menus, HUD, and layout |
| `test.cjs` | Engine, collision, course, and finale checks |
| `infinite-test.cjs` | Difficulty boundaries, palettes, and generation checks |
| `smoke.cjs` | Mocked rendering and gameplay-state regression checks |

## Validation

With Node.js 20 or newer installed:

```sh
npm run check
npm test
```

No npm dependencies need to be installed. The GitHub Actions workflow runs the same checks on pushes and pull requests.

Tests cover campaign progression, practice isolation, collision rules, Infinite pacing, bounded obstacle streaming, God Mode activation and expiry, and launch handoff. The renderer tests use a mocked Canvas context; they do not verify actual browser visuals, WebGL performance, or touch ergonomics. Randomized courses still benefit from human playtesting.

## Prototype limitations

- Mobile device performance and App Store packaging remain to be validated.
- Saves are local to one browser/origin and can be lost if browser data is cleared.
- Progression is client-side game state, not a security boundary or competitive leaderboard.
- The former development admin-key unlock has been removed from this distribution.

## Third-party software

Bundled Three.js is covered by the MIT license in `THREE-LICENSE.txt`. No license is granted here for the original game code; choose a project license before inviting reuse or redistribution.
