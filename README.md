# FreeFall

A neon browser dropper game: steer through a cylindrical shaft, avoid moving hazards, collect stars, and land inside the target. A Three.js launch scene follows an LED ball from its ramp into Canvas-rendered gameplay.

**Status:** playable browser prototype. Not yet released on the App Store.

## Download and play

**Download `FreeFall.html`, double-click it, and press Play.**

1. Save the `FreeFall.html` download to your computer.
2. Open it in Chrome, Edge, Firefox, or Safari. If your computer asks which app to use, choose your web browser.
3. Select **Play current level**. Use the arrow keys or WASD to steer, or drag on the screen. Avoid obstacles, collect stars, and land on the target.

That's it. No installation, account, terminal, or internet connection is needed after downloading. The complete game is inside that one file, so you can keep it anywhere without managing extra folders. Desktop browsers are the recommended way to play; opening downloaded HTML files on phones depends on the device and file app.

Press **Escape** or the pause button for a break. If you want a slower start, choose **Practice** and lower the fall-speed slider. Complete campaign levels to unlock the next one, or choose **Infinite** for an endless run.

Progress saves in your current browser when browser storage is available. Keep using the same file location and browser to retain your progress. Private browsing, moving the file, or clearing browser data may reset your save.

### Getting the download from GitHub

The ready-to-play file is built by the **Check and package FreeFall** workflow. In this repository's **Actions** tab, open a successful run and download **FreeFall-download** under Artifacts (GitHub requires signing in). Extract the ZIP, then open `FreeFall.html`. Repository owners can also attach this file to a GitHub Release so players can download it without an account.

If you downloaded the source ZIP using **Code → Download ZIP**, extract the whole ZIP and open `index.html` instead. Keep the extracted files together.

## Controls

- WASD / arrow keys, or pointer dragging: steer.
- Escape / pause button: pause or resume.
- Choose a level, then select **Play current level** to launch.
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

The project was developed iteratively with AI coding assistance.

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

## Build the single-file download

Developers: run `npm run build` with Node.js 20 or newer. The ready-to-play file is written to `dist/FreeFall.html` with all scripts, styling, and the Three.js license included. Players do not need Node.js.

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

